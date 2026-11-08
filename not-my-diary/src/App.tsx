import './App.css';
import { useState, useEffect, useRef, useCallback } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import Login from './components/Login';
import CenteredModal from './components/CenteredModal';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import { useEntries } from './hooks/useEntries';
import { useDebouncedSave } from './hooks/useDebouncedSave.ts';
import { useAuth } from './hooks/useAuth.ts';
import { dateToTimestampString, timestampStringToLocalTime } from './utils/time.ts';
import { isTokenValid } from './utils/jwt.ts';

type SaveStatus = 'saved' | 'autosaved';

function App() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const entriesContainerRef = useRef<HTMLDivElement | null>(null);
  const pendingEntriesRef = useRef<typeof entries>([]);
  const isSavingPendingRef = useRef(false);
  const { token, userId } = useAuth();
  const { entries, setEntries, loadEntries, saveNewEntries } = useEntries(token);
  const [pendingEntries, setPendingEntries] = useState<typeof entries>([]);
  const [input, setInput] = useState<string>('');
  const [saveStatus, setSaveStatus] = useState<SaveStatus | null>(null);
  const [timestampsVisible, setTimestampsVisible] = useState<boolean>(true);
  const [displayCount, setDisplayCount] = useState<number>(16);
  const PAGE_SIZE = 20;
  const today = new Date();

  const addEntry = (text: string) => {
    const newEntry = { timestamp: dateToTimestampString(new Date()), text, userId: userId || 0};
    setEntries(prev => [...prev, newEntry]);
    pendingEntriesRef.current = [...pendingEntriesRef.current, newEntry];
    setPendingEntries(pendingEntriesRef.current);
    setInput("");
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addEntry(input);
    }
  };

  const flushPendingEntries = useCallback(async (confirmation: SaveStatus = 'autosaved') => {
    if (!token || isSavingPendingRef.current) return;

    setSaveStatus(null);
    isSavingPendingRef.current = true;
    try {
      while (pendingEntriesRef.current.length > 0) {
        const batch = [...pendingEntriesRef.current];
        await saveNewEntries(batch);

        const savedEntries = new Set(batch);
        pendingEntriesRef.current = pendingEntriesRef.current.filter(entry => !savedEntries.has(entry));
        setPendingEntries(pendingEntriesRef.current);
      }
      setSaveStatus(confirmation);
    } catch (error) {
      console.error("Failed to save pending entries:", error);
    } finally {
      isSavingPendingRef.current = false;
    }
  }, [saveNewEntries, token]);

  const flushPendingEntriesAutomatically = useCallback(
    () => flushPendingEntries('autosaved'),
    [flushPendingEntries]
  );

  useDebouncedSave(pendingEntries, 5000, flushPendingEntriesAutomatically);

  const handleManualSave = async () => {
    inputRef.current?.focus();
    await flushPendingEntries('saved');
  };

  useEffect(() => {
    if (!saveStatus) return;
    const timer = window.setTimeout(() => setSaveStatus(null), 1200);
    return () => window.clearTimeout(timer);
  }, [saveStatus]);

  function SaveButton({ status, onSave }: { status: SaveStatus | null; onSave: () => void }) {
    return (
      <button
        className={`saveButton${status ? ' isSaved' : ''}`}
        onClick={onSave}
      >
        <SaveRoundedIcon/>
        <span aria-live="polite">
          {status === 'autosaved' ? 'Autosaved' : status === 'saved' ? 'Saved' : 'Save'}
        </span>
      </button>
    );
  }

  function toggleTimestampsVisibility() {
    setTimestampsVisible(visible => !visible);
  }

  const visibleEntries = entries.slice(-displayCount);

  useEffect(() => {
    const tokenFromStorage = localStorage.getItem("token");
    if (isTokenValid(tokenFromStorage)) {
      loadEntries();
    }
  }, [loadEntries]);

  useEffect(() => {
    const favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!favicon) return;

    const fallbackHref = favicon.href;
    const icon = renderToStaticMarkup(<MenuBookOutlinedIcon aria-hidden="true" />);
    const svg = icon
      .replace(
        '<svg ',
        '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" '
      )
      .replace(
        '>',
        '><style>svg{color:#1e1e1e}@media(prefers-color-scheme:dark){svg{color:#f7f7f7}}</style>'
      );
    favicon.href = `data:image/svg+xml,${encodeURIComponent(svg)}`;

    return () => {
      favicon.href = fallbackHref;
    };
  }, []);

  useEffect(() => {
    if (!isTokenValid(token)) return;
    if (!inputRef.current) return;
    inputRef.current.focus();
  }, [token]);

  useEffect(() => {
    if (!entriesContainerRef.current) return;
    entriesContainerRef.current.scrollTop = entriesContainerRef.current.scrollHeight;
  }, [entries]);

  const hasMoreEntries = entries.length > displayCount;
  const loadOlderEntries = () => setDisplayCount(prev => Math.min(entries.length, prev + PAGE_SIZE));

  return (
    <div className="appShell">
      <aside className="sidebar">
        <div className="sidebarRule sidebarTopRule" />
        <h1 className="brand">not my<br />diary</h1>
        <div className="sidebarRule" />
        <div className="dateBlock">
          <span className="monthLabel">
            {today.toLocaleDateString(undefined, { month: 'long' }).toUpperCase()}
          </span>
          <span className="dayNumber">{String(today.getDate()).padStart(2, '0')}</span>
          <span className="dateDetails">
            {today.getFullYear()} <span aria-hidden="true">/</span>{' '}
            {today.toLocaleDateString(undefined, { weekday: 'long' }).toUpperCase()}
          </span>
        </div>
        <div className="sidebarFooter">
          <SaveButton status={saveStatus} onSave={handleManualSave} />
        </div>
      </aside>

      <main className="writingPanel">
        <header className="writingHeader">
          <button
            className="timestampToggle"
            type="button"
            onClick={() => {
              toggleTimestampsVisibility();
              inputRef.current?.focus();
            }}
            aria-pressed={timestampsVisible}
          >
            {timestampsVisible ? 'Hide timestamps' : 'Show timestamps'}
          </button>
          <button
            className="previousEntriesButton"
            type="button"
            onClick={() => {
              loadOlderEntries();
              inputRef.current?.focus();
            }}
            disabled={!hasMoreEntries}
            aria-label="View more previous entries"
          >
            <KeyboardArrowUpIcon aria-hidden="true" />
            <span>View more previous entries</span>
          </button>
        </header>

        <section
          className={`writingSurface ${timestampsVisible ? '' : 'withoutTimestamps'}`}
          aria-label="Diary entries"
        >
          <div id="entries" ref={entriesContainerRef}>
            {visibleEntries.map((entry, idx) => (
              <div key={idx} className="entry">
                <span className="timestamp" aria-hidden={!timestampsVisible}>
                  [{timestampStringToLocalTime(entry.timestamp)}]
                </span>
                <span className="text">{entry.text || '\u00A0'}</span>
              </div>
            ))}
            <div className="inputRow">
              <span className="timestamp" aria-hidden="true" />
              <input
                ref={inputRef}
                className="input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                aria-label="Write a diary entry"
              />
            </div>
          </div>
        </section>
      </main>

      <CenteredModal isOpen={!isTokenValid(token)} onClose={() => {}} isClosable={false} title="not my diary">
        <Login />
      </CenteredModal>
    </div>
  )
}

export default App
