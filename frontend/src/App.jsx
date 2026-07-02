import React, { useState } from 'react';
import GameBoard from './components/GameBoard';
import RulesModal from './components/RulesModal';

function App() {
  const [roomId, setRoomId] = useState('');
  const [inputRoom, setInputRoom] = useState('');
  const [showRules, setShowRules] = useState(false);

  if (roomId) {
    return <GameBoard roomId={roomId} onLeave={() => setRoomId('')} />;
  }

  return (
    <div className="app-container fade-in">
      <div className="glass-panel login-panel">
        <h1 style={{ marginBottom: '2rem', fontSize: 'clamp(1.8rem, 5vw, 2.5rem)', color: 'var(--primary)' }}>Cards 304</h1>
        <p style={{ marginBottom: '1.5rem', color: 'var(--text-muted)' }}>Gotham City Edition</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input 
            className="input-field" 
            placeholder="ENTER ROOM ID"
            value={inputRoom}
            onChange={(e) => setInputRoom(e.target.value)}
          />
          <button 
            className="btn"
            onClick={() => {
              if (inputRoom) setRoomId(inputRoom);
            }}
          >
            Join Room
          </button>
          
          <div style={{ margin: '1rem 0', color: 'var(--border-glow)', display: 'flex', alignItems: 'center' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-glow)' }}></div>
            <span style={{ margin: '0 10px', fontFamily: 'Orbitron', fontSize: '0.8rem' }}>OR</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-glow)' }}></div>
          </div>
          
          <button 
            className="btn btn-success"
            onClick={() => {
              setRoomId(Math.random().toString(36).substring(2, 8));
            }}
          >
            Initialize Protocol (Create Room)
          </button>
        </div>
      </div>

      {/* How to Play Button */}
      <button 
        className="btn"
        style={{ 
          position: 'fixed', 
          bottom: '20px', 
          left: '20px', 
          background: 'transparent',
          border: '1px solid var(--primary)',
          fontSize: '0.8rem',
          padding: '8px 16px',
          boxShadow: 'none'
        }}
        onClick={() => setShowRules(true)}
      >
        How to play it
      </button>

      {/* Rules Modal */}
      {showRules && <RulesModal onClose={() => setShowRules(false)} />}
    </div>
  );
}

export default App;
