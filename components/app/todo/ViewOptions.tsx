"use client";
import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";
import { faCalendarDays, faListUl, faTableColumns, faXmark } from "@fortawesome/free-solid-svg-icons";
import type { ViewOpts } from "../../../lib/tasks";
import { PRIORITIES } from "../../../lib/tasks";

const LAYOUTS: [ViewOpts["layout"], string, typeof faListUl][] = [["list", "List", faListUl], ["board", "Board", faTableColumns], ["calendar", "Calendar", faCalendarDays]];

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="vo-row"><span>{label}</span>{children}</label>;
}

export default function ViewOptions({ opts, onChange, onReset, onClose, layouts }: {
  opts: ViewOpts; onChange: (p: Partial<ViewOpts>) => void; onReset: () => void; onClose: () => void; layouts: boolean;
}) {
  return (
    <div className="vo" role="dialog" aria-label="View options">
      <div className="vo-head"><b>View</b><button className="ne-btn" aria-label="Close view options" onClick={onClose}><FA icon={faXmark} /></button></div>

      {layouts && (
        <>
          <div className="vo-h">Layout</div>
          <div className="vo-layouts" role="group" aria-label="Layout">
            {LAYOUTS.map(([k, l, icon]) => (
              <button key={k} data-on={opts.layout === k} aria-pressed={opts.layout === k} onClick={() => onChange({ layout: k })}><FA icon={icon} />{l}</button>
            ))}
          </div>
        </>
      )}

      <div className="vo-row vo-switch">
        <span id="vo-completed">Completed tasks</span>
        <button role="switch" aria-checked={opts.showCompleted} aria-labelledby="vo-completed" data-on={opts.showCompleted} onClick={() => onChange({ showCompleted: !opts.showCompleted })}><i /></button>
      </div>

      <div className="vo-h">Sort</div>
      <Row label="Sort by">
        <select value={opts.sortBy} onChange={(e) => onChange({ sortBy: e.target.value as ViewOpts["sortBy"] })}>
          <option value="date">Date</option><option value="priority">Priority</option><option value="name">Name</option><option value="created">Date added</option>
        </select>
      </Row>
      <Row label="Direction">
        <select value={opts.dir} onChange={(e) => onChange({ dir: e.target.value as ViewOpts["dir"] })}>
          <option value="asc">Ascending</option><option value="desc">Descending</option>
        </select>
      </Row>
      <Row label="Group by">
        <select value={opts.groupBy} onChange={(e) => onChange({ groupBy: e.target.value as ViewOpts["groupBy"] })}>
          <option value="none">None</option><option value="date">Date</option><option value="priority">Priority</option><option value="list">List</option>
        </select>
      </Row>

      <div className="vo-h">Filter by</div>
      <Row label="Priority">
        <select value={opts.priority} onChange={(e) => onChange({ priority: Number(e.target.value) as ViewOpts["priority"] })}>
          <option value={0}>All</option>
          {PRIORITIES.map((p) => <option key={p.p} value={p.p}>P{p.p} · {p.label}</option>)}
        </select>
      </Row>

      <button className="vo-reset" onClick={onReset}>Reset all</button>
    </div>
  );
}
