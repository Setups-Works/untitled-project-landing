"use client";
import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";
import { faFolderPlus, faMagnifyingGlass, faPlus, faTableColumns } from "@fortawesome/free-solid-svg-icons";
import type { Chat } from "../../../lib/workspace";
import { prettyTitle } from "../../../lib/chat";

const SHOWN = 8;

/**
 * The closed chat sidebar on desktop: a slim rail of icons (new chat, folder, search) and the latest chats as round
 * initials. Shown by CSS only while the sidebar is closed; on phones the full list opens as a drawer instead.
 */
export default function ChatRail({
  chats,
  activeId,
  onOpen,
  onNew,
  onSearch,
  onAddFolder,
  onExpand,
}: {
  chats: Chat[];
  activeId: string | null;
  onOpen: (id: string) => void;
  onNew: () => void;
  onSearch: () => void;
  onAddFolder: () => void;
  onExpand: () => void;
}) {
  const recent = [...chats].sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updated_at.localeCompare(a.updated_at)).slice(0, SHOWN);
  return (
    <nav className="cx-rail cx-side at-sand" aria-label="Chats (collapsed)">
      <button className="ne-btn" aria-label="Show sidebar" title="Show sidebar" onClick={onExpand}>
        <FA icon={faTableColumns} />
      </button>
      <button className="cx-rail-btn" aria-label="New chat" title="New chat" onClick={onNew}>
        <FA icon={faPlus} />
      </button>
      <button className="cx-rail-btn" aria-label="New folder" title="New folder" onClick={onAddFolder}>
        <FA icon={faFolderPlus} />
      </button>
      <button className="cx-rail-btn" aria-label="Search" title="Search" onClick={onSearch}>
        <FA icon={faMagnifyingGlass} />
      </button>
      {recent.length > 0 && <hr className="cx-rail-sep" />}
      {recent.map((c) => {
        const t = prettyTitle(c.title);
        return (
          <button
            key={c.id}
            className="cx-rail-btn cx-rail-chat"
            data-on={c.id === activeId}
            aria-current={c.id === activeId ? "page" : undefined}
            aria-label={t}
            title={t}
            onClick={() => onOpen(c.id)}
          >
            {t.charAt(0).toUpperCase() || "?"}
          </button>
        );
      })}
    </nav>
  );
}
