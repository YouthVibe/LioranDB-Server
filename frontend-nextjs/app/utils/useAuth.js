"use client";

import { useEffect, useState, useCallback } from "react";

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  // Fetch user info and return it
  const fetchUser = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(
        process.env.NEXT_PUBLIC_BACKEND_URL + "/auth/me",
        {
          method: "GET",
          credentials: "include", // send cookies for auth
        }
      );

      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        return data.user; // ✅ return user directly
      } else {
        setUser(null);
        return null;
      }
    } catch (err) {
      console.error("Auth check failed:", err);
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch token and return it
  const getToken = useCallback(async () => {
    try {
      const res = await fetch(
        process.env.NEXT_PUBLIC_BACKEND_URL + "/auth/token",
        {
          method: "GET",
          credentials: "include",
        }
      );

      if (res.ok) {
        const data = await res.json();
        setToken(data.token);
        return data.token; // ✅ return token directly
      } else {
        return null;
      }
    } catch (err) {
      console.error("Failed to get token:", err);
      return null;
    }
  }, []);

  // Auto-load user once on mount
  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return {
    user,
    token,
    loading,
    fetchUser, // ✅ now awaitable
    getToken,  // ✅ now awaitable
  };
}
