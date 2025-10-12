import { useState } from "react";

export interface Entry {
  timestamp: string;
  text: string;
  userId: number;
}

export function useEntries(token: string | null) {
  const [entries, setEntries] = useState<Entry[]>([]);

  const loadEntries = async () => {
    if (!token) return;
    try {
      const response = await fetch("https://not-my-diary-backend-production.up.railway.app/api/entries/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch entries");

      const rawData: { created_at: string; content: string; user_id: number; }[] = await response.json();

      const data: Entry[] = rawData.map(e => ({
        timestamp: e.created_at,
        text: e.content,
        userId: e.user_id,
      }));

      setEntries(data);
    } catch (err) {
      console.error(err);
    }
  };

  const saveNewEntries = async (newEntries: Entry[]) => {
    if (!token) return;
    const res = await fetch("https://not-my-diary-backend-production.up.railway.app/api/entries/batch", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(newEntries),
    });
    if (!res.ok) throw new Error("Failed to save new entries");
    return await res.json();
  };

  return { entries, setEntries, loadEntries, saveNewEntries };
}
