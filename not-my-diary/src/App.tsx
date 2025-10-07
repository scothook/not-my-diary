import { useState, useEffect } from 'react'
import './App.css'
import Login from './components/Login';
import CenteredModal from './components/CenteredModal';

interface Entry {
  timestamp: string;
  text: string;
  userId: number;
}

const token = localStorage.getItem("token");

function App() {

  const [userId, setUserId] = useState<number | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [input, setInput] = useState<string>('');
  const [timestampsVisible, setTimestampsVisible] = useState<boolean>(true);

  const loadEntries = async () => {
    try {
      const response = await fetch(`https://not-my-diary-backend-production.up.railway.app/api/entries/`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error("Failed to fetch entries");

      const rawData: { created_at: string; content: string; user_id: number; }[] = await response.json();

      const data: Entry[] = rawData.map(e => ({
        timestamp: e.created_at,
        text: e.content,
        userId: e.user_id,
      }));

      console.log(data);
      setEntries(data);
    } catch (err) {
      console.error(err);
    }
  };

  function decodeJwt(token: string) {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload));
  }

  useEffect(() => {
    if (token) {
      const decodedJwt = decodeJwt(token);
      setUserId(decodedJwt.userId);
    }
  }, []);

  useEffect(() => {
    loadEntries();
  }, [userId]);

  const saveNewEntries = async (newEntries: Entry[]) => {
    const res = await fetch("https://not-my-diary-backend-production.up.railway.app/api/entries/batch",
      {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(newEntries),
      }
    );

    if (!res.ok) {
      throw new Error("Failed to save new entries");
    }

    const saved = await res.json();
    return saved;
  };

  const handleUserId = (userId: number) => {
    setUserId(userId);
  };

  const formatTimestamp = (date: Date) =>
    date.toISOString().replace("T", " ");

  const formatLocalTime = (utcString: string) => {
    return new Date(utcString).toLocaleString([], {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",      
    });
  };
  
  const addEntry = (text: string) => {
    const newEntry = { timestamp: formatTimestamp(new Date()), text, userId: userId || 0};
    setEntries((prev) => [...prev, newEntry]);
    setInput("");
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      addEntry(input);
    }
  };

  function useDebouncedSave(values: Entry[], delay: number, saveFn: (values: Entry[]) => void) {
    useEffect(() => {
      if (values.length === 0) return;

      const handler = setTimeout(() => {
        saveFn(values);
      }, delay);

      return () => clearTimeout(handler);

    }, [values, delay, saveFn]);
  }

  useDebouncedSave(entries, 5000, saveNewEntries);

  function SaveButton({ onSave }: { onSave: () => void}) {
    return (
      <button className="saveButton" onClick={onSave}>
        🖫
      </button>
    );
  }

  function ToggleTimestampsVisibility() {
    setTimestampsVisible(!timestampsVisible);
  }

  return (
    <>
      <h2>not my diary</h2>
      <SaveButton onSave={() => saveNewEntries(entries)}/>
      <CenteredModal isOpen={userId === null} onClose={() => {}} title="Login Required">
        <Login sendUserId={handleUserId}/>
      </CenteredModal>
      {timestampsVisible ? (
        // visible timestamps
        <>
          <div id="entries">
            {entries.map((entry, idx) => (
              <div key={idx} className="entry">
                <span className="timestamp" onClick={() => ToggleTimestampsVisibility()}>[{formatLocalTime(entry.timestamp)}]</span>
                <span className="text">{entry.text}</span>
              </div>
            ))}
          </div>
          <div className="inputRow">
            <span className="timestamp" onClick={() => ToggleTimestampsVisibility()}></span>
            <input
              className="input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              autoFocus
            />
          </div>
        </>
      ) : (
        // hidden timestamps
        <>
          <div id="entriesNoTimestamps">
            {entries.map((entry, idx) => (
              <div key={idx} className="entry">
                <span className="timestamp" onClick={() => ToggleTimestampsVisibility()}>[]</span>
                <span className="text">{entry.text}</span>
              </div>
            ))}
          </div>
          <div className="inputRowNoTimestamps">
            <span className="timestamp" onClick={() => ToggleTimestampsVisibility()}></span>
            <input
              className="input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              autoFocus
            />
          </div>
        </>
      )}  
    </>
  )
}

export default App
