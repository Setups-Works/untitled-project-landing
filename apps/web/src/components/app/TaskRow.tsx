"use client";
import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";
import { faCheck, faTrash } from "@fortawesome/free-solid-svg-icons";
import type { Task } from "../../lib/workspace";
import { daysBetween, dayLabel } from "../../lib/dates";

export default function TaskRow({
  task,
  today,
  mode,
  onToggle,
  onDelete,
}: {
  task: Task;
  today: string;
  mode: "overdue" | "today" | "upcoming" | "plain";
  onToggle: (t: Task) => void;
  onDelete?: (t: Task) => void;
}) {
  const right =
    mode === "overdue" && task.due_date
      ? `${daysBetween(task.due_date, today)}d ago`
      : mode === "upcoming" || mode === "plain"
        ? task.due_date
          ? dayLabel(task.due_date, today)
          : ""
        : "";
  return (
    <li className="ap-task" data-done={task.done} data-mode={mode}>
      <button
        className="ap-check"
        role="checkbox"
        aria-checked={task.done}
        aria-label={`Mark “${task.title}” ${task.done ? "not done" : "done"}`}
        onClick={() => onToggle(task)}
      >
        {task.done && <FA icon={faCheck} />}
      </button>
      <span className="ap-task-t">{task.title}</span>
      {right && <small className="ap-task-d">{right}</small>}
      {onDelete && (
        <button className="icon-btn ap-del" aria-label={`Delete “${task.title}”`} onClick={() => onDelete(task)}>
          <FA icon={faTrash} />
        </button>
      )}
    </li>
  );
}
