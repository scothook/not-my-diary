import { useState, useEffect } from 'react';
import './App.css';
import Login from './components/Login';
import CenteredModal from './components/CenteredModal';
import { useEntries } from './hooks/useEntries';
import { useDebouncedSave } from './hooks/useDebouncedSave.ts';
import { useAuth } from './hooks/useAuth.ts';
import { dateToTimestampString, timestampStringToLocalTime } from './utils/time.ts';
import { isTokenValid } from './utils/jwt.ts';

function App() {
  const { token, userId } = useAuth();
  const { entries, setEntries, loadEntries, saveNewEntries } = useEntries(token);
  const [input, setInput] = useState<string>('');
  const [timestampsVisible, setTimestampsVisible] = useState<boolean>(true);
  
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

  useEffect(() => {
    const token = localStorage.getItem("token");
    if(isTokenValid(token)) {
      loadEntries();
    }
  }, []);

  return (
    <>
      <h2>not my diary</h2>
      <SaveButton onSave={() => saveNewEntries(entries)}/>
      <CenteredModal isOpen={!isTokenValid(token)} onClose={() => {}} title="Login">
        <Login />
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
