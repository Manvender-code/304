import pytest
from game_engine.models import Card, GameState, PlayerState, TrickState
from game_engine.engine import is_valid_play, evaluate_trick

def test_is_valid_play_must_follow_suit():
    hand = [Card("hearts", "A", 11), Card("spades", "K", 2)]
    # Lead is hearts. Player has hearts. Must play hearts.
    assert is_valid_play(Card("hearts", "A", 11), hand, "hearts") == True
    assert is_valid_play(Card("spades", "K", 2), hand, "hearts") == False

def test_is_valid_play_no_suit():
    hand = [Card("diamonds", "A", 11), Card("spades", "K", 2)]
    # Lead is hearts. Player has no hearts. Can play anything.
    assert is_valid_play(Card("diamonds", "A", 11), hand, "hearts") == True
    assert is_valid_play(Card("spades", "K", 2), hand, "hearts") == True

def test_evaluate_trick_highest_rank():
    trick = {
        "p1": Card("hearts", "J", 30),
        "p2": Card("hearts", "9", 20),
        "p3": Card("hearts", "K", 2),
        "p4": Card("diamonds", "J", 30)
    }
    winner = evaluate_trick(trick, lead_suit="hearts", trump_suit="clubs")
    assert winner == "p1" # Jack of hearts beats 9 of hearts and diamonds Jack doesn't count (not lead, not trump)

def test_evaluate_trick_trump():
    trick = {
        "p1": Card("hearts", "J", 30),
        "p2": Card("clubs", "2", 0), # 2 of clubs (trump)
        "p3": Card("hearts", "K", 2),
        "p4": Card("diamonds", "J", 30)
    }
    winner = evaluate_trick(trick, lead_suit="hearts", trump_suit="clubs")
    assert winner == "p2" # Trump beats lead suit
