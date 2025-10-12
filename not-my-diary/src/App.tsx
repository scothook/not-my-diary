import { useState, useEffect } from 'react';
import './App.css';
import Login from './components/Login';
import CenteredModal from './components/CenteredModal';
import { useEntries } from './hooks/useEntries';
import { dateToTimestampString, timestampStringToLocalTime } from './utils/time.ts';
import { decodeJwt } from './utils/jwt.ts';

interface Entry {
  timestamp: string;
  text: string;
  userId: number;
}

function App() {

  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const { entries, setEntries, loadEntries, saveNewEntries } = useEntries(token);
  const [userId, setUserId] = useState<number | null>(null);
  //const [entries, setEntries] = useState<Entry[]>([]);
  const [input, setInput] = useState<string>('');
  const [timestampsVisible, setTimestampsVisible] = useState<boolean>(true);

  useEffect(() => {
    setToken(localStorage.getItem("token"));
    if (token) {
      const decodedJwt = decodeJwt(token);
      setUserId(decodedJwt.userId);
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    setToken(localStorage.getItem("token"));
    loadEntries();
  }, [token, userId]);

  const handleUserId = (userId: number) => {
    setUserId(userId);
    setToken(localStorage.getItem("token"));
    loadEntries();
  };
  
  const addEntry = (text: string) => {
    const newEntry = { timestamp: dateToTimestampString(new Date()), text, userId: userId || 0};
    setEntries(prev => [...prev, newEntry]);
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
      <CenteredModal isOpen={userId === null} onClose={() => {}} title="Login">
        <Login sendUserId={handleUserId}/>
      </CenteredModal>
      {timestampsVisible ? (
        // visible timestamps
        <>
          <div id="entries">
            {entries.map((entry, idx) => (
              <div key={idx} className="entry">
                <span className="timestamp" onClick={() => ToggleTimestampsVisibility()}>[{timestampStringToLocalTime(entry.timestamp)}]</span>
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
