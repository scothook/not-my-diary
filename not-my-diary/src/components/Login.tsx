import { useState } from "react";
import styles from "./Login.module.css";

interface LoginProps {
  sendUserId: (userId: number) => void;
}

export default function Login({ sendUserId }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const res = await fetch("https://not-my-diary-backend-production.up.railway.app/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error(data.error);
        return;
      }

      // Save token to localStorage
      localStorage.setItem("token", data.token);
      sendUserId(data.userId);
    } catch (err) {
      console.error("Network error:", err);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 300, margin: "auto" }}>
      <div>
        <label>Email:</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div>
        <label>Password:</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      <button type="submit" className={styles.button}>Login</button>
    </form>
  );
}
