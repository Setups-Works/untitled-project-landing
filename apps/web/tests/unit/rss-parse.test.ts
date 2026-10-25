import { describe, expect, it } from "vitest";
import { findFeedLink, htmlToText, parseFeed } from "../../src/server/services/rss/parse";
import { safeGet } from "../../src/server/services/rss/safeFetch";

const BASE = "https://example.com/feed.xml";

const RSS2 = `<?xml version="1.0"?><rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:dc="http://purl.org/dc/elements/1.1/">
<channel><title>Example &amp; Co</title><link>https://example.com</link><description>News</description>
<image><url>https://example.com/logo.png</url></image>
<item><title>First</title><link>/posts/1</link><guid>g1</guid><pubDate>Mon, 05 Oct 2026 10:00:00 GMT</pubDate><dc:creator>Sam</dc:creator>
<media:thumbnail url="https://example.com/t.jpg"/><content:encoded><![CDATA[<p>Hello <b>world</b></p><script>alert(1)</script><p>Second</p>]]></content:encoded></item>
<item><title>No image</title><description>&lt;img src="/inline.png"&gt; text</description></item></channel></rss>`;

const ATOM = `<?xml version="1.0"?><feed xmlns="http://www.w3.org/2005/Atom"><title>Atom blog</title><link href="https://a.test/" rel="alternate"/>
<entry><title>Entry</title><id>urn:1</id><link rel="alternate" href="https://a.test/e1"/><updated>2026-10-01T00:00:00Z</updated><summary>Short</summary><author><name>Ann</name></author></entry></feed>`;

describe("parseFeed", () => {
  it("reads RSS 2.0: titles, absolute links, images, plain text", () => {
    const f = parseFeed(RSS2, BASE);
    expect(f.title).toBe("Example & Co");
    expect(f.imageUrl).toBe("https://example.com/logo.png");
    expect(f.items).toHaveLength(2);
    const [a, b] = f.items;
    expect(a).toMatchObject({ guid: "g1", link: "https://example.com/posts/1", author: "Sam", imageUrl: "https://example.com/t.jpg" });
    expect(a!.content).toBe("Hello world\n\nSecond");
    expect(a!.content).not.toContain("alert");
    expect(b!.imageUrl).toBe("https://example.com/inline.png");
  });

  it("reads Atom", () => {
    const f = parseFeed(ATOM, "https://a.test/feed");
    expect(f.siteUrl).toBe("https://a.test/");
    expect(f.items[0]).toMatchObject({ guid: "urn:1", link: "https://a.test/e1", author: "Ann", summary: "Short" });
  });

  it("rejects non-feeds and drops non-http links", () => {
    expect(() => parseFeed("<html><body>hi</body></html>", BASE)).toThrow();
    const f = parseFeed(`<rss><channel><title>t</title><item><title>x</title><link>javascript:alert(1)</link></item></channel></rss>`, BASE);
    expect(f.items[0]!.link).toBeNull();
  });
});

describe("helpers", () => {
  it("finds an advertised feed in a page", () => {
    const html = `<head><link rel="alternate" type="application/rss+xml" href="/rss"></head>`;
    expect(findFeedLink(html, "https://site.test/blog")).toBe("https://site.test/rss");
  });
  it("strips markup", () => expect(htmlToText("<p>a &amp; b</p><style>x{}</style>")).toBe("a & b"));
});

describe("safeGet", () => {
  it.each(["http://127.0.0.1/feed", "http://localhost/feed", "http://169.254.169.254/latest", "http://[::1]/", "file:///etc/passwd", "http://user:pw@example.com/"])(
    "refuses %s",
    async (url) => {
      await expect(safeGet(url)).rejects.toThrow();
    },
  );
});

describe("safeGet address checks", () => {
  it("refuses private IPv6 and IPv4-mapped literals", async () => {
    for (const url of ["http://[::ffff:127.0.0.1]/", "http://[::ffff:10.0.0.1]/", "http://[fd00::1]/", "http://[fe80::1]/"]) await expect(safeGet(url)).rejects.toThrow();
  });
});
