import random
from typing import List, Tuple, Dict
from game_engine.models import Card, GameState, PlayerState

SUITS = ["hearts", "diamonds", "clubs", "spades"]
RANKS = ["J", "9", "A", "10", "Q", "K", "8", "7", "6", "5", "4", "3", "2"]
RANK_VALUES = {
    "J": 30, "9": 20, "A": 11, "10": 10,
    "Q": 3, "K": 2, "8": 0, "7": 0, "6": 0,
    "5": 0, "4": 0, "3": 0, "2": 0
}

def get_deck() -> List[Card]:
    return [Card(suit=s, rank=r, value=RANK_VALUES[r]) for s in SUITS for r in RANKS]

def shuffle_interleave(deck: List[Card]) -> List[Card]:
    mid = len(deck) // 2
    half1 = deck[:mid]
    half2 = deck[mid:]
    shuffled = []
    for i in range(max(len(half1), len(half2))):
        if i < len(half1): shuffled.append(half1[i])
        if i < len(half2): shuffled.append(half2[i])
    return shuffled

def shuffle_bundles(deck: List[Card]) -> List[Card]:
    bundle_size = len(deck) // 5
    bundles = []
    for i in range(4):
        bundles.append(deck[i*bundle_size:(i+1)*bundle_size])
    bundles.append(deck[4*bundle_size:])
    random.shuffle(bundles)
    shuffled = []
    for b in bundles:
        shuffled.extend(b)
    return shuffled

def deal_cards(deck: List[Card]) -> Tuple[List[Card], List[Card], List[Card], List[Card]]:
    hands = ([], [], [], [])
    
    # 5 cards each
    for i in range(4):
        hands[i].extend(deck[0:5])
        deck = deck[5:]
    # 4 cards each
    for i in range(4):
        hands[i].extend(deck[0:4])
        deck = deck[4:]
    # 4 cards each
    for i in range(4):
        hands[i].extend(deck[0:4])
        deck = deck[4:]
        
    return hands

def is_valid_play(card: Card, hand: List[Card], lead_suit: str) -> bool:
    if not lead_suit:
        return True
    if card.suit == lead_suit:
        return True
    
    # Check if they have the lead suit in hand
    has_lead_suit = any(c.suit == lead_suit for c in hand)
    if has_lead_suit:
        return False # They must follow suit
        
    return True # Can play trump or any card

def evaluate_trick(trick_cards: Dict[str, Card], lead_suit: str, trump_suit: str) -> str:
    """Returns the user_id of the trick winner"""
    best_player = None
    best_card = None
    
    for player, card in trick_cards.items():
        if best_card is None:
            best_player = player
            best_card = card
            continue
            
        if card.suit == trump_suit and best_card.suit != trump_suit:
            best_card = card
            best_player = player
        elif card.suit == best_card.suit:
            if RANKS.index(card.rank) < RANKS.index(best_card.rank):
                best_card = card
                best_player = player
                
    return best_player

def calculate_round_score(state: GameState):
    team_1_points = sum(c.value for c in state.tricks_won_team_1)
    team_2_points = sum(c.value for c in state.tricks_won_team_2)
    
    bid = state.highest_bid
    bid_team = state.players[state.bid_winner].team
    
    made_bid = (team_1_points >= bid) if bid_team == 1 else (team_2_points >= bid)
    score_change = -bid if made_bid else (2 * bid)
    
    if state.distributing_team == bid_team:
        state.global_score += score_change
    else:
        state.global_score -= score_change
        
    if state.global_score < 0:
        state.distributing_team = 3 - state.distributing_team
        state.global_score = abs(state.global_score)
        idx = state.deal_order.index(state.shuffler_id) if state.shuffler_id in state.deal_order else state.dealer_index
        state.shuffler_id = state.deal_order[(idx + 1) % 4]
        state.dealer_index = (idx + 1) % 4

    if state.global_score >= 1000:
        state.phase = "game_over"
        state.donkey_loser = state.shuffler_id
