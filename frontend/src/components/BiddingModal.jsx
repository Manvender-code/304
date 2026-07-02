import React from 'react';

export default function BiddingModal({ currentBid, onBid, onPass, hasPassed, isCurrentWinner }) {
  if (hasPassed) {
    return (
      <div className="glass-panel fade-in modal-panel" style={{ zIndex: 100 }}>
        <h2>Bidding Phase</h2>
        <p>Current Highest Bid: {currentBid < 155 ? "None" : currentBid}</p>
        <p style={{ color: 'var(--danger)', marginTop: '1rem' }}>You passed</p>
      </div>
    );
  }

  return (
    <div className="glass-panel fade-in modal-panel" style={{ zIndex: 100 }}>
      <h2>Bidding Phase</h2>
      <p>Current Highest Bid: {currentBid < 155 ? "None" : currentBid}</p>
      <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', justifyContent: 'center' }}>
        <button className="btn" onClick={() => onBid(currentBid < 155 ? 155 : currentBid + 5)}>
            {currentBid < 155 ? "Bid 155" : `+5 (${currentBid + 5})`}
        </button>
        {currentBid >= 155 && (
            <button className="btn" onClick={() => onBid(currentBid + 10)}>+10 ({currentBid + 10})</button>
        )}
        {!isCurrentWinner ? (
          <button className="btn" style={{ background: 'var(--danger)' }} onClick={onPass}>Pass</button>
        ) : (
          <span style={{ color: 'var(--success)', alignSelf: 'center', marginLeft: '0.5rem', fontWeight: 'bold' }}>You are winning</span>
        )}
      </div>
    </div>
  );
}
