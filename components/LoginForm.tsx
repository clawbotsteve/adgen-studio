"use client";

import { useState, useEffect } from "react";
import { createSupabaseBrowser } from "@/lib/supabase";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Show error messages passed via URL params (e.g. from auth callback)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlError = params.get("error");
    const urlMessage = params.get("message");
    if (urlError === "auth" && urlMessage) {
      setError(urlMessage);
    }
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setStatus(null);

    const supabase = createSupabaseBrowser();
    const redirectTo = `${window.location.origin}/auth/callback`;
    const { error: signInError } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    });

    if (signInError) {
      setError("Unable to send sign-in link. Please try again.");
      return;
    }

    setStatus("Check your email for a sign-in link.");
  };

  return (
    <form onSubmit={onSubmit} className="card" style={{ maxWidth: 460 }}>
      <h2>Sign in</h2>
      <p>Use your work email to receive a one-time sign-in link.</p>
      <label htmlFor="email">Email</label>
      <input
        id="email"
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@company.com"
      />
      <div style={{ marginTop: 12 }}>
        <button type="submit">Send magic link</button>
      </div>
      {status && <p className="success">{status}</p>}
      {error && <p className="error">{error}</p>}
    </form>
  );
}
