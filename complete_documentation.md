# Complete Architecture & Documentation

## Overview
Cards 304 is a client-server architecture split into a React Vite frontend and a Python FastAPI backend. The game relies completely on a persistent two-way WebSocket connection to stream `GameState` patches down to the clients, and user `actions` up to the server.

---

## 1. Backend Architecture

### Directory Structure
```text
backend/
├── api/
│   ├── game_controller.py  # Central logic hub handling actions & state transitions
│   └── room_manager.py     # WebSocket connection management & broadcasting
├── database/               # Local SQLite database (Optional/Future persistence)
├── game_engine/
│   ├── engine.py           # Pure game rules: trick evaluation, scoring, shuffling
│   ├── models.py           # Dataclasses defining GameState, TrickState, PlayerState
│   └── state_store.py      # Abstracted state persistence (currently in-memory dictionary)
└── main.py                 # FastAPI application entry point
```

### State Management (`models.py`)
The entire source-of-truth is the `GameState` dataclass. 
- It tracks the current `phase` (`lobby`, `bidding`, `trump_selection`, `playing`, `scoring`, `shuffling`, `game_over`).
- It tracks players, the deal order, and the `trick_history`.
- `trick_history` is a critically important list that preserves the absolute sequence of cards played in tricks. This allows the deterministic `shuffle_interleave` and `shuffle_bundles` strategies to replicate real-life 304 shuffling rather than `random.shuffle`.

### Event Flow (`game_controller.py`)
When a client sends an action (e.g., `{ type: "play_card", card: {...} }`):
1. `handle_action()` intercepts it and checks if the `user_id` is the `current_turn`.
2. The action is delegated to pure engine functions (e.g., `is_valid_play` in `engine.py`).
3. If valid, the state mutates (card removed from hand, added to `current_trick.cards_played`).
4. If the trick completes (4 cards), `evaluate_trick()` determines the winner, appends the trick to `trick_history` and `tricks_won_team_x`, and changes the `current_turn`.
5. The mutated `GameState` is saved via `state_store`.
6. `room_manager.broadcast()` streams the full serialized state down to all connected WebSockets in that room.

### Turn Timers
An `asyncio.Task` is spawned via `_start_turn_timer()` at the beginning of each turn. If the user does not submit a valid action within 25 seconds, the task wakes up, forcefully generates a random valid `play_card` action on their behalf, and pushes it through `handle_action()`.

---

## 2. Frontend Architecture

### Directory Structure
```text
frontend/
├── public/                 # Static assets (Avatars, Backgrounds, Vite logo)
├── src/
│   ├── components/         # React Components (GameBoard, Card, Hand, Modals)
│   ├── hooks/              # Custom React Hooks (useGameWebSocket)
│   ├── App.jsx             # Entry component & Room generation
│   ├── index.css           # Vanilla CSS - The "Gotham Theme" Design System
│   └── main.jsx            # React DOM rendering
└── vite.config.js          # Vite bundler config
```

### The Game Loop (`useGameWebSocket.js`)
This hook handles the heavy lifting:
- Establishes `WebSocket` connection using `VITE_WS_URL`.
- Listens for incoming messages. If a message contains a `gameState` JSON payload, it updates the local React state.
- Exposes a `sendAction` function that stringifies JSON and pipes it up the socket.
- Automatically handles 3-second reconnection intervals on disconnects.

### UI & Styling (`index.css` & `GameBoard.jsx`)
The frontend is built using standard React components but styled using a unique **Gotham City / Cyberpunk UI System**:
- **Background**: `gotham_bg.jpg` sits fixed on the `body` with a radial darkness gradient.
- **Avatars**: `avatar_naughty.jpg`, `avatar_hotty.jpg`, etc., are AI-generated anime-style portraits assigned dynamically based on `display_name`.
- **Glassmorphism**: Panels utilize `.glass-panel` which combines `rgba()` backgrounds with `backdrop-filter: blur(12px)` and neon inset shadows.
- **Animations**:
  - CSS Keyframes handle the `.deal-animation` (staggered fast 4-second deal using `animationDelay` injected by React).
  - Cards feature a `.playable-pop` 3D hover animation.
  - Restricted cards receive a `.not-playable` class which sets `opacity: 0.85` and `pointer-events: none` to guide the user visually.
- **Layout**: `GameBoard.jsx` utilizes absolute positioning (`.player-top`, `.player-left`, etc.) combined with `grid-template-areas` concepts to pin hands to the four sides of the viewport, with the trick resolving in the `.trick-center`.

---

## 3. Deployment Checklist

### Frontend (e.g., Vercel, Netlify)
1. Add the project repository to Vercel/Netlify.
2. Set the Build Command: `cd frontend && npm install && npm run build`
3. Set the Output Directory: `frontend/dist`
4. Set the Environment Variable: `VITE_WS_URL=wss://[YOUR_BACKEND_DOMAIN]/ws`

### Backend (e.g., Render, VPS)
1. Setup a standard Python environment.
2. Install dependencies: `pip install -r backend/requirements.txt`
3. Run the application: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. **Important**: Ensure the host server supports WebSocket upgrading (if using Nginx, configure `proxy_set_header Upgrade $http_upgrade;`).
