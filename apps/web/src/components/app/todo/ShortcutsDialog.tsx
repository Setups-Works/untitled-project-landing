"use client";
import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import Modal from "../../ui/Modal";

type Row = [string, string[][]];
const GENERAL: Row[] = [
  ["Quick add", [["Q"]]],
  ["Add task at the end of the view", [["A"]]],
  ["Toggle sidebar", [["M"]]],
  ["Search", [["/"]]],
  ["Search everything", [["Ctrl", "K"]]],
  ["Keyboard shortcuts", [["?"]]],
  ["Close editor, popover or dialog", [["Esc"]]],
];
const NAV: Row[] = [
  ["Go to Today", [["G", "then", "T"]]],
  ["Go to Upcoming", [["G", "then", "U"]]],
  ["Go to Inbox", [["G", "then", "I"]]],
  ["Go to Filters", [["G", "then", "F"]]],
  ["Move between tasks", [["↑", "+", "↓"]]],
];
const TASK: Row[] = [
  ["Open the focused task", [["Enter"]]],
  ["Edit the focused task", [["E"]]],
  ["Schedule the focused task", [["T"]]],
  ["Set priority, Urgent to Low", [["1", "to", "4"]]],
  ["Select tasks", [["Ctrl", "+", "Click"]]],
];

const Keys = ({ k }: { k: string[] }) => (
  <span className="sc-keys">
    {k.map((x, i) => (["then", "to", "+"].includes(x) ? <small key={i}>{x}</small> : <kbd key={i}>{x}</kbd>))}
  </span>
);
const Block = ({ title, rows }: { title: string; rows: Row[] }) => (
  <section>
    <h3>{title}</h3>
    <ul>
      {rows.map(([l, k]) => (
        <li key={l}>
          <span>{l}</span>
          <Keys k={k[0]} />
        </li>
      ))}
    </ul>
  </section>
);

export default function ShortcutsDialog({ onClose }: { onClose: () => void }) {
  return (
    <Modal label="Keyboard shortcuts" onClose={onClose} size="lg">
      <div className="sc">
        <div className="sc-head">
          <div>
            <h2 className="h3">Keyboard shortcuts</h2>
            <p className="meta">Shortcuts work whenever you are not typing in a field. On a Mac, use ⌘ in place of Ctrl.</p>
          </div>
          <button className="ne-btn" aria-label="Close" onClick={onClose}>
            <FA icon={faXmark} />
          </button>
        </div>
        <div className="sc-cols">
          <div>
            <Block title="General" rows={GENERAL} />
            <Block title="Task" rows={TASK} />
          </div>
          <div>
            <Block title="Navigation" rows={NAV} />
          </div>
        </div>
      </div>
    </Modal>
  );
}
