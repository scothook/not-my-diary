export function decodeJwt(token: string) {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload));
}
