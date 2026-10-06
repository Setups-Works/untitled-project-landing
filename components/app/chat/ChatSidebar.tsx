"use client";
import { useEffect, useState } from "react";
import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";
import {
  faCheck, faChevronDown, faChevronRight, faClone, faDownload, faEllipsis, faEnvelope, faEnvelopeOpen, faEraser, faFolder, faFolderPlus, faShareNodes, faMagnifyingGlass, faPen, faPlus, faTableColumns, faThumbtack, faTrash,
} from "@fortawesome/free-solid-svg-icons";
import type { Chat, ChatFolder } from "../../../lib/workspace";
import { ageShort, groupByDate, isUnread, prettyTitle } from "../../../lib/chat";
import Menu from "../Menu";

export type Tab = "all" | "unread";

export type SidebarProps = {
  chats: Chat[]; folders: ChatFolder[]; activeId: string | null; tab: Tab; ready: boolean;
  onTab: (t: Tab) => void; onOpen: (id: string) => void; onNew: () => void; onSearch: () => void; onCollapse: () => void;
  onAddFolder: () => void; onRenameFolder: (f: ChatFolder) => void; onDeleteFolder: (f: ChatFolder) => void;
  onPin: (c: Chat) => void; onRename: (c: Chat) => void; onMove: (c: Chat, folderId: string | null) => void; onDelete: (c: Chat) => void;
  onRead: (c: Chat, read: boolean) => void; onDuplicate: (c: Chat) => void; onShare: (c: Chat) => void; onExport: (c: Chat) => void; onClear: (c: Chat) => void;
};

function Row({ c, p }: { c: Chat; p: SidebarProps }) {
  const unread = isUnread(c) && c.id !== p.activeId;
  return (
    <li className="cx-row" data-on={c.id === p.activeId} data-unread={unread}>
      <button className="cx-row-main" aria-current={c.id === p.activeId ? "page" : undefined} onClick={() => p.onOpen(c.id)}>
        {c.pinned && <FA icon={faThumbtack} className="cx-pin" />}
        <span className="cx-row-t">{prettyTitle(c.title)}</span>
        {unread && <i className="cx-dot" aria-label="Unread" />}
        <small>{ageShort(c.updated_at)}</small>
      </button>
      <Menu label={`Options for ${c.title}`} trigger={<FA icon={faEllipsis} />} fixed className="cx-row-menu">
        {(close) => (
          <>
            <button role="menuitem" onClick={() => { close(); p.onPin(c); }}><span><FA icon={faThumbtack} /> {c.pinned ? "Unpin" : "Pin"}</span></button>
            <button role="menuitem" onClick={() => { close(); p.onRename(c); }}><span><FA icon={faPen} /> Rename</span></button>
            {c.id !== p.activeId && (
              <button role="menuitem" onClick={() => { close(); p.onRead(c, unread); }}>
                <span><FA icon={unread ? faEnvelopeOpen : faEnvelope} /> {unread ? "Mark as read" : "Mark as unread"}</span>
              </button>
            )}
            <button role="menuitem" onClick={() => { close(); p.onDuplicate(c); }}><span><FA icon={faClone} /> Duplicate</span></button>
            <button role="menuitem" onClick={() => { close(); p.onShare(c); }}><span><FA icon={faShareNodes} /> {c.share_token ? "Manage shared link" : "Share"}</span></button>
            <button role="menuitem" onClick={() => { close(); p.onExport(c); }}><span><FA icon={faDownload} /> Export as Markdown</span></button>
            {p.folders.length > 0 && (
              <>
                <div className="ap-pop-h">Move to folder</div>
                {c.folder_id && <button role="menuitem" onClick={() => { close(); p.onMove(c, null); }}><span>No folder</span></button>}
                {p.folders.map((f) => (
                  <button key={f.id} role="menuitemradio" aria-checked={c.folder_id === f.id} onClick={() => { close(); p.onMove(c, f.id); }}>
                    <span><FA icon={faFolder} /> {f.name}</span>{c.folder_id === f.id && <FA icon={faCheck} />}
                  </button>
                ))}
              </>
            )}
            <hr />
            <button role="menuitem" className="danger" onClick={() => { close(); p.onClear(c); }}><span><FA icon={faEraser} /> Clear messages</span></button>
            <button role="menuitem" className="danger" onClick={() => { close(); p.onDelete(c); }}><span><FA icon={faTrash} /> Delete</span></button>
          </>
        )}
      </Menu>
    </li>
  );
}

