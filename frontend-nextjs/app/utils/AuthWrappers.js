"use client";
import { useAuth } from "./AuthContext";

export function SignedIn({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? children : null;
}

export function SignedOut({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return !user ? children : null;
}
