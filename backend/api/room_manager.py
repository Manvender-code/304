import asyncio
import dataclasses
from typing import Dict
from fastapi import WebSocket

from game_engine.state_store import StateStore
from game_engine.models import GameState, PlayerState
from game_engine.engine import deal_cards, get_deck

def _obfuscate_state(state: GameState, user_id: str) -> dict:
    def as_dict(obj):
        if dataclasses.is_dataclass(obj):
            return {f.name: as_dict(getattr(obj, f.name)) for f in dataclasses.fields(obj)}
        elif isinstance(obj, list):
            return [as_dict(i) for i in obj]
        elif isinstance(obj, dict):
            return {k: as_dict(v) for k, v in obj.items()}
        return obj

    state_dict = as_dict(state)
    for p_id, p_state in state_dict.get("players", {}).items():
        if p_id != user_id:
            p_state["hand"] = [{"suit": "?", "rank": "?", "value": 0} for _ in p_state.get("hand", [])]
    return state_dict

class RoomManager:
    def __init__(self, state_store: StateStore):
        self.state_store = state_store
        self.active_connections: Dict[str, Dict[str, WebSocket]] = {}
        self.session_tokens: Dict[str, str] = {}
        self.disconnect_tasks: Dict[str, asyncio.Task] = {}

    async def connect(self, websocket: WebSocket, room_id: str, user_id: str, session_token: str):
        await websocket.accept()
        
        if room_id not in self.active_connections:
            self.active_connections[room_id] = {}
            
        self.active_connections[room_id][user_id] = websocket
        self.session_tokens[session_token] = user_id
        
        if user_id in self.disconnect_tasks:
            self.disconnect_tasks[user_id].cancel()
            del self.disconnect_tasks[user_id]

        state = await self.state_store.get_game_state(room_id)
        if not state:
            state = GameState(room_id=room_id)
            await self.state_store.save_game_state(state)
            
            async def lobby_timeout():
                await asyncio.sleep(20 * 60)
                current_state = await self.state_store.get_game_state(room_id)
                if current_state and current_state.phase == "lobby":
                    if room_id in self.active_connections:
                        for uid, ws_conn in list(self.active_connections[room_id].items()):
                            try:
                                await ws_conn.close(code=1000, reason="Room closed due to inactivity")
                            except Exception:
                                pass
                        del self.active_connections[room_id]
                    await self.state_store.delete_game_state(room_id)
            
            asyncio.create_task(lobby_timeout())
            
        if user_id not in state.players:
            if len(state.players) >= 4:
                await websocket.close(code=1000, reason="Room is full")
                return
                
            if len(state.players) == 0:
                state.host_id = user_id
                
            state.players[user_id] = PlayerState(user_id=user_id, team=0, display_name="")

            
        state.players[user_id].connected = True
        await self.state_store.save_game_state(state)
        await self.broadcast(room_id)

    async def disconnect(self, room_id: str, user_id: str):
        if room_id in self.active_connections and user_id in self.active_connections[room_id]:
            del self.active_connections[room_id][user_id]
            
        state = await self.state_store.get_game_state(room_id)
        if state and user_id in state.players:
            state.players[user_id].connected = False
            await self.state_store.save_game_state(state)
            await self.broadcast(room_id)
            
            task = asyncio.create_task(self.handle_timeout(room_id, user_id))
            self.disconnect_tasks[user_id] = task

    async def handle_timeout(self, room_id: str, user_id: str):
        try:
            await asyncio.sleep(60) 
            state = await self.state_store.get_game_state(room_id)
            if state and user_id in state.players:
                if not state.players[user_id].connected:
                    state.players[user_id].is_bot = True
                    await self.state_store.save_game_state(state)
                    await self.broadcast(room_id)
        except asyncio.CancelledError:
            pass

    async def broadcast(self, room_id: str):
        state = await self.state_store.get_game_state(room_id)
        if not state or room_id not in self.active_connections:
            return
            
        for user_id, ws in list(self.active_connections[room_id].items()):
            user_state = _obfuscate_state(state, user_id)
            try:
                await ws.send_json(user_state)
            except Exception:
                pass