export default function ChatSidebar(p: SidebarProps) {
  const [mac, setMac] = useState(false);
  const [closed, setClosed] = useState<Set<string>>(new Set());
  useEffect(() => setMac(/Mac|iPhone|iPad/.test(navigator.platform)), []);

  const shown = p.tab === "unread" ? p.chats.filter((c) => isUnread(c) && c.id !== p.activeId) : p.chats;
  const unreadCount = p.chats.filter((c) => isUnread(c) && c.id !== p.activeId).length;
  const inFolder = (id: string) => shown.filter((c) => c.folder_id === id);
  const loose = shown.filter((c) => !c.folder_id || !p.folders.some((f) => f.id === c.folder_id));
  const pinned = loose.filter((c) => c.pinned);
  const groups = groupByDate(loose.filter((c) => !c.pinned));
  const toggle = (id: string) => setClosed((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  return (
    <aside className="cx-side at-sand" aria-label="Chats">
      <div className="cx-side-h">
        <h2>Chats</h2>
        <button className="ne-btn" aria-label="Hide sidebar" title="Hide sidebar" onClick={p.onCollapse}><FA icon={faTableColumns} /></button>
      </div>
      <div className="cx-side-new">
        <button className="cx-new" onClick={p.onNew}><FA icon={faPlus} /> New chat</button>
        <button className="cx-folderbtn" aria-label="New folder" title="New folder" onClick={p.onAddFolder}><FA icon={faFolderPlus} /></button>
      </div>
      <button className="cx-search" onClick={p.onSearch}><FA icon={faMagnifyingGlass} /> <span>Search</span> <kbd>{mac ? "⌘K" : "Ctrl K"}</kbd></button>
      <div className="cx-tabs" role="tablist" aria-label="Show chats">
        <button role="tab" aria-selected={p.tab === "all"} onClick={() => p.onTab("all")}>All</button>
        <button role="tab" aria-selected={p.tab === "unread"} onClick={() => p.onTab("unread")}>Unread{unreadCount > 0 && <em>{unreadCount}</em>}</button>
      </div>

      <div className="cx-list">
        {p.ready && shown.length === 0 && <p className="cx-none">{p.tab === "unread" ? "You’re all caught up." : "No chats yet. Start one!"}</p>}

        {p.folders.map((f) => {
          const items = inFolder(f.id);
          if (p.tab === "unread" && items.length === 0) return null;
          const isClosed = closed.has(f.id);
          return (
            <div key={f.id} className="cx-group">
              <div className="cx-folder">
                <button aria-expanded={!isClosed} onClick={() => toggle(f.id)}><FA icon={isClosed ? faChevronRight : faChevronDown} /> <FA icon={faFolder} /> <span>{f.name}</span><small>{items.length || ""}</small></button>
                <Menu label={`Options for folder ${f.name}`} trigger={<FA icon={faEllipsis} />} fixed className="cx-row-menu">
                  {(close) => (
                    <>
                      <button role="menuitem" onClick={() => { close(); p.onRenameFolder(f); }}><span><FA icon={faPen} /> Rename folder</span></button>
                      <button role="menuitem" className="danger" onClick={() => { close(); p.onDeleteFolder(f); }}><span><FA icon={faTrash} /> Delete folder</span></button>
                    </>
                  )}
                </Menu>
              </div>
              {!isClosed && <ul>{items.map((c) => <Row key={c.id} c={c} p={p} />)}</ul>}
            </div>
          );
        })}

        {pinned.length > 0 && (
          <div className="cx-group"><h3>Pinned</h3><ul>{pinned.map((c) => <Row key={c.id} c={c} p={p} />)}</ul></div>
        )}
        {groups.map((g) => (
          <div key={g.label} className="cx-group"><h3>{g.label}</h3><ul>{g.items.map((c) => <Row key={c.id} c={c} p={p} />)}</ul></div>
        ))}
      </div>
    </aside>
  );
}
