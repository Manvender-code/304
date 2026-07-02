from dataclasses import dataclass, field
from typing import List, Dict, Optional

@dataclass
class Card:
    suit: str
    rank: str
    value: int

@dataclass
class PlayerState:
    user_id: str
    team: int
    display_name: str = ""
    passed_bidding: bool = False
    hand: List[Card] = field(default_factory=list)
    connected: bool = True
    is_bot: bool = False

@dataclass
class TrickState:
    lead_suit: Optional[str] = None
    cards_played: Dict[str, Card] = field(default_factory=dict) # user_id -> Card
    winner: Optional[str] = None

@dataclass
class GameState:
    room_id: str
    phase: str = "lobby" # lobby, dealing, bidding, playing, scoring
    players: Dict[str, PlayerState] = field(default_factory=dict) # user_id -> PlayerState
    current_turn: Optional[str] = None
    highest_bid: int = 150 # bidding starts at 155, so previous highest is 150
    bid_winner: Optional[str] = None
    bidding_passes: int = 0
    trump_suit: Optional[str] = None
    turn_start_time: float = 0.0
    team_1_score: int = 0
    team_2_score: int = 0
    global_score: int = 0
    distributing_team: int = 1
    shuffler_id: Optional[str] = None
    donkey_loser: Optional[str] = None
    host_id: Optional[str] = None
    deck_state: List[Card] = field(default_factory=list)
    current_trick: TrickState = field(default_factory=TrickState)
    tricks_won_team_1: List[Card] = field(default_factory=list)
    tricks_won_team_2: List[Card] = field(default_factory=list)
    trick_history: List[Card] = field(default_factory=list)
    deal_order: List[str] = field(default_factory=list) # user_ids in play order
    dealer_index: int = 0
