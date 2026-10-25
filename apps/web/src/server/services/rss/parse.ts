import "server-only";
import { XMLParser } from "fast-xml-parser";
import { RSS } from "@untitled/logic/rss";

/**
 * Turns RSS 2.0, RSS 1.0 (RDF) and Atom into one shape. Everything that comes out is plain text or a checked http(s) address:
 * feed HTML is stripped here and never stored, so nothing in a feed can run in the reader.
 */
export type ParsedItem = {
  guid: string;
  title: string;
  link: string | null;
  summary: string;
  content: string;
  imageUrl: string | null;
  author: string | null;
  publishedAt: string;
};
export type ParsedFeed = { title: string; siteUrl: string | null; description: string; imageUrl: string | null; items: ParsedItem[] };

type Node = Record<string, unknown>;

const xml = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_", textNodeName: "#text", trimValues: true });

const list = <T>(v: T | T[] | undefined | null): T[] => (v === undefined || v === null ? [] : Array.isArray(v) ? v : [v]);
const isNode = (v: unknown): v is Node => typeof v === "object" && v !== null;

/** The text of a node that may be a string, a number, or `{ "#text": … }` with attributes. */
function text(v: unknown): string {
  if (typeof v === "string") return v;
  if (typeof v === "number") return String(v);
  if (Array.isArray(v)) return text(v[0]);
  if (isNode(v)) return text(v["#text"]);
  return "";
}

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", hellip: "…", mdash: "—", ndash: "–", rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“" };
const decode = (s: string) =>
  s.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (m, e: string) => {
    if (e[0] === "#") {
      const code = e[1]?.toLowerCase() === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(code) && code > 0 && code < 0x110000 ? String.fromCodePoint(code) : "";
    }
    return ENTITIES[e.toLowerCase()] ?? m;
  });

/** HTML → readable plain text: blocks become paragraphs, scripts and styles disappear, tags are dropped. */
export function htmlToText(html: string): string {
  return decode(
    html
      .replace(/<(script|style)[\s\S]*?<\/\1>/gi, "")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|li|h[1-6]|blockquote|tr)>/gi, "\n\n")
      .replace(/<li[^>]*>/gi, "• ")
      .replace(/<[^>]+>/g, ""),
  )
    .replace(/[ \t]+/g, " ")
    .replace(/ ?\n ?/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** A checked http(s) address (resolved against `base`), or null. */
function webUrl(v: unknown, base?: string): string | null {
  const raw = text(v).trim();
  if (!raw) return null;
  try {
    const u = new URL(raw, base);
    return u.protocol === "http:" || u.protocol === "https:" ? u.toString().slice(0, 2048) : null;
  } catch {
    return null;
  }
}

const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);
const firstImage = (html: string, base?: string) => webUrl(/<img[^>]+src=["']([^"']+)["']/i.exec(html)?.[1], base);

function atomLink(links: unknown, base?: string): string | null {
  const all = list(links).filter(isNode);
  const pick = all.find((l) => !l["@_rel"] || l["@_rel"] === "alternate") ?? all[0];
  return pick ? webUrl(pick["@_href"], base) : null;
}

function itemImage(it: Node, html: string, base?: string): string | null {
  for (const m of list(it["media:content"]).concat(list(it["media:thumbnail"]), list(it["media:group"]))) {
    if (!isNode(m)) continue;
    const kind = String(m["@_medium"] ?? m["@_type"] ?? "image");
    if (kind.startsWith("image") || kind === "image") {
      const u = webUrl(m["@_url"], base);
      if (u) return u;
    }
  }
  for (const e of list(it.enclosure).filter(isNode)) {
    if (String(e["@_type"] ?? "").startsWith("image")) {
      const u = webUrl(e["@_url"], base);
      if (u) return u;
    }
  }
  const itunes = isNode(it["itunes:image"]) ? webUrl(it["itunes:image"]["@_href"], base) : null;
  return itunes ?? firstImage(html, base);
}

function authorOf(it: Node): string | null {
  const a = it["dc:creator"] ?? it.author;
  const name = isNode(a) ? text(a.name) : text(a);
  return name ? clip(decode(name), 200) : null;
}

function parseItem(it: Node, base: string): ParsedItem {
  const html = text(it["content:encoded"]) || text(it.content) || text(it.description) || text(it.summary);
  const plain = htmlToText(html);
  const title = clip(htmlToText(text(it.title)), 500) || clip(plain, 120) || "Untitled";
  const link = isNode(it.link) || Array.isArray(it.link) ? atomLink(it.link, base) : webUrl(it.link, base);
  const dateRaw = text(it.pubDate) || text(it["dc:date"]) || text(it.published) || text(it.updated);
  const date = new Date(dateRaw);
  const publishedAt = Number.isNaN(date.getTime()) || date.getTime() > Date.now() + 86_400_000 ? new Date() : date;
  const guid = text(it.guid) || text(it.id) || link || `${title}|${publishedAt.toISOString()}`;
  return {
    guid: guid.slice(0, 2048),
    title,
    link,
    summary: clip(plain.replace(/\s+/g, " "), RSS.summaryLength),
    content: clip(plain, RSS.contentLength),
    imageUrl: itemImage(it, html, base),
    author: authorOf(it),
    publishedAt: publishedAt.toISOString(),
  };
}

/** Throws when the text is not a feed (the caller then looks for a feed link in a web page). */
export function parseFeed(body: string, base: string): ParsedFeed {
  const doc = xml.parse(body) as Node;
  const rss = isNode(doc.rss) ? doc.rss : null;
  const rdf = isNode(doc["rdf:RDF"]) ? doc["rdf:RDF"] : null;
  const atom = isNode(doc.feed) ? doc.feed : null;
  const channel = rss ? (rss.channel as Node | undefined) : rdf ? (rdf.channel as Node | undefined) : atom;
  if (!channel || !isNode(channel)) throw new Error("not a feed");
  const rawItems = list((rss ? channel.item : rdf ? rdf.item : atom?.entry) as Node | Node[] | undefined).filter(isNode);
  const image = isNode(channel.image) ? webUrl(channel.image.url, base) : null;
  const siteUrl = atom ? atomLink(channel.link, base) : webUrl(channel.link, base);
  return {
    title: clip(htmlToText(text(channel.title)), 300),
    siteUrl,
    description: clip(htmlToText(text(channel.description) || text(channel.subtitle)), 2000),
    imageUrl: image ?? webUrl(channel.logo ?? channel.icon, base) ?? (isNode(channel["itunes:image"]) ? webUrl(channel["itunes:image"]["@_href"], base) : null),
    items: rawItems.map((it) => parseItem(it, base)).slice(0, RSS.itemsPerFeed),
  };
}

/** The first feed a web page advertises with `<link rel="alternate" type="application/rss+xml" href="…">`. */
export function findFeedLink(html: string, base: string): string | null {
  for (const tag of html.match(/<link\b[^>]*>/gi) ?? []) {
    if (!/rel=["']?alternate/i.test(tag) || !/type=["']?application\/(rss|atom)\+xml/i.test(tag)) continue;
    const href = /href=["']([^"']+)["']/i.exec(tag)?.[1];
    const url = webUrl(href ? decode(href) : "", base);
    if (url) return url;
  }
  return null;
}
