import React, { useState } from 'react';

export default function ShufflingModal({ isShuffler, shufflerName, onShuffleAndDeal }) {
  const [strategies, setStrategies] = useState([]);

  const handleAddStrategy = (strategy) => {
    if (strategies.length < 5) {
      setStrategies([...strategies, strategy]);
    }
  };

  const handleClear = () => {
    setStrategies([]);
  };

  if (!isShuffler) {
    return (
      <div className="glass-panel fade-in modal-panel" style={{ zIndex: 100 }}>
        <h2>Shuffling Phase</h2>
        <p>Waiting for <strong>{shufflerName}</strong> to shuffle and deal...</p>
      </div>
    );
  }

  return (
    <div className="glass-panel fade-in modal-panel" style={{ zIndex: 100 }}>
      <h2>You are the Shuffler!</h2>
      <p>Pick up to 5 shuffling strategies.</p>
      
      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: '1rem' }}>
        <button className="btn" onClick={() => handleAddStrategy('interleave')} disabled={strategies.length >= 5}>
          Interleave
        </button>
        <button className="btn" onClick={() => handleAddStrategy('bundle')} disabled={strategies.length >= 5}>
          Bundle Split
        </button>
      </div>

      <div style={{ marginTop: '1rem', minHeight: '50px', background: 'rgba(0,0,0,0.2)', padding: '0.5rem', borderRadius: '4px' }}>
        {strategies.length === 0 ? <span style={{ opacity: 0.7 }}>No strategies selected</span> : strategies.map((s, i) => (
          <div key={i}>Shuffle {i+1}: {s}</div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1rem' }}>
        <button className="btn" style={{ background: 'var(--danger)' }} onClick={handleClear} disabled={strategies.length === 0}>
          Clear
        </button>
        <button className="btn" onClick={() => onShuffleAndDeal(strategies)} disabled={strategies.length === 0}>
          Deal Cards!
        </button>
      </div>
    </div>
  );
}
