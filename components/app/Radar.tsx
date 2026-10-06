import type { Axis } from "../../lib/insights";

/** Radar chart for any number of labelled 0–100 measures. */
export default function Radar({ axes }: { axes: Axis[] }) {
  const C = 150, R = 84, n = axes.length;
  const pt = (i: number, v: number) => {
    const a = (Math.PI * 2 * i) / n - Math.PI / 2;
    return [C + Math.cos(a) * R * (v / 100), C + Math.sin(a) * R * (v / 100)] as const;
  };
  const ring = (v: number) => axes.map((_, i) => pt(i, v).join(",")).join(" ");
  const shape = axes.map((a, i) => pt(i, Math.max(5, a.value)).join(",")).join(" ");
  return (
    <svg viewBox="0 0 300 300" className="ap-radar" role="img" aria-label={`Profile chart: ${axes.map((a) => `${a.label} ${a.value}`).join(", ")}`}>
      {[25, 50, 75, 100].map((v) => <polygon key={v} points={ring(v)} className="ap-radar-ring" />)}
      {axes.map((_, i) => <line key={i} x1={C} y1={C} x2={pt(i, 100)[0]} y2={pt(i, 100)[1]} className="ap-radar-ring" />)}
      <polygon points={shape} className="ap-radar-shape" />
      {axes.map((a, i) => {
        const [x, y] = pt(i, 100);
        const dx = x - C, dy = y - C;
        const [lx, ly] = [C + dx * 1.2, C + dy * 1.2];
        return (
          <text key={a.key} x={lx} y={ly} textAnchor={Math.abs(dx) < 4 ? "middle" : dx > 0 ? "start" : "end"} dominantBaseline="central" className="ap-radar-l">
            {a.label}
          </text>
        );
      })}
    </svg>
  );
}
