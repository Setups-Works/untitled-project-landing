import { describe, expect, it } from "vitest";
import { settleBlocks } from "../../src/server/services/ai/chat";

const block = (o: object) => `<create-item>${JSON.stringify(o)}</create-item>`;
const bodyOf = (text: string) => {
  const m = /<create-item>([\s\S]*?)<\/create-item>/.exec(text);
  return m ? (JSON.parse(m[1]) as { kind: string; title: string; body?: string }) : null;
};

describe("settleBlocks (tidying the assistant's draft blocks)", () => {
  const code = "```python\ndef reverse(s):\n    return s[::-1]\n```";

  it("fills {{reply}} with what the assistant wrote in this reply", () => {
    const text = `Here is a poem.\nRoses are red\nViolets are blue\n${block({ kind: "note", title: "Poem", body: "{{reply}}" })}`;
    const b = bodyOf(settleBlocks(text, ""));
    expect(b?.body).toContain("Roses are red");
    expect(b?.body).not.toContain("create-item");
  });

  it("uses the earlier answer for a follow-up that only confirms, whichever placeholder was used", () => {
    const earlier = `Here is the function:\n${code}\nIt reverses a string by slicing.`;
    for (const placeholder of ["{{previous}}", "{{reply}}"]) {
      const reply = `Done, it's a draft.\n${block({ kind: "note", title: "Reverse", body: placeholder })}`;
      expect(bodyOf(settleBlocks(reply, earlier))?.body).toContain("def reverse");
    }
  });

  it("keeps real new content instead of the earlier answer", () => {
    const earlier = "x".repeat(2000);
    const reply = `Autumn\nLeaves fall\nSoftly down\nSilent ground\nMore lines here to make it clearly content, not a confirmation, ok\n${block({ kind: "note", title: "Poem", body: "{{reply}}" })}`;
    expect(bodyOf(settleBlocks(reply, earlier))?.body).toContain("Leaves fall");
  });

  it("rescues a note block whose JSON broke (code copied into the body)", () => {
    const earlier = `Here is the page:\n${code}\nUse it as a starting point.`;
    const broken = `Saved as a draft.\n<create-item>{"kind":"note","title":"Login page","body":"<form action="x">oops "quotes" and\nnewlines</create-item>`;
    const b = bodyOf(settleBlocks(broken, earlier));
    expect(b?.title).toBe("Login page");
    expect(b?.body).toContain("def reverse");
  });

  it("rescues a block that was never closed because the answer ran out of room", () => {
    const earlier = `Here you go:\n${code}\nDone.`;
    const open = `Okay.\n<create-item>{"kind":"note","title":"Reverse function","body":"def reverse(s): retu`;
    const out = settleBlocks(open, earlier);
    expect(bodyOf(out)?.title).toBe("Reverse function");
    expect(out.match(/<create-item>/g)).toHaveLength(1);
  });

  it("drops a broken block that isn't a note", () => {
    expect(settleBlocks('Sure.\n<create-item>{"kind":"task","title":"x"</create-item>', "")).not.toContain("create-item");
  });

  it("leaves a valid block alone", () => {
    const valid = block({ kind: "task", ref: "t1", title: "Call Sam", description: "", due_date: "2026-10-09" });
    expect(settleBlocks(`Here.\n${valid}`, "earlier")).toContain(valid);
  });
});
