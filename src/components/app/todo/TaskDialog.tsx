"use client";
import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";
import { faBoxArchive, faBan, faCircleCheck, faRotateLeft, faTrash, faXmark } from "@fortawesome/free-solid-svg-icons";
import type { Task, TaskList } from "../../../lib/workspace";
import type { Draft } from "../../../lib/tasks";
import Modal from "../../ui/Modal";
import TaskForm from "./TaskForm";

/** Quick add (task = null) and edit (task = the task) share one dialog. */
export default function TaskDialog({
  task,
  initial,
  lists,
  onSave,
  onClose,
  onToggle,
  onCancelTask,
  onArchive,
  onDelete,
}: {
  task: Task | null;
  initial: Draft;
  lists: TaskList[];
  onSave: (d: Draft) => Promise<void>;
  onClose: () => void;
  onToggle?: (t: Task) => void;
  onCancelTask?: (t: Task) => void;
  onArchive?: (t: Task) => void;
  onDelete?: (t: Task) => void;
}) {
  return (
    <Modal label={task ? "Edit task" : "Add task"} onClose={onClose}>
      <div className="td">
        <div className="td-head">
          <h2 className="h3">{task ? "Edit task" : "Add task"}</h2>
          <button className="ne-btn" aria-label="Close" onClick={onClose}>
            <FA icon={faXmark} />
          </button>
        </div>
        <TaskForm
          initial={initial}
          lists={lists}
          submitLabel={task ? "Save" : "Add task"}
          onSubmit={async (d) => {
            await onSave(d);
            onClose();
          }}
          onCancel={onClose}
        />
        {task && (
          <div className="td-extra">
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => {
                onToggle?.(task);
                onClose();
              }}
            >
              <FA icon={task.done ? faRotateLeft : faCircleCheck} /> {task.done ? "Mark not done" : "Complete"}
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => {
                onCancelTask?.(task);
                onClose();
              }}
            >
              <FA icon={task.cancelled ? faRotateLeft : faBan} /> {task.cancelled ? "Restore" : "Cancel task"}
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => {
                onArchive?.(task);
                onClose();
              }}
            >
              <FA icon={task.archived ? faRotateLeft : faBoxArchive} /> {task.archived ? "Unarchive" : "Archive"}
            </button>
            <button className="btn btn-secondary btn-sm td-del" onClick={() => onDelete?.(task)}>
              <FA icon={faTrash} /> Delete
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}
