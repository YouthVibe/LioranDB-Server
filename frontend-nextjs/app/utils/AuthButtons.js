"use client";
import { useAuth } from "./AuthContext";

export function SignInButton({ redirectTo = "/dashboard", children }) {
  const { refreshUser } = useAuth();

  const handleSignIn = () => {
    window.location.href =
      process.env.NEXT_PUBLIC_BACKEND_URL +
      `/auth/google?redirect=${redirectTo}`;
    // After redirect & return, cookie is set — user auto logged in
    // refreshUser() will sync on next focus
  };

  return <div onClick={handleSignIn}>{children}</div>;
}

export function SignUpButton({ redirectTo = "/dashboard", children }) {
  const { refreshUser } = useAuth();

  const handleSignUp = () => {
    window.location.href =
      process.env.NEXT_PUBLIC_BACKEND_URL +
      `/auth/google?mode=signup&redirect=${redirectTo}`;
    // optional: backend can handle mode=signup separately if needed
  };

  return <div onClick={handleSignUp}>{children}</div>;
}

export function SignOutButton({ children }) {
  const { refreshUser } = useAuth();

  const handleSignOut = async () => {
    await fetch(process.env.NEXT_PUBLIC_BACKEND_URL + "/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    await refreshUser(); // instantly update state
  };

  return <div onClick={handleSignOut}>{children}</div>;
}
