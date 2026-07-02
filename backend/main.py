from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware
import uuid

from game_engine.state_store import InMemoryStateStore
from api.room_manager import RoomManager
from api.game_controller import GameController

app = FastAPI(title="Cards304 API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

state_store = InMemoryStateStore()
room_manager = RoomManager(state_store)
game_controller = GameController(state_store, room_manager)

@app.websocket("/ws/room/{room_id}")
async def websocket_endpoint(
    websocket: WebSocket, 
    room_id: str, 
    user_id: str = Query(None), 
    session_token: str = Query(None)
):
    if not user_id:
        user_id = str(uuid.uuid4())
    if not session_token:
        session_token = str(uuid.uuid4())
        
    await room_manager.connect(websocket, room_id, user_id, session_token)
    
    try:
        while True:
            data = await websocket.receive_json()
            await game_controller.handle_action(room_id, user_id, data)
    except WebSocketDisconnect:
        await room_manager.disconnect(room_id, user_id)

@app.get("/")
def read_root():
    return {"status": "Cards304 API is running"}
