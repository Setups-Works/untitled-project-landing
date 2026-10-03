"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";
import { faArrowRight, faSpinner } from "@fortawesome/free-solid-svg-icons";

export default function AdminLogin() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const body = Object.fromEntries(new FormData(e.currentTarget).entries());
    setBusy(true);
    setErr("");
    try {
      const r = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Login failed.");
      router.push("/admin");
      router.refresh();
    } catch (x) {
      setErr(x instanceof Error ? x.message : "Login failed.");
      setBusy(false);
    }
  }
  return (
    <form className="wl-form" onSubmit={submit}>
      <label><span>Email</span><input name="email" type="email" autoComplete="username" required /></label>
      <label><span>Password</span><input name="password" type="password" autoComplete="current-password" required /></label>
      {err && <p className="form-err" role="alert">{err}</p>}
      <button className="btn btn-primary" disabled={busy}>
        {busy ? <><FA icon={faSpinner} spin /> Signing in…</> : <>Sign in <FA icon={faArrowRight} /></>}
      </button>
    </form>
  );
}
