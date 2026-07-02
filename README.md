# Cards 304

A fully functional, real-time multiplayer implementation of the traditional South Asian trick-taking card game **304** (pronounced *Three Naught Four*). This version features an aesthetic "Gotham City" dark/neon cyberpunk UI theme and is fully responsive for both desktop and mobile landscape play.

## Features
- **Real-Time Multiplayer**: Built with WebSockets for instant state updates.
- **Full 304 Engine**: Includes character selection, bidding, trump selection, strict trick evaluation, trick-history-preserving shuffling strategies, and Donkey penalty states.
- **Holographic HUD UI**: Beautiful glassmorphism UI with neon accents, dynamic card dealing animations, and visual 15-second turn timers.
- **Responsive Design**: Play on your laptop or in landscape mode on any smartphone.
- **Auto-Cleanup**: Inactive game lobbies are automatically cleared out after 20 minutes to save server memory.

## Tech Stack
- **Frontend**: React, Vite, Vanilla CSS
- **Backend**: Python, FastAPI, Uvicorn, WebSockets
- **Deployment**: Docker, Docker Compose

## Quick Start (Local Setup)

1. Clone this repository.
2. Set up your environment variables by creating a `.env` file in the root directory:
   ```env
   BACKEND_PORT=8000
   FRONTEND_PORT=80
   VITE_WS_URL=ws://localhost:8000/ws
   ```
3. Use Docker to spin up both the frontend and backend instantly:
   ```bash
   docker compose up --build -d
   ```
4. Open your browser and navigate to `http://localhost`.

*(For full documentation, architecture details, and game rules, please see [complete_documentation.md](complete_documentation.md))*

## Deployment (Render, Heroku, VPS)

This project is fully Dockerized and structured for production deployment.

1. Ensure your `.gitignore` is completely preventing local `venv`, `node_modules`, and `.env` files from being pushed to your Git repository.
2. Hook up your GitHub repository to your host provider (e.g., Render).
3. Set your provider to use `Docker` as the build/run environment.
4. Configure your production Environment Variables on your host's dashboard (specifically the ports and the `VITE_WS_URL` pointing to your live domain, usually with `wss://`).
