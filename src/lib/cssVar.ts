/**
 * A canvas can't read `var(--x)`, so drawing code resolves a design token to a concrete colour here:
 * `ctx.fillStyle = tokenColor("var(--green-fg)")`. Any CSS colour is accepted and returned as the browser computes it.
 * Browser only (reads the document's computed style).
 */
export function tokenColor(color: string): string {
  const probe = document.createElement("span");
  probe.style.color = color;
  document.body.appendChild(probe);
  const resolved = getComputedStyle(probe).color;
  probe.remove();
  return resolved || color;
}
