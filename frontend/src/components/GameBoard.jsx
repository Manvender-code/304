import React from 'react';
import { useGameWebSocket } from '../hooks/useGameWebSocket';
import Hand from './Hand';
import Card from './Card';
import BiddingModal from './BiddingModal';
import ShufflingModal from './ShufflingModal';

export default function GameBoard({ roomId, onLeave }) {
  const { gameState, connected, sendAction, userId } = useGameWebSocket(roomId);

  const [timeLeft, setTimeLeft] = React.useState(15);

  React.useEffect(() => {
    if (!gameState || gameState.phase !== 'playing' || !gameState.turn_start_time) return;
    const interval = setInterval(() => {
      const elapsed = (Date.now() / 1000) - gameState.turn_start_time;
      const remaining = Math.max(0, Math.ceil(15 - elapsed));
      setTimeLeft(remaining);
    }, 500);
    return () => clearInterval(interval);
  }, [gameState?.phase, gameState?.turn_start_time, gameState?.current_turn]);

  if (!connected) {
    return <div className="app-container"><h2>Connecting to {roomId}...</h2></div>;
  }

  if (!gameState) {
    return <div className="app-container"><h2>Loading Game State...</h2></div>;
  }

  const { phase, players, deal_order, current_turn, highest_bid, current_trick, turn_start_time } = gameState;
  const numPlayers = Object.keys(players).length;

  const handleStart = () => sendAction({ type: "start_game" });
  const handleBid = (amount) => sendAction({ type: "bid", amount });
  const handlePass = () => sendAction({ type: "bid", amount: 0 });
  const handlePlayCard = (card) => sendAction({ type: "play_card", card });

  let meIndex = deal_order.indexOf(userId);
  if (meIndex === -1) meIndex = 0; 

  const getPlayer = (offset) => {
    if (deal_order.length < 4) return null;
    const idx = (meIndex + offset) % 4;
    const id = deal_order[idx];
    return players[id];
  };

  const me = getPlayer(0);
  const right = getPlayer(1);
  const top = getPlayer(2);
  const left = getPlayer(3);

  const renderTrickCard = (playerId) => {
    if (!current_trick?.cards_played[playerId]) return null;
    const c = current_trick.cards_played[playerId];
    return <Card suit={c.suit} rank={c.rank} value={c.value} />;
  };

  const getAvatar = (name) => {
    switch (name) {
      case 'Naughty': return '/avatar_naughty.jpg';
      case 'Hotty': return '/avatar_hotty.jpg';
      case 'Dirty': return '/avatar_dirty.jpg';
      case 'Choti': return '/avatar_choti.jpg';
      default: return null;
    }
  };

  const renderPlayerBadge = (playerInfo, position) => {
    if (!playerInfo) return null;
    const isTurn = current_turn === playerInfo.user_id && phase === 'playing';
    const isShuffler = gameState.shuffler_id === playerInfo.user_id;
    return (
      <div className="player-badge" style={{ marginBottom: position === 'top' ? 10 : 0, marginTop: position === 'bottom' ? 10 : 0 }}>
        <img 
          src={getAvatar(playerInfo.display_name)} 
          className={`player-avatar ${isTurn ? 'active-turn' : ''}`}
          alt={playerInfo.display_name} 
        />
        <div className="player-name-plate">
          {playerInfo.display_name || 'Agent'} {isShuffler ? <span style={{ color: 'var(--primary)', marginLeft: '4px' }}>[SHUFFLER]</span> : ''} {isTurn ? `[${timeLeft}s]` : ''}
        </div>
      </div>
    );
  };

  if (phase === 'lobby') {
    return (
      <div className="game-board fade-in">
        <div className="hud-top-left">
          <button className="btn btn-danger" onClick={onLeave}>Abort Protocol (Leave)</button>
        </div>
        <div className="trick-center glass-panel fade-in modal-panel" style={{ zIndex: 100 }}>
            <h2 style={{ color: 'var(--primary)', marginBottom: '0.5rem', letterSpacing: '3px' }}>SYSTEM LOBBY</h2>
            <p style={{ margin: '0.5rem 0 1.5rem', color: 'var(--text-muted)' }}>Room ID: <strong style={{ color: '#fff' }}>{roomId}</strong></p>
            <div className="grid-2col">
              {['Naughty', 'Hotty', 'Dirty', 'Choti'].map(name => {
                const isTaken = Object.values(gameState.players || {}).some(p => p.display_name === name);
                const isMe = me?.display_name === name;
                return (
                  <div key={name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <img 
                      src={getAvatar(name)} 
                      alt={name} 
                      style={{ 
                        width: '80px', height: '80px', borderRadius: '50%', 
                        border: `2px solid ${isMe ? 'var(--success)' : isTaken ? 'var(--danger)' : 'var(--primary)'}`, 
                        opacity: (isTaken && !isMe) ? 0.3 : 1, 
                        marginBottom: '10px',
                        boxShadow: `0 0 10px ${isMe ? 'var(--success)' : isTaken ? 'transparent' : 'var(--border-glow)'}`
                      }} 
                    />
                    <button 
                      className={`btn ${isMe ? 'btn-success' : (isTaken ? 'btn-danger' : '')}`}
                      disabled={isTaken && !isMe} 
                      style={{ width: '100%', fontSize: '0.85rem', padding: '0.5rem' }}
                      onClick={() => sendAction({ type: "select_character", name: name })}
                    >
                      {isMe ? `${name} (YOU)` : isTaken ? `${name} (TAKEN)` : name}
                    </button>
                  </div>
                );
              })}
            </div>
            {Object.values(gameState.players || {}).filter(p => p.display_name).length === 4 ? (
              <button className="btn btn-success" style={{ width: '100%', marginTop: '1rem', letterSpacing: '2px' }} onClick={handleStart}>INITIALIZE MATCH</button>
            ) : (
              <p style={{ opacity: 0.6, marginTop: '1.5rem', fontFamily: 'Orbitron', fontSize: '0.9rem' }}>AWAITING OPERATIVES (4 REQUIRED)</p>
            )}
        </div>
      </div>
    );
  }

  return (
    <div className="game-board fade-in">
      <div className="hud-top-left">
        <button className="btn btn-danger" onClick={onLeave} style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>Leave Room</button>
      </div>
      
      <div className="hud-top-right">
        <div className="hud-panel" style={{ textAlign: 'right' }}>
          <p style={{ color: 'var(--text-muted)' }}>Room: <span style={{ color: '#fff', userSelect: 'all' }}>{roomId}</span></p>
          <p>Global Score: <span>{gameState.global_score}</span></p>
          <p>Round Score: T1(<span>{gameState.tricks_won_team_1?.reduce((a,c) => a+c.value, 0) || 0}</span>) T2(<span>{gameState.tricks_won_team_2?.reduce((a,c) => a+c.value, 0) || 0}</span>)</p>
          {highest_bid >= 155 && <p>Target Bid: <span style={{ color: 'var(--primary)' }}>{highest_bid}</span></p>}
          <p>Trump Suit: <span style={{ color: 'var(--danger)' }}>{gameState.trump_suit || 'UNIDENTIFIED'}</span></p>
        </div>
      </div>

      {phase === 'game_over' && (
        <div className="trick-center glass-panel fade-in modal-panel" style={{ zIndex: 100, border: '2px solid var(--danger)' }}>
          <h1 style={{ color: 'var(--danger)', fontSize: 'clamp(2rem, 5vw, 3.5rem)', margin: '0 0 1rem 0' }}>DONKEY!</h1>
          <h2 style={{ fontFamily: 'Orbitron' }}>{gameState.players[gameState.donkey_loser]?.display_name} IS THE DONKEY</h2>
          <p style={{ margin: '1rem 0', color: 'var(--text-muted)' }}>Global Score Critical Failure (Exceeded 1000)</p>
          <button 
            className="btn btn-danger" 
            style={{ marginTop: '1rem' }}
            onClick={() => sendAction({ type: "restart_match" })}
          >
            PUNISH TEAMMATE & RESTART
          </button>
        </div>
      )}

      {phase === 'scoring' && (
        <div className="trick-center" style={{ zIndex: 100 }}>
          <div className="glass-panel fade-in modal-panel">
            <h2 style={{ color: 'var(--success)' }}>ROUND TERMINATED</h2>
            <p style={{ color: 'var(--text-muted)' }}>Gathering data... preparing next sequence.</p>
          </div>
        </div>
      )}

      {phase === 'shuffling' && (
        <div className="trick-center" style={{ zIndex: 100 }}>
          <ShufflingModal 
            isShuffler={userId === gameState.shuffler_id} 
            shufflerName={gameState.players[gameState.shuffler_id]?.display_name} 
            onShuffleAndDeal={(strategies) => sendAction({ type: "shuffle_and_deal", strategies })}
          />
        </div>
      )}

      {phase === 'bidding' && (
        <div className="trick-center" style={{ zIndex: 100 }}>
            <BiddingModal 
              currentBid={highest_bid} 
              onBid={handleBid} 
              onPass={handlePass} 
              hasPassed={me?.passed_bidding}
              isCurrentWinner={gameState.bid_winner === userId}
            />
        </div>
      )}
      
      {phase === 'trump_selection' && current_turn === userId && (
          <div className="trick-center" style={{ zIndex: 100 }}>
             <div className="glass-panel fade-in modal-panel trump-modal">
                <h2 style={{ color: 'var(--primary)', marginBottom: '1rem' }}>SELECT TRUMP PROTOCOL</h2>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', justifyContent: 'center' }}>
                    {['hearts', 'diamonds', 'clubs', 'spades'].map(s => (
                        <button key={s} className="btn" onClick={() => sendAction({ type: 'set_trump', suit: s })}>{s.toUpperCase()}</button>
                    ))}
                </div>
             </div>
          </div>
      )}

      {top && (
        <div className="player-area player-top fade-in">
          {renderPlayerBadge(top, 'top')}
          <Hand cards={top.hand} />
        </div>
      )}

      {left && (
        <div className="player-area player-left fade-in">
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexDirection: 'row-reverse' }}>
            <div style={{ transform: 'rotate(-90deg)', transformOrigin: 'center', whiteSpace: 'nowrap' }}>
               {renderPlayerBadge(left, 'side')}
            </div>
            <Hand cards={left.hand} vertical={true} />
          </div>
        </div>
      )}

      {phase !== 'lobby' && (
        <div className="trick-center fade-in">
          <div className="trick-board">
             {top && renderTrickCard(top.user_id) && <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)' }}>{renderTrickCard(top.user_id)}</div>}
             {me && renderTrickCard(me.user_id) && <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)' }}>{renderTrickCard(me.user_id)}</div>}
             {left && renderTrickCard(left.user_id) && <div style={{ position: 'absolute', top: '50%', left: 0, transform: 'translateY(-50%)' }}>{renderTrickCard(left.user_id)}</div>}
             {right && renderTrickCard(right.user_id) && <div style={{ position: 'absolute', top: '50%', right: 0, transform: 'translateY(-50%)' }}>{renderTrickCard(right.user_id)}</div>}
          </div>
        </div>
      )}

      {right && (
        <div className="player-area player-right fade-in">
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <Hand cards={right.hand} vertical={true} />
            <div style={{ transform: 'rotate(90deg)', transformOrigin: 'center', whiteSpace: 'nowrap' }}>
               {renderPlayerBadge(right, 'side')}
            </div>
          </div>
        </div>
      )}

      {me && (
        <>
          <div className="player-area player-bottom fade-in">
            <Hand 
              cards={me.hand} 
              onPlayCard={handlePlayCard} 
              isMyTurn={current_turn === userId && phase === 'playing'} 
              leadSuit={gameState.current_trick?.lead_suit} 
            />
            
            <div className="hud-bottom-right">
              {(phase === 'playing' || phase === 'bidding') && (
                <div className="hud-panel" style={{ marginBottom: '10px', background: 'transparent', border: 'none', boxShadow: 'none', padding: 0 }}>
                  {userId === gameState.host_id && phase === 'playing' && (() => {
                    const team1Points = gameState.tricks_won_team_1?.reduce((a,c) => a+c.value, 0) || 0;
                    const team2Points = gameState.tricks_won_team_2?.reduce((a,c) => a+c.value, 0) || 0;
                    let nonBiddingPoints = 0;
                    let biddingPoints = 0;
                    if (gameState.bid_winner && gameState.players[gameState.bid_winner]) {
                      const bidTeam = gameState.players[gameState.bid_winner].team;
                      biddingPoints = bidTeam === 1 ? team1Points : team2Points;
                      nonBiddingPoints = bidTeam === 1 ? team2Points : team1Points;
                    }
                    
                    const nonBiddingWins = nonBiddingPoints > (304 - gameState.highest_bid);
                    const biddingWins = biddingPoints >= gameState.highest_bid;
                    
                    return (nonBiddingWins || biddingWins) ? (
                      <div style={{ marginTop: '8px' }}>
                        <button className="btn btn-danger" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => sendAction({ type: "end_round_early" })}>
                          EXECUTE EARLY TERMINATION
                        </button>
                      </div>
                    ) : null;
                  })()}
                </div>
              )}
            </div>
          </div>
          <div className="me-badge-container fade-in">
            {renderPlayerBadge(me, 'bottom')}
          </div>
        </>
      )}
    </div>
  );
}
