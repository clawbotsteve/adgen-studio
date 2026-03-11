"use client";

import { useState, useEffect } from "react";
import { createSupabaseBrowser } from "@/lib/supabase";

type Mode = "login" | "signup";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<Mode>("login");
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

      if (mode === "signup") {
        // Sign up with email + password
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });

        if (signUpError) {
          console.error("[login] signUp error:", signUpError);
          setError(signUpError.message || "Unable to create account. Please try again.");
          return;
        }

        setStatus("Account created! Check your email to confirm, or try logging in.");
      } else {
        // Sign in with email + password
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          console.error("[login] signIn error:", signInError);
          if (signInError.message?.includes("Invalid login")) {
            setError("Invalid email or password. If you're new, click 'Create account' below.");
          } else if (signInError.message?.includes("Email not confirmed")) {
            setError("Please check your email and confirm your account first.");
          } else {
            setError(signInError.message || "Unable to sign in. Please try again.");
          }
          return;
        }

        // Auto-join tenant, then redirect to dashboard
        try {
          await fetch("/api/auth/ensure-tenant", { method: "POST" });
        } catch {
          // Non-fatal — don't block login
        }
        window.location.href = "/dashboard";
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="card" style={{ maxWidth: 460 }}>
      <h2>{mode === "login" ? "Sign in" : "Create account"}</h2>
      <p>
        {mode === "login"
          ? "Enter your email and password to sign in."
          : "Create a new account to get started."}
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

      <label htmlFor="password" style={{ marginTop: 8 }}>
        Password
      </label>
      <input
        id="password"
        type="password"
        required
        minLength={6}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Min 6 characters"
      />

      <div style={{ marginTop: 12 }}>
        <button type="submit" disabled={loading}>
          {loading
            ? "Please wait..."
            : mode === "login"
            ? "Sign in"
            : "Create account"}
        </button>
      </div>

      <div style={{ marginTop: 12, textAlign: "center", fontSize: 14, opacity: 0.7 }}>
        {mode === "login" ? (
          <span>
            New here?{" "}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setMode("signup");
                setError(null);
                setStatus(null);
              }}
              style={{ color: "#6366f1", textDecoration: "underline" }}
            >
              Create account
            </a>
          </span>
        ) : (
          <span>
            Already have an account?{" "}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setMode("login");
                setError(null);
                setStatus(null);
              }}
              style={{ color: "#6366f1", textDecoration: "underline" }}
            >
              Sign in
            </a>
          </span>
        )}
      </div>

      {status && <p className="success">{status}</p>}
      {error && <p className="error">{error}</p>}
    </form>
  );
}
