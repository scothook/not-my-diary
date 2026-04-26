import './App.css';
import { useState, useEffect, useRef } from 'react';
import Login from './components/Login';
import CenteredModal from './components/CenteredModal';
import { useEntries } from './hooks/useEntries';
import { useDebouncedSave } from './hooks/useDebouncedSave.ts';
import { useAuth } from './hooks/useAuth.ts';
import { dateToTimestampString, timestampStringToLocalTime } from './utils/time.ts';
import { isTokenValid } from './utils/jwt.ts';

function App() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const entriesContainerRef = useRef<HTMLDivElement | null>(null);
  const { token, userId } = useAuth();
  const { entries, setEntries, loadEntries, saveNewEntries } = useEntries(token);
  const [input, setInput] = useState<string>('');
  const [timestampsVisible, setTimestampsVisible] = useState<boolean>(true);
  const [displayCount, setDisplayCount] = useState<number>(20);
  const hasScrolledAtLoad = useRef(false);
  const PAGE_SIZE = 20;

  const addEntry = (text: string) => {
    const newEntry = { timestamp: dateToTimestampString(new Date()), text, userId: userId || 0};
    setEntries(prev => [...prev, newEntry]);
    setInput("");
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addEntry(input);
    }
  };

  useDebouncedSave(entries, 5000, saveNewEntries);

  function SaveButton({ onSave }: { onSave: () => void}) {
    return (
      <button className="saveButton" onClick={onSave} aria-label="Save entries">
        💾
      </button>
    );
  }

  function ToggleTimestampsVisibility() {
    setTimestampsVisible(!timestampsVisible);
  }

  const visibleEntries = entries.slice(-displayCount);

  useEffect(() => {
    const tokenFromStorage = localStorage.getItem("token");
    if (isTokenValid(tokenFromStorage)) {
      loadEntries();
    }
  }, [loadEntries]);

  useEffect(() => {
    if (!inputRef.current) return;
    inputRef.current.focus();
  }, []);

  useEffect(() => {
    if (hasScrolledAtLoad.current) return;
    hasScrolledAtLoad.current = true;
    const timer = setTimeout(() => {
      if (entriesContainerRef.current) {
        entriesContainerRef.current.scrollTop = entriesContainerRef.current.scrollHeight;
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [entries]);

  const hasMoreEntries = entries.length > displayCount;
  const loadOlderEntries = () => setDisplayCount(prev => Math.min(entries.length, prev + PAGE_SIZE));

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
          <div id="entries" ref={entriesContainerRef}>
            {hasMoreEntries && (
              <div className="loadOlder" onClick={loadOlderEntries}>⏫</div>
            )}
            {visibleEntries.map((entry, idx) => (
              <div key={idx} className="entry" onClick={() => ToggleTimestampsVisibility()}>
                <span className="timestamp">[{timestampStringToLocalTime(entry.timestamp)}]</span>
                <span className="text">{entry.text || '\u00A0'}</span>
              </div>
            ))}
          </div>
          <div className="inputRow">
            <span className="timestamp"></span>
            <input
              ref={inputRef}
              className="input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
            />
          </div>
        </>
      ) : (
        // hidden timestamps
        <>
          <div id="entriesNoTimestamps" ref={entriesContainerRef}>
            {hasMoreEntries && (
              <div className="loadOlder" onClick={loadOlderEntries}>⏫</div>
            )}
            {visibleEntries.map((entry, idx) => (
              <div key={idx} className="entry" onClick={() => ToggleTimestampsVisibility()}>
                <span className="text">{entry.text || '\u00A0'}</span>
              </div>
            ))}
          </div>
          <div className="inputRowNoTimestamps">
            <input
              ref={inputRef}
              className="input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
            />
          </div>
        </>
      )}  
    </>
  )
}

export default App
