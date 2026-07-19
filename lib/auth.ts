"use client";

import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase-client";

export type AuthState = {
  ready: boolean;
  session: Session | null;
  user: User | null;
  isAdmin: boolean;
};

export function useAuth(): AuthState & {
  signIn: (email: string, password: string) => Promise<{ ok: boolean; error: string | null }>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
} {
  const [state, setState] = useState<AuthState>({
    ready: false,
    session: null,
    user: null,
    isAdmin: false,
  });

  const refresh = async () => {
    const client = getSupabase();
    if (!client) {
      setState({ ready: true, session: null, user: null, isAdmin: false });
      return;
    }
    const { data } = await client.auth.getSession();
    const session = data.session;
    const user = session?.user ?? null;
    const admin = await checkAdmin(user);
    setState({ ready: true, session, user, isAdmin: admin });
  };

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await refresh();
      if (cancelled) return;
    })();
    const client = getSupabase();
    if (!client) return;
    const { data: subscription } = client.auth.onAuthStateChange(() => {
      void refresh();
    });
    return () => {
      cancelled = true;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const client = getSupabase();
    if (!client) return { ok: false, error: "Sign in is not configured. Connect Supabase to manage administrators." };
    const { error } = await client.auth.signInWithPassword({ email, password });
    if (error) {
      return { ok: false, error: friendlyAuthError(error) };
    }
    await refresh();
    return { ok: true, error: null };
  };

  const signOut = async () => {
    const client = getSupabase();
    if (!client) return;
    await client.auth.signOut();
    await refresh();
  };

  return { ...state, signIn, signOut, refresh };
}

async function checkAdmin(user: User | null): Promise<boolean> {
  if (!user) return false;
  const client = getSupabase();
  if (!client) return false;
  const { data, error } = await client
    .from("administrators")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) {
    return Boolean(user.app_metadata?.role === "administrator" || user.user_metadata?.role === "administrator");
  }
  return Boolean(data);
}

function friendlyAuthError(error: { message?: string } | unknown): string {
  const message = typeof error === "object" && error && "message" in error ? String((error as { message?: unknown }).message) : "";
  if (!message) return "We couldn't sign you in. Try again in a moment.";
  if (/invalid login|invalid credentials/i.test(message)) return "These credentials don't match an administrator account.";
  if (/email not confirmed|not confirmed/i.test(message)) return "Confirm your email before signing in.";
  if (/rate limit|too many/i.test(message)) return "Too many attempts. Wait a moment before trying again.";
  if (/network|fetch|Failed to fetch/i.test(message)) return "We couldn't reach the server. Check your connection and try again.";
  return "We couldn't sign you in. Try again in a moment.";
}
