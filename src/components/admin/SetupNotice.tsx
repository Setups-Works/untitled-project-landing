export default function SetupNotice() {
  return (
    <div className="panel" data-tone="amber">
      <h2 className="h3">The server isn’t connected</h2>
      <p className="body" style={{ marginTop: 8 }}>
        The admin panel reads users from the database. Start the Docker services with <code>docker compose up -d</code>, make sure{" "}
        <code>DATABASE_URL</code> and <code>BETTER_AUTH_SECRET</code> are set in <code>.env.local</code>, apply the migrations with{" "}
        <code>npm run db:migrate</code> and restart. These values stay on the server and are never sent to the browser.
      </p>
    </div>
  );
}
