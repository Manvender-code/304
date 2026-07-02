# Cards 304

A fully functional, real-time multiplayer implementation of the traditional South Asian trick-taking card game **304** (pronounced *Three Naught Four*). This version features an aesthetic "Gotham City" dark/neon cyberpunk UI theme.

## Features
- **Real-Time Multiplayer**: Built with WebSockets for instant state updates.
- **Full 304 Engine**: Includes character selection, bidding, trump selection, strict trick evaluation, trick-history-preserving shuffling strategies (interleave/bundle), and Donkey penalty states.
- **Holographic HUD UI**: Beautiful glassmorphism UI with neon accents, dynamic card dealing animations, and visual turn timers.
- **Single Command Startup**: Easily spin up both frontend and backend development servers.

## Tech Stack
- **Frontend**: React, Vite, Vanilla CSS
- **Backend**: Python, FastAPI, Uvicorn, WebSockets

## Setup & Installation

### Prerequisites
- Node.js (v18+)
- Python (v3.9+)

### Installation
1. Clone this repository.
2. Install the frontend dependencies and root packages:
   ```bash
   npm install
   cd frontend && npm install
   cd ..
   ```
3. Set up the Python virtual environment and install backend dependencies:
   ```bash
   cd backend
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On Mac/Linux:
   source venv/bin/activate
   
   pip install -r requirements.txt
   cd ..
   ```
4. Define your environment variables:
   - Create a `.env` file in the `frontend` folder containing:
     ```env
     VITE_WS_URL=ws://localhost:8015/ws
     ```

## Running the Application
From the root of the project, run:
```bash
npm run start
```
This single command utilizes `concurrently` to spin up the FastAPI backend on port `8015` and the Vite React frontend on port `5173`. 

Open your browser to `http://localhost:5173`.

## How to Play
1. Click **Initialize Protocol** to generate a new Room ID.
2. Share the Room ID with 3 other friends.
3. Select your character (Naughty/Dirty are Team 1, Hotty/Choti are Team 2).
4. Start the game!

## Deployment

### Using Docker (Recommended)
This project is fully Dockerized for production. The setup includes:
- A multi-stage **Vite + Nginx** container for the frontend.
- A **FastAPI + Uvicorn** container for the backend.
- A **PostgreSQL 15** container for persistent data.

#### Setup Environment Variables
Before running the project, configure your environment variables:
1. Copy `.env.example` to `.env` in the root directory:
   ```bash
   cp .env.example .env
   ```
2. *(Optional)* Modify the variables in `.env` as needed. The default values will work out-of-the-box for local testing.

#### Run the Containers
Ensure Docker Desktop is installed and running, then build and start the containers in detached mode:
   ```bash
   docker compose up --build -d
   ```
The services will be available at:
   - **Frontend**: http://localhost
   - **Backend API**: http://localhost:8000
   - **Interactive API Docs**: http://localhost:8000/docs

### Manual Deployment
If you intend to host this in production without Docker:
- The **Frontend** can be hosted on Vercel, Netlify, or Cloudflare Pages. Make sure to set the `VITE_WS_URL` environment variable in your provider's dashboard to point to your live backend domain (e.g. `wss://your-api-domain.com/ws`).
- The **Backend** requires a provider that supports WebSocket persistence, such as Render, Heroku, or a digital VPS (DigitalOcean/AWS EC2) with Nginx reverse proxying configured for Upgrade headers. No external API keys or paid databases are required.
