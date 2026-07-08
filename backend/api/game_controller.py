import asyncio
from typing import Dict, Any
from game_engine.state_store import StateStore
from game_engine.models import GameState, Card
from game_engine.engine import deal_cards, get_deck, is_valid_play, evaluate_trick, calculate_round_score, shuffle_interleave, shuffle_bundles
from api.room_manager import RoomManager

class GameController:
    def __init__(self, state_store: StateStore, room_manager: RoomManager):
        self.state_store = state_store
        self.room_manager = room_manager
        self.turn_timers: Dict[str, asyncio.Task] = {}

    def _cancel_timer(self, room_id: str):
        if room_id in self.turn_timers:
            self.turn_timers[room_id].cancel()
            del self.turn_timers[room_id]

    async def _start_turn_timer(self, room_id: str, turn_user: str):
        self._cancel_timer(room_id)
        async def timer_task():
            try:
                await asyncio.sleep(15)
                state = await self.state_store.get_game_state(room_id)
                if state and state.phase == "playing" and state.current_turn == turn_user:
                    player = state.players[turn_user]
                    from game_engine.engine import is_valid_play
                    valid_cards = [c for c in player.hand if is_valid_play(c, player.hand, state.current_trick.lead_suit)]
                    import random
                    if valid_cards:
                        chosen = random.choice(valid_cards)
                        import dataclasses
                        card_dict = dataclasses.asdict(chosen)
                        await self.handle_action(room_id, turn_user, {"type": "play_card", "card": card_dict})
            except asyncio.CancelledError:
                pass
            except Exception as e:
                import traceback
                traceback.print_exc()
        self.turn_timers[room_id] = asyncio.create_task(timer_task())

    async def handle_action(self, room_id: str, user_id: str, action: Dict[str, Any]):
        state = await self.state_store.get_game_state(room_id)
        if not state:
            return
            
        action_type = action.get("type")
        
        if action_type == "select_character" and state.phase == "lobby":
            name = action.get("name")
            if name in ["Naughty", "Hotty", "Dirty", "Choti"]:
                taken = any(p.display_name == name for p in state.players.values())
                if not taken:
                    state.players[user_id].display_name = name
                    if name in ["Naughty", "Dirty"]:
                        state.players[user_id].team = 1
                    else:
                        state.players[user_id].team = 2
            await self.state_store.save_game_state(state)
            
        elif action_type == "start_game" and state.phase == "lobby":
            if len(state.players) == 4:
                chars_picked = {p.display_name for p in state.players.values()}
                if chars_picked == {"Naughty", "Hotty", "Dirty", "Choti"}:
                    def find_user(n):
                        for uid, p in state.players.items():
                            if p.display_name == n: return uid
                        return None
                    state.deal_order = [
                        find_user("Naughty"),
                        find_user("Hotty"),
                        find_user("Dirty"),
                        find_user("Choti")
                    ]
                    import random
                    state.dealer_index = random.randint(0, 3)
                state.shuffler_id = state.deal_order[state.dealer_index]
                state.distributing_team = state.players[state.shuffler_id].team
                deck = get_deck()
                random.shuffle(deck)
                hands = deal_cards(deck)
                for i, uid in enumerate(state.deal_order):
                    state.players[uid].hand = hands[i]
                    state.players[uid].passed_bidding = False
                state.phase = "bidding"
                state.bidding_passes = 0
                state.highest_bid = 155
                state.bid_winner = state.deal_order[(state.dealer_index + 1) % 4]
                state.current_turn = state.deal_order[(state.dealer_index + 2) % 4]
                await self.state_store.save_game_state(state)
                
        elif action_type == "bid" and state.phase == "bidding":
            if state.players[user_id].passed_bidding:
                return
            amt = action.get("amount")
            if state.bid_winner == user_id and amt == 0:
                return
            if amt == 0:
                state.players[user_id].passed_bidding = True
                state.bidding_passes += 1
            elif amt and amt > state.highest_bid and amt <= 304 and (amt - state.highest_bid) in (5, 10):
                state.highest_bid = amt
                state.bid_winner = user_id
                
            if state.bidding_passes >= 3:
                state.phase = "trump_selection"
                if not state.bid_winner:
                    for uid, p in state.players.items():
                        if not p.passed_bidding:
                            state.bid_winner = uid
                            break
                state.current_turn = state.bid_winner
            await self.state_store.save_game_state(state)

        elif action_type == "set_trump" and state.phase == "trump_selection":
            if state.current_turn == user_id:
                state.trump_suit = action.get("suit")
                state.phase = "playing"
                state.current_turn = state.bid_winner
                import time
                state.turn_start_time = time.time()
                await self.state_store.save_game_state(state)
                await self._start_turn_timer(room_id, state.current_turn)

        elif action_type == "play_card" and state.phase == "playing":
            if len(state.current_trick.cards_played) == 4:
                return # Ignore plays during the 2-second resolution delay

            if state.current_turn == user_id:
                self._cancel_timer(room_id)
                card_dict = action.get("card")
                card = Card(**card_dict)
                player = state.players[user_id]
                
                # Check valid play
                if is_valid_play(card, player.hand, state.current_trick.lead_suit):
                    # Remove from hand
                    player.hand = [c for c in player.hand if not (c.suit == card.suit and c.rank == card.rank)]
                    
                    if not state.current_trick.lead_suit:
                        state.current_trick.lead_suit = card.suit
                    
                    state.current_trick.cards_played[user_id] = card
                    
                    if len(state.current_trick.cards_played) == 4:
                        # 1. Save and broadcast immediately so 4th card is visible
                        await self.state_store.save_game_state(state)
                        await self.room_manager.broadcast(room_id)
                        
                        # 2. Evaluate trick after 2 seconds
                        async def evaluate_and_next_trick(r_id=room_id):
                            await asyncio.sleep(2.0)
                            curr_state = await self.state_store.get_game_state(r_id)
                            if not curr_state or curr_state.phase != "playing":
                                return
                            
                            winner_id = evaluate_trick(curr_state.current_trick.cards_played, curr_state.current_trick.lead_suit, curr_state.trump_suit)
                            winner_team = curr_state.players[winner_id].team
                            
                            won_cards = list(curr_state.current_trick.cards_played.values())
                            curr_state.trick_history.extend(won_cards)
                            if winner_team == 1:
                                curr_state.tricks_won_team_1.extend(won_cards)
                            else:
                                curr_state.tricks_won_team_2.extend(won_cards)
                                
                            curr_state.current_trick.cards_played.clear()
                            curr_state.current_trick.lead_suit = None
                            curr_state.current_turn = winner_id
                            
                            # Check round end
                            if not curr_state.players[user_id].hand:
                                calculate_round_score(curr_state)
                                if curr_state.phase != "game_over":
                                    curr_state.phase = "scoring"
                                    curr_state.deck_state = curr_state.trick_history.copy()
                                    
                                    async def transition_to_shuffling(room_i=r_id):
                                        await asyncio.sleep(5)
                                        final_state = await self.state_store.get_game_state(room_i)
                                        if final_state and final_state.phase == "scoring":
                                            final_state.phase = "shuffling"
                                            final_state.current_turn = final_state.shuffler_id
                                            await self.state_store.save_game_state(final_state)
                                            await self.room_manager.broadcast(room_i)
                                    asyncio.create_task(transition_to_shuffling())
                            else:
                                import time
                                curr_state.turn_start_time = time.time()
                                await self._start_turn_timer(r_id, curr_state.current_turn)
                                
                            await self.state_store.save_game_state(curr_state)
                            await self.room_manager.broadcast(r_id)
                            
                        asyncio.create_task(evaluate_and_next_trick())
                        return # Stop here because broadcast is handled by the async task
                    else:
                        idx = state.deal_order.index(state.current_turn)
                        state.current_turn = state.deal_order[(idx + 1) % 4]
                        import time
                        state.turn_start_time = time.time()
                        await self._start_turn_timer(room_id, state.current_turn)
                        
                    await self.state_store.save_game_state(state)
                    
        elif action_type == "shuffle_and_deal" and state.phase == "shuffling":
            if state.current_turn != user_id:
                return
            strategies = action.get("strategies", [])
            deck = state.deck_state.copy()
            
            for s in strategies:
                if s == "interleave":
                    deck = shuffle_interleave(deck)
                elif s == "bundle":
                    deck = shuffle_bundles(deck)
            
            hands = deal_cards(deck)
            for i, uid in enumerate(state.deal_order):
                state.players[uid].hand = hands[i]
                state.players[uid].passed_bidding = False
                
            state.phase = "bidding"
            state.bidding_passes = 0
            state.highest_bid = 155
            state.bid_winner = state.deal_order[(state.dealer_index + 1) % 4]
            state.current_turn = state.deal_order[(state.dealer_index + 2) % 4]
            state.tricks_won_team_1 = []
            state.tricks_won_team_2 = []
            state.trick_history = []
            state.current_trick.cards_played.clear()
            state.trump_suit = None
            
            await self.state_store.save_game_state(state)
            
        elif action_type == "restart_match" and state.phase == "game_over":
            state.global_score = 0
            idx = state.deal_order.index(state.shuffler_id) if state.shuffler_id in state.deal_order else state.dealer_index
            state.shuffler_id = state.deal_order[(idx + 2) % 4]
            state.dealer_index = (idx + 2) % 4
            state.phase = "shuffling"
            state.current_turn = state.shuffler_id
            
            deck = get_deck()
            import random
            random.shuffle(deck)
            state.deck_state = deck
            
            await self.state_store.save_game_state(state)
            
        elif action_type == "end_round_early" and state.phase == "playing":
            if user_id == state.host_id:
                self._cancel_timer(room_id)
                calculate_round_score(state)
                if state.phase != "game_over":
                    state.phase = "scoring"
                    
                    deck = state.trick_history.copy()
                    deck.extend(list(state.current_trick.cards_played.values()))
                    for uid in state.deal_order:
                        deck.extend(state.players[uid].hand)
                    state.deck_state = deck
                    
                    async def transition_to_shuffling_early(r_id=room_id):
                        await asyncio.sleep(5)
                        curr_state = await self.state_store.get_game_state(r_id)
                        if curr_state and curr_state.phase == "scoring":
                            curr_state.phase = "shuffling"
                            curr_state.current_turn = curr_state.shuffler_id
                            await self.state_store.save_game_state(curr_state)
                            await self.room_manager.broadcast(r_id)
                    asyncio.create_task(transition_to_shuffling_early())
                await self.state_store.save_game_state(state)
                    
        await self.room_manager.broadcast(room_id)
