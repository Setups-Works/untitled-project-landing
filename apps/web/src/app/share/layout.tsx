import ShareHeader from "../../components/share/ShareHeader";

/** Every public share page (shared chats and shared journal entries) gets the same minimal header and nothing else. */
export default function ShareLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ShareHeader />
      {children}
    </>
  );
}
