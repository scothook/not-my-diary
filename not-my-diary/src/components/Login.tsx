import { useState } from "react";
import styles from "./Login.module.css";

interface LoginResponse {
  token: string;
}

const API_URL = "https://not-my-diary-backend-production.up.railway.app/api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isStartingDemo, setIsStartingDemo] = useState(false);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    try {
      const res = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data: LoginResponse = await res.json();

      if (!res.ok) {
        setError("Invalid credentials");
        return;
      }

      // Save token to localStorage
      localStorage.setItem("token", data.token);
      window.location.reload();
    } catch (err) {
      console.error("Network error:", err);
      setError("Unable to log in. Please try again.");
    }
  };

  const handleDemo = async () => {
    setError(null);
    setIsStartingDemo(true);

    try {
      const res = await fetch(`${API_URL}/demo`, { method: "POST" });
      const data: LoginResponse = await res.json();

      if (!res.ok) {
        setError("Unable to start a demo session. Please try again.");
        return;
      }

      localStorage.setItem("token", data.token);
      window.location.reload();
    } catch (err) {
      console.error("Network error:", err);
      setError("Unable to start a demo session. Please try again.");
    } finally {
      setIsStartingDemo(false);
    }
  };

  return (
    <div className={styles.login}>
      <form onSubmit={handleLogin}>
        <div className={styles.formGroup}>
          <label htmlFor="login-email">Email address</label>
          <input
            type="email"
            id="login-email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            placeholder="you@example.com"
            required
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="login-password">Password</label>
          <input
            type="password"
            id="login-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            placeholder="Enter your password"
            required
          />
        </div>
        <div className={styles.actions}>
          <button type="submit" className={styles.button}>Login</button>
          <button
            type="button"
            className={styles.demoButton}
            onClick={handleDemo}
            disabled={isStartingDemo}
          >
            {isStartingDemo ? "Starting..." : "Demo"}
          </button>
        </div>
      </form>
      {error && <p className={styles.error} role="alert">{error}</p>}
    </div>
  );
}
