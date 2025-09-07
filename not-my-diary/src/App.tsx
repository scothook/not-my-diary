import { useState, useEffect } from 'react'
import './App.css'

interface Entry {
  timestamp: string;
  text: string;
}

function App() {
  const [entries, setEntries] = useState<Entry[]>(() => {
    const saved = localStorage.getItem("journal");
    return saved ? JSON.parse(saved) : [];
  });
  const [input, setInput] = useState<string>('');

  // save entries
  useEffect(() => {
    localStorage.setItem("journal", JSON.stringify(entries));
  }, [entries]);

  const formatTimestamp = (date: Date) =>
    date.toISOString().replace("T", " ").slice(0, 19);
  
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
        />
      </div>
    </>
  )
}

export default App
