"use client";
import { useEffect, useState } from "react";
import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";
import {
  faChevronDown,
  faChevronRight,
  faClone,
  faDownload,
  faEllipsis,
  faEnvelope,
  faEnvelopeOpen,
  faEraser,
  faFolder,
  faFolderPlus,
  faShareNodes,
  faMagnifyingGlass,
  faPen,
  faPlus,
  faTableColumns,
  faThumbtack,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import type { Chat, ChatFolder } from "../../../lib/workspace";
import { ageShort, groupByDate, isUnread, prettyTitle } from "../../../lib/chat";
import Menu, { MenuItem, MenuLabel, MenuRadioGroup, MenuRadioItem, MenuSeparator } from "../../ui/Menu";
import { Tabs, TabsList, TabsTrigger } from "../../ui/Tabs";
import { ctxProps } from "../../../lib/context-actions";

export type Tab = "all" | "unread";

export type SidebarProps = {
  chats: Chat[];
  folders: ChatFolder[];
  activeId: string | null;
  tab: Tab;
  ready: boolean;
  onTab: (t: Tab) => void;
  onOpen: (id: string) => void;
  onNew: () => void;
  onSearch: () => void;
  onCollapse: () => void;
  onAddFolder: () => void;
  onRenameFolder: (f: ChatFolder) => void;
  onDeleteFolder: (f: ChatFolder) => void;
  onPin: (c: Chat) => void;
  onRename: (c: Chat) => void;
  onMove: (c: Chat, folderId: string | null) => void;
  onDelete: (c: Chat) => void;
  onRead: (c: Chat, read: boolean) => void;
  onDuplicate: (c: Chat) => void;
  onShare: (c: Chat) => void;
  onExport: (c: Chat) => void;
  onClear: (c: Chat) => void;
};

function Row({ c, p }: { c: Chat; p: SidebarProps }) {
  const unread = isUnread(c) && c.id !== p.activeId;
  return (
    <li className="cx-row" data-on={c.id === p.activeId} data-unread={unread} {...ctxProps("chat", c.id, { pinned: c.pinned, unread })}>
      <button className="cx-row-main" aria-current={c.id === p.activeId ? "page" : undefined} onClick={() => p.onOpen(c.id)}>
        {c.pinned && <FA icon={faThumbtack} className="cx-pin" />}
        <span className="cx-row-t">{prettyTitle(c.title)}</span>
        {unread && <i className="cx-dot" aria-label="Unread" />}
        <small>{ageShort(c.updated_at)}</small>
      </button>
      <Menu label={`Options for ${c.title}`} trigger={<FA icon={faEllipsis} />} compact className="cx-row-menu">
        <MenuItem onSelect={() => p.onPin(c)}>
          <span>
            <FA icon={faThumbtack} /> {c.pinned ? "Unpin" : "Pin"}
          </span>
        </MenuItem>
        <MenuItem onSelect={() => p.onRename(c)}>
          <span>
            <FA icon={faPen} /> Rename
          </span>
        </MenuItem>
        {c.id !== p.activeId && (
          <MenuItem onSelect={() => p.onRead(c, unread)}>
            <span>
              <FA icon={unread ? faEnvelopeOpen : faEnvelope} /> {unread ? "Mark as read" : "Mark as unread"}
            </span>
          </MenuItem>
        )}
        <MenuItem onSelect={() => p.onDuplicate(c)}>
          <span>
            <FA icon={faClone} /> Duplicate
          </span>
        </MenuItem>
        <MenuItem onSelect={() => p.onShare(c)}>
          <span>
            <FA icon={faShareNodes} /> {c.share_token ? "Manage shared link" : "Share"}
          </span>
        </MenuItem>
        <MenuItem onSelect={() => p.onExport(c)}>
          <span>
            <FA icon={faDownload} /> Export as Markdown
          </span>
        </MenuItem>
        {p.folders.length > 0 && (
          <>
            <MenuLabel>Move to folder</MenuLabel>
            <MenuRadioGroup value={c.folder_id ?? "none"} onValueChange={(v) => p.onMove(c, v === "none" ? null : v)}>
              <MenuRadioItem value="none">No folder</MenuRadioItem>
              {p.folders.map((f) => (
                <MenuRadioItem key={f.id} value={f.id}>
                  <span>
                    <FA icon={faFolder} /> {f.name}
                  </span>
                </MenuRadioItem>
              ))}
            </MenuRadioGroup>
          </>
        )}
        <MenuSeparator />
        <MenuItem danger onSelect={() => p.onClear(c)}>
          <span>
            <FA icon={faEraser} /> Clear messages
          </span>
        </MenuItem>
        <MenuItem danger onSelect={() => p.onDelete(c)}>
          <span>
            <FA icon={faTrash} /> Delete
          </span>
        </MenuItem>
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
  const toggle = (id: string) =>
    setClosed((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  return (
    <aside className="cx-side at-sand" aria-label="Chats">
      <div className="cx-side-h">
        <h2>Chats</h2>
        <button className="ne-btn" aria-label="Hide sidebar" title="Hide sidebar" onClick={p.onCollapse}>
          <FA icon={faTableColumns} />
        </button>
      </div>
      <div className="cx-side-new">
        <button className="cx-new" onClick={p.onNew}>
          <FA icon={faPlus} /> New chat
        </button>
        <button className="cx-folderbtn" aria-label="New folder" title="New folder" onClick={p.onAddFolder}>
          <FA icon={faFolderPlus} />
        </button>
      </div>
      <button className="cx-search" onClick={p.onSearch}>
        <FA icon={faMagnifyingGlass} /> <span>Search</span> <kbd>{mac ? "⌘K" : "Ctrl K"}</kbd>
      </button>
      <Tabs value={p.tab} onValueChange={(v) => p.onTab(v as Tab)}>
        <TabsList className="cx-tabs" aria-label="Show chats">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unread">Unread{unreadCount > 0 && <em>{unreadCount}</em>}</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="cx-list">
        {p.ready && shown.length === 0 && (
          <p className="cx-none">{p.tab === "unread" ? "You’re all caught up." : "No chats yet. Start one!"}</p>
        )}

        {p.folders.map((f) => {
          const items = inFolder(f.id);
          if (p.tab === "unread" && items.length === 0) return null;
          const isClosed = closed.has(f.id);
          return (
            <div key={f.id} className="cx-group">
              <div className="cx-folder">
                <button aria-expanded={!isClosed} onClick={() => toggle(f.id)}>
                  <FA icon={isClosed ? faChevronRight : faChevronDown} /> <FA icon={faFolder} /> <span>{f.name}</span>
                  <small>{items.length || ""}</small>
                </button>
                <Menu label={`Options for folder ${f.name}`} trigger={<FA icon={faEllipsis} />} compact className="cx-row-menu">
                  <MenuItem onSelect={() => p.onRenameFolder(f)}>
                    <span>
                      <FA icon={faPen} /> Rename folder
                    </span>
                  </MenuItem>
                  <MenuItem danger onSelect={() => p.onDeleteFolder(f)}>
                    <span>
                      <FA icon={faTrash} /> Delete folder
                    </span>
                  </MenuItem>
                </Menu>
              </div>
              {!isClosed && (
                <ul>
                  {items.map((c) => (
                    <Row key={c.id} c={c} p={p} />
                  ))}
                </ul>
              )}
            </div>
          );
        })}

        {pinned.length > 0 && (
          <div className="cx-group">
            <h3>Pinned</h3>
            <ul>
              {pinned.map((c) => (
                <Row key={c.id} c={c} p={p} />
              ))}
            </ul>
          </div>
        )}
        {groups.map((g) => (
          <div key={g.label} className="cx-group">
            <h3>{g.label}</h3>
            <ul>
              {g.items.map((c) => (
                <Row key={c.id} c={c} p={p} />
              ))}
            </ul>
          </div>
        ))}
      </div>
    </aside>
  );
}
