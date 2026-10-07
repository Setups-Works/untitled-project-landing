import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";
import { faEarthAmericas, faPaperclip } from "@fortawesome/free-solid-svg-icons";
import { adminDb, serverConfigured } from "../../../server/session";
import { objectUrl, ownsKey, validKey } from "../../../server/storage";
import { prettyTitle } from "../../../lib/chat";
import type { Attachment } from "../../../lib/workspace";
import AuthLink from "../../../components/auth/AuthLink";
import AttachmentImage from "../../../components/ui/AttachmentImage";
import AudioWave from "../../../components/ui/AudioWave";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Shared chat — untitled project",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

type Row = { id: string; role: "user" | "assistant"; body: string; created_at: string; attachments: Attachment[] };

/** A read-only, public view of a chat. Anyone with the (unguessable) link can open it; the owner can switch it off at any time. */
export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!/^[a-f0-9]{32}$/.test(token)) notFound();
  if (!serverConfigured())
    return (
      <main className="section">
        <div className="container" style={{ maxWidth: 640 }}>
          <div className="panel" data-tone="amber">
            <p className="body">Shared chats aren’t available until the server is configured.</p>
          </div>
        </div>
      </main>
    );

  // Looked up by exact token on the server, so the database never exposes the list of shared chats.
  const sb = adminDb();
  const { data: chat } = await sb.from("chats").select("id,user_id,title,shared_at,updated_at").eq("share_token", token).maybeSingle();
  if (!chat) notFound();

  const { data } = await sb.from("chat_messages").select("id,role,body,created_at,attachments").eq("chat_id", chat.id).order("created_at");
  const msgs = (data ?? []) as Row[];
  // Attachment paths are user-supplied data, so only sign files that really live in the chat owner's own folder.
  const urls = new Map<string, string>();
  for (const a of msgs.flatMap((m) => m.attachments)) {
    if (validKey(a.path) && ownsKey(chat.user_id as string, a.path)) urls.set(a.path, objectUrl("note-files", a.path, 3600));
  }
  const since = new Date(chat.shared_at ?? chat.updated_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  return (
    <main className="sh-page">
      <div className="container sh-wrap">
        <header className="sh-head">
          <span className="sh-badge">
            <FA icon={faEarthAmericas} /> Shared conversation · read-only
          </span>
          <h1>{prettyTitle(chat.title as string)}</h1>
          <small>
            {msgs.length} {msgs.length === 1 ? "message" : "messages"} · Shared {since}
          </small>
        </header>

        <div className="cx-msgs sh-msgs">
          {msgs.length === 0 && <p className="ap-none">This chat has no messages yet.</p>}
          {msgs.map((m) => (
            <div key={m.id} className="cx-msg" data-role={m.role}>
              <div className="cx-bubble">
                {m.body && <p>{m.body}</p>}
                {m.attachments.map((a) => {
                  const u = urls.get(a.path);
                  return (
                    <div key={a.path} className="cx-att">
                      {u && a.type.startsWith("image/") && <AttachmentImage src={u} name={a.name} />}
                      {u && a.type.startsWith("audio/") && <AudioWave src={u} label={a.name} />}
                      {!a.type.startsWith("image/") &&
                        !a.type.startsWith("audio/") &&
                        (u ? (
                          <a href={u} target="_blank" rel="noopener noreferrer">
                            <FA icon={faPaperclip} /> {a.name}
                          </a>
                        ) : (
                          <span>{a.name}</span>
                        ))}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <aside className="sh-cta panel" data-tone="forest">
          <div>
            <h2 className="h3">Want a workspace like this?</h2>
            <p className="body">Notes, tasks, journal and chat in one place — with any AI, or none.</p>
          </div>
          <AuthLink arrow />
        </aside>
      </div>
    </main>
  );
}
