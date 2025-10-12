import { useEffect, useState } from "react";
import { decodeJwt } from "../utils/jwt";

export function useAuth() {
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [userId, setUserId] = useState<number | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      const decoded = decodeJwt(storedToken);
      setUserId(decoded.userId);
      setToken(storedToken);
    }
  }, []);

  return { token, userId, setToken, setUserId };
}
