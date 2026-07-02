from abc import ABC, abstractmethod
from typing import Optional
from game_engine.models import GameState

class StateStore(ABC):
    @abstractmethod
    async def get_game_state(self, room_id: str) -> Optional[GameState]:
        pass
        
    @abstractmethod
    async def save_game_state(self, state: GameState):
        pass

    @abstractmethod
    async def delete_game_state(self, room_id: str):
        pass

class InMemoryStateStore(StateStore):
    def __init__(self):
        self._states = {}

    async def get_game_state(self, room_id: str) -> Optional[GameState]:
        return self._states.get(room_id)

    async def save_game_state(self, state: GameState):
        self._states[state.room_id] = state

    async def delete_game_state(self, room_id: str):
        if room_id in self._states:
            del self._states[room_id]
