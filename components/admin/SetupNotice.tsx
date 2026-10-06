export default function SetupNotice() {
  return (
    <div className="panel" data-tone="amber">
      <h2 className="h3">One more key needed</h2>
      <p className="body" style={{ marginTop: 8 }}>
        The admin panel reads users with Supabase’s service role key. Add <code>SUPABASE_SERVICE_ROLE_KEY</code> to <code>.env.local</code>
        (Supabase → Project Settings → API → <i>service_role</i>) and restart. It stays on the server and is never sent to the browser.
      </p>
    </div>
  );
}
