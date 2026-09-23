import { useState } from "react";
import { API_URL } from "../lib/api";

function readIsPro(): boolean {
  const stored = localStorage.getItem("user");
  if (!stored) return false;
  try {
    return Boolean(JSON.parse(stored).isPro);
  } catch {
    return false;
  }
}

export function useIsPro() {
  const [isPro, setIsPro] = useState(readIsPro);

  const refreshProStatus = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const { user } = await res.json();
      localStorage.setItem("user", JSON.stringify(user));
      setIsPro(Boolean(user.isPro));
    } catch {
      // Network hiccup — keep whatever Pro status is already cached.
    }
  };

  return { isPro, refreshProStatus };
}
