import { useState } from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabase";

const GoogleMark = () => <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M21.35 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.23a4.47 4.47 0 0 1-1.94 2.93v2.77h3.15c1.84-1.7 2.91-4.2 2.91-7.71Z"/><path fill="#34A853" d="M12 21.73c2.62 0 4.81-.87 6.42-2.36l-3.15-2.77c-.87.58-1.99.93-3.27.93-2.51 0-4.64-1.7-5.4-3.98H3.34v2.86A9.7 9.7 0 0 0 12 21.73Z"/><path fill="#FBBC05" d="M6.6 13.55A5.83 5.83 0 0 1 6.3 12c0-.54.1-1.06.3-1.55V7.59H3.34A9.7 9.7 0 0 0 2.3 12c0 1.57.38 3.05 1.04 4.41l3.26-2.86Z"/><path fill="#EA4335" d="M12 6.47c1.43 0 2.71.49 3.72 1.45l2.79-2.79C16.81 3.54 14.62 2.27 12 2.27a9.7 9.7 0 0 0-8.66 5.32L6.6 10.45c.76-2.28 2.89-3.98 5.4-3.98Z"/></svg>;
export default function AuthScreen({ go, mode = "customer" }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const admin = mode === "admin";
  const oauthLogin = async (provider) => {
    if (!supabase) return;
    setStatus("Opening " + (provider === "google" ? "Google" : "Apple") + " sign-in…");
    const redirectPath = admin ? "/admin-login" : "/";
    const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: window.location.origin + redirectPath } });
    if (error) setStatus(error.message);
  };
  const customerAuth = async (event) => {
    event.preventDefault();
    if (!supabase) return;
    setSubmitting(true); setStatus("");
    const result = isRegister
      ? await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin + "/" } })
      : await supabase.auth.signInWithPassword({ email, password });
    if (result.error) setStatus(result.error.message);
    else if (isRegister) setStatus(result.data.session ? "Account created — you are signed in." : "Account created — check your inbox to verify your email, then sign in.");
    else go("/");
    setSubmitting(false);
  };
  const authButtons = <div className="oauth-buttons">
    <button className="google-button" onClick={() => oauthLogin("google")} type="button"><GoogleMark/>Continue with Google</button>
    <button className="apple-button" onClick={() => oauthLogin("apple")} type="button"><AppleMark/>Continue with Apple</button>
  </div>;
  return <main className="auth-page"><section className="auth-card"><p className="eyebrow">{admin ? "TECHORA ADMIN" : "TECHORA ACCOUNT"}</p><h1>{admin ? <>Admin <em>access.</em></> : <>{isRegister ? "Create" : "Sign in to"}<br/><em>{isRegister ? "account." : "continue."}</em></>}</h1><p>{admin ? "Only approved Techora administrators can open the dashboard after Google sign-in." : "Sign in with Google or create a customer account to checkout and track orders."}</p>{isSupabaseConfigured ? admin ? <>{authButtons}<p className="auth-helper">Your Google email must be approved as a Techora admin.</p></> : <><>{authButtons}</><div className="auth-divider"><span>or use email</span></div><form className="magic-link-form" onSubmit={customerAuth}><label>Email address<input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com"/></label><label>Password<input required type="password" minLength="6" autoComplete={isRegister ? "new-password" : "current-password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 6 characters"/></label><button className="button button-ink" disabled={submitting}>{submitting ? "Please wait…" : isRegister ? "Create account" : "Sign in"}</button><button type="button" className="auth-switch" onClick={() => { setIsRegister(!isRegister); setStatus(""); }}>{isRegister ? "Already have an account? Sign in" : "New customer? Create an account"}</button></form></> : <p className="setup-notice">Supabase connection is not configured yet. Add the project URL and publishable key to <code>.env</code>.</p>}{status && <p className="form-status" aria-live="polite">{status}</p>}<button className="text-link auth-back-link" onClick={() => go("/")}>Back to store</button></section></main>;
}
