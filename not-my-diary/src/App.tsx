import { useState, useEffect } from 'react'
import './App.css'

interface Entry {
  timestamp: string;
  text: string;
}

function App() {

  const loadEntries = async () => {
    try {
      const response = await fetch("https://not-my-diary-backend-production.up.railway.app/api/entries");
      if (!response.ok) throw new Error("Failed to fetch entries");

      const rawData: { created_at: string; content: string }[] = await response.json();

      const data: Entry[] = rawData.map(e => ({
        timestamp: e.created_at,
        text: e.content,
      }));

      console.log(data);
      setEntries(data);
    } catch (err) {
      console.error(err);
    }
  };

  const saveNewEntries = async (newEntries: Entry[]) => {
    const res = await fetch("https://not-my-diary-backend-production.up.railway.app/api/entries/batch",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newEntries),
      }
    );

    if (!res.ok) {
      throw new Error("Failed to save new entries");
    }

    const saved = await res.json();
    return saved;
  }

  const [entries, setEntries] = useState<Entry[]>(() => {
    loadEntries();
    const saved = localStorage.getItem("journal");
    return saved ? JSON.parse(saved) : [];
  });
  const [input, setInput] = useState<string>('');

  // save entries
  useEffect(() => {
    //localStorage.setItem("journal", JSON.stringify(entries));
    saveNewEntries(entries).catch(console.error);
  }, [entries]);

  const formatTimestamp = (date: Date) =>
    date.toISOString().replace("T", " ");
  
  const addEntry = (text: string) => {
    const newEntry = { timestamp: formatTimestamp(new Date()), text };
    setEntries((prev) => [...prev, newEntry]);
    setInput("");
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      addEntry(input);
    }
  }

  return (
    <>
      <h2>not my diary</h2>
      <div id="entries">
        {entries.map((entry, idx) => (
          <div key={idx} className="entry">
            <span className="timestamp">[{entry.timestamp}]</span>
            <span className="text">{entry.text}</span>
          </div>
        ))}
      </div>
      <div className="inputRow">
        <span className="timestamp"></span>
        <input
          className="input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
          autoFocus
        />
      </div>
    </>
  )
}

export default App
