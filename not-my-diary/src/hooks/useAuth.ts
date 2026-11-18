import { useEffect, useState } from "react";
import { decodeJwt } from "../utils/jwt";

export function useAuth() {
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [userId, setUserId] = useState<number | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (!storedToken) {
      setToken(null);
      return;
    }

    try {
      const decoded = decodeJwt(storedToken);
      const expiresIn = decoded.exp * 1000 - Date.now();
      if (!Number.isFinite(expiresIn) || expiresIn <= 0) {
        localStorage.removeItem("token");
        setToken(null);
        setUserId(null);
        return;
      }

      setUserId(decoded.userId);
      setToken(storedToken);
      const expiryTimer = window.setTimeout(() => {
        localStorage.removeItem("token");
        setToken(null);
        setUserId(null);
      }, expiresIn);

      return () => window.clearTimeout(expiryTimer);
    } catch (err) {
      console.error("Invalid token format:", err);
      localStorage.removeItem("token");
      setToken(null);
      setUserId(null);
    }
  }, []);

  return { token, userId, setToken, setUserId };
}
