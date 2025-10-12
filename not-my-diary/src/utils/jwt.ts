export function decodeJwt(token: string) {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload));
}

export function isTokenValid(token: string | null): boolean {
  if (!token) return false;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const expiry = payload.exp * 1000; // convert seconds → ms
    return Date.now() < expiry;
  } catch (err) {
    console.error("Invalid token format:", err);
    return false;
  }
}
