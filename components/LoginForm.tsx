"use client";

import { useState, useEffect } from "react";
import { createSupabaseBrowser } from "@/lib/supabase";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
    setLoading(true);

    try {
      const supabase = createSupabaseBrowser();

      const { error: otpError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          shouldCreateUser: true,
        },
      });

      if (otpError) {
        console.error("[login] magic link error:", otpError);
        setError(
          otpError.message || "Unable to send sign-in link. Please try again."
        );
        return;
      }

      setStatus(
        "Check your email! We sent you a sign-in link. Click it to log in."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="card" style={{ maxWidth: 460 }}>
      <h2>Sign in</h2>
      <p>
        Enter your email and we&apos;ll send you a magic link to sign in
        &mdash; no password needed.
      </p>

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
        <button type="submit" disabled={loading}>
          {loading ? "Sending..." : "Send magic link"}
        </button>
      </div>

      {status && <p className="success">{status}</p>}
      {error && <p className="error">{error}</p>}
    </form>
  );
}
