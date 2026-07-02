import random
from typing import Optional
from game_engine.models import Card, GameState
from game_engine.engine import is_valid_play

def get_bot_move(state: GameState, bot_user_id: str) -> Optional[Card]:
    """Returns a valid card for the bot to play, or None if it can't play."""
    if state.phase != "playing" or state.current_turn != bot_user_id:
        return None
        
    player = state.players[bot_user_id]
    lead_suit = state.current_trick.lead_suit
    
    valid_cards = [c for c in player.hand if is_valid_play(c, player.hand, lead_suit)]
    if not valid_cards:
        return None
        
    return random.choice(valid_cards)
