Not My Diary is a lightweight, distraction-free diary and notes app built around one simple idea: open it and start writing. It brings together timestamped entries, automatic saving, and secure, user-specific sessions without the clutter of a full productivity suite.

Try the live app: [notmydiary.netlify.app](https://notmydiary.netlify.app/) — choose **Demo** to start a temporary session without creating an account.

## Features

- **Quick, timestamped writing** — Add entries in chronological order, with an option to show or hide their timestamps.
- **Automatic and manual saving** — New entries are saved automatically after a short pause, with a manual save option and clear save-status feedback.
- **Private, multi-user accounts** — Each account loads and saves its own entries.
- **Authenticated sessions** — Passwords are hashed and the API uses expiring JWTs to authorize requests.
- **Instant demo access** — Start a separate temporary diary with one click, with no signup required.
- **Responsive interface** — A writing-focused layout adapts to desktop and mobile screens.
- **Earlier-entry browsing** — Load older entries in batches to keep the writing view focused.
- **Automated entry backups** — Timestamped CSV exports archive database entries for recovery.
- **Automated demo cleanup** — A backend cleanup job deletes demo accounts and their entries once they are more than 15 minutes old.

## Technologies

- **Frontend:** React, TypeScript, Vite, Material UI icons, and CSS.
- **Backend:** Node.js and Express, exposing REST endpoints for account and entry operations.
- **Database:** PostgreSQL, accessed from the backend with parameterized queries.
- **Authentication:** JSON Web Tokens (JWT) and bcrypt password hashing.
- **Hosting:** Netlify for the frontend and Railway for the backend and database.
