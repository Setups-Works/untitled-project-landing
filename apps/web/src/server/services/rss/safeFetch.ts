import "server-only";
import dns from "node:dns";
import http from "node:http";
import https from "node:https";
import net from "node:net";
import zlib from "node:zlib";
import type { Readable } from "node:stream";
import { RSS } from "@untitled/logic/rss";
import { ValidationError } from "../../errors";

/**
 * Fetches a feed address the person typed. That address is untrusted: without these checks it could point the server at its own
 * database, the cloud metadata service or another machine on the private network (SSRF). So: http(s) only, no credentials in the
 * address, and the address the name resolves to is checked at connect time (not before, which a DNS rebind could slip past) on
 * every redirect hop. Size and time are capped.
 */
const NOT_PUBLIC: [string, number, "ipv4" | "ipv6"][] = [
  ["0.0.0.0", 8, "ipv4"],
  ["10.0.0.0", 8, "ipv4"],
  ["100.64.0.0", 10, "ipv4"], // carrier-grade NAT
  ["127.0.0.0", 8, "ipv4"],
  ["169.254.0.0", 16, "ipv4"], // link-local, cloud metadata
  ["172.16.0.0", 12, "ipv4"],
  ["192.0.0.0", 24, "ipv4"],
  ["192.168.0.0", 16, "ipv4"],
  ["198.18.0.0", 15, "ipv4"],
  ["224.0.0.0", 4, "ipv4"],
  ["240.0.0.0", 4, "ipv4"],
  ["::", 128, "ipv6"],
  ["::1", 128, "ipv6"],
  ["fc00::", 7, "ipv6"],
  ["fe80::", 10, "ipv6"],
  ["ff00::", 8, "ipv6"],
];
const blocklist = new net.BlockList();
for (const [net_, prefix, family] of NOT_PUBLIC) blocklist.addSubnet(net_, prefix, family);

const isPublic = (address: string) => {
  const family = net.isIP(address);
  return family !== 0 && !blocklist.check(address, family === 6 ? "ipv6" : "ipv4");
};
const refuse = () => new ValidationError("That address can’t be reached from here.");

/** `lookup` for http.request: resolves the name and refuses it when any answer is a private address. */
const publicOnlyLookup: net.LookupFunction = (hostname, options, callback) => {
  dns.lookup(hostname, { all: true }, (err, answers) => {
    if (err) return callback(err, "", 4);
    if (!answers.length || !answers.every((a) => isPublic(a.address))) return callback(refuse(), "", 4);
    if (options.all) return (callback as unknown as (e: null, a: dns.LookupAddress[]) => void)(null, answers);
    callback(null, answers[0]!.address, answers[0]!.family);
  });
};

type Fetched = { url: string; body: string };

function readBody(res: http.IncomingMessage): Promise<string> {
  const encoding = String(res.headers["content-encoding"] ?? "").toLowerCase();
  let stream: Readable = res;
  if (encoding === "gzip") stream = res.pipe(zlib.createGunzip());
  else if (encoding === "deflate") stream = res.pipe(zlib.createInflate());
  else if (encoding === "br") stream = res.pipe(zlib.createBrotliDecompress());
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    stream.on("data", (c: Buffer) => {
      size += c.length;
      if (size > RSS.maxFeedBytes) {
        res.destroy();
        reject(new ValidationError("That feed is too large."));
      } else chunks.push(c);
    });
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    stream.on("error", () => reject(new ValidationError("Couldn’t read that feed.")));
  });
}

function once(url: URL, accept: string): Promise<{ status: number; location?: string; body: string }> {
  return new Promise((resolve, reject) => {
    const lib = url.protocol === "https:" ? https : http;
    const req = lib.request(
      url,
      {
        method: "GET",
        lookup: publicOnlyLookup,
        timeout: RSS.fetchTimeoutMs,
        headers: { accept, "accept-encoding": "gzip, deflate, br", "user-agent": "untitled-project-reader" },
      },
      (res) => {
        const status = res.statusCode ?? 0;
        if (status >= 300 && status < 400) {
          res.resume();
          return resolve({ status, location: res.headers.location, body: "" });
        }
        readBody(res).then((body) => resolve({ status, body }), reject);
      },
    );
    req.on("timeout", () => req.destroy(new ValidationError("That site took too long to answer.")));
    req.on("error", (e) => reject(e instanceof ValidationError ? e : new ValidationError("Couldn’t reach that address.")));
    req.end();
  });
}

export async function safeGet(address: string, accept = "application/rss+xml, application/atom+xml, application/xml, text/xml, text/html;q=0.5"): Promise<Fetched> {
  let url: URL;
  try {
    url = new URL(address);
  } catch {
    throw new ValidationError("That doesn’t look like a web address.");
  }
  for (let hop = 0; hop <= RSS.maxRedirects; hop++) {
    if ((url.protocol !== "http:" && url.protocol !== "https:") || url.username || url.password) throw refuse();
    const host = url.hostname.replace(/^\[|\]$/g, "");
    if (net.isIP(host) && !isPublic(host)) throw refuse();
    const res = await once(url, accept);
    if (res.location) {
      try {
        url = new URL(res.location, url);
      } catch {
        throw new ValidationError("That address redirects somewhere invalid.");
      }
      continue;
    }
    if (res.status < 200 || res.status >= 300) throw new ValidationError("That site didn’t return a feed.");
    return { url: url.toString(), body: res.body };
  }
  throw new ValidationError("That address redirects too many times.");
}
