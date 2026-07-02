# Complete Architecture & Documentation

## Overview
Cards 304 is a client-server architecture split into a React Vite frontend and a Python FastAPI backend. The game relies completely on a persistent two-way WebSocket connection to stream `GameState` patches down to the clients, and user `actions` up to the server.

---

## How to Play (Game Rules)

304 is a highly strategic trick-taking card game played by 4 players in fixed partnerships (Team 1 vs Team 2). 

### 1. The Deck and Card Values
The game uses a stripped-down 32-card deck (from 7 to Jack of each suit). The goal is to collect points through winning tricks. There are exactly 304 points total in the deck:
- **Jack (J)**: 30 points (Highest rank)
- **Nine (9)**: 20 points
- **Ace (A)**: 11 points
- **Ten (10)**: 10 points
- **Queen (Q)**: 3 points
- **King (K)**: 2 points
- **Eight (8) & Seven (7)**: 0 points (Lowest rank)

### 2. The Deal & Bidding Phase
- Players are dealt 4 cards each initially.
- Based on these 4 cards, players bid on how many points their team can win. 
- Bids must be a minimum of **155** and can go up to **304**.
- The highest bidder gets the privilege to secretly choose the **Trump Suit**.
- After the trump is selected, the rest of the cards are dealt so everyone has 8 cards.

### 3. Trick-Taking (The Gameplay)
- The player to the right of the dealer leads the first trick by playing a card.
- **You MUST follow suit** if you have a card of the lead suit.
- If you cannot follow suit, you may play a card of the Trump suit (to win the trick) or any other card.
- The highest-ranking card of the lead suit wins the trick, UNLESS a Trump card is played, in which case the highest Trump card wins.
- The winner of the trick collects the points from those cards and leads the next trick.

### 4. Winning and Global Scoring (The Donkey System)
- At the end of the round, points are tallied.
- If the Bidding Team scores at least their bid amount, they subtract their bid from the Global Score. 
- If the Bidding Team fails, they are penalized double their bid amount!
- Reaching a global score of 1000 causes the losing shuffling team to become the "Donkey" and the game restarts.

---

## 1. Backend Architecture

### Directory Structure
```text
backend/
├── api/
│   ├── game_controller.py  # Central logic hub handling actions & state transitions
│   └── room_manager.py     # WebSocket connection & cleanup tasks
├── game_engine/
│   ├── engine.py           # Pure game rules: trick evaluation, scoring, shuffling
│   ├── models.py           # Dataclasses defining GameState, PlayerState
│   └── state_store.py      # In-memory dictionary state persistence
└── main.py                 # FastAPI application entry point
```

### State Management & Cleanup
The source-of-truth is the `GameState` dataclass, managed by `state_store.py`.
- Because rooms are stored in-memory, a cleanup `asyncio.Task` runs upon room creation. If a room stays idle in the `"lobby"` phase for **20 minutes**, it automatically destroys the room, freeing memory and disconnecting lingering WebSockets.
- `trick_history` preserves the absolute sequence of cards, enabling realistic 304 shuffling (`shuffle_interleave` and `shuffle_bundles`) rather than generic RNG.

### Turn Timers
An `asyncio.Task` is spawned at the beginning of each turn. If a user does not submit a valid action within **15 seconds**, the task forces a random valid `play_card` action on their behalf to keep the game moving.

---

## 2. Frontend Architecture

### UI & Styling (`index.css` & `GameBoard.jsx`)
The frontend is fully responsive (Desktop & Mobile Landscape) and built on a **Gotham City / Cyberpunk Design System**:
- **Glassmorphism**: Panels utilize `.glass-panel` combining `rgba()` backgrounds with `backdrop-filter: blur(12px)`.
- **Responsive Layout**: Utilizing `clamp()`, flexible absolute positioning, and specific `@media (max-height: 500px)` overrides, the game board seamlessly shrinks and reflows to fit perfectly inside standard mobile phone landscape viewports. User badges (avatars and timers) remain securely pinned to corners to avoid card overlaps.
- **Animations**: CSS Keyframes handle staggered dealing animations (`.deal-animation`) and 3D card pops.

### The Game Loop (`useGameWebSocket.js`)
- Establishes a WebSocket connection using `VITE_WS_URL`.
- Listens for incoming `gameState` JSON payloads to sync local React state.
- Automatically handles 3-second reconnection intervals on disconnects.

---

## 3. Deployment Checklist

### Using Docker (Recommended for Render)
1. Provide a `.env` file containing `BACKEND_PORT`, `FRONTEND_PORT`, and `VITE_WS_URL`.
2. Connect your repository to your host.
3. Deploy the `docker-compose.yml` (if using Docker Compose) or individual Dockerfiles (if using manual service mapping). 
4. Ensure the Host Server supports WebSocket upgrading.
