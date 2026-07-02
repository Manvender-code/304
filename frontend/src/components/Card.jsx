import React from 'react';

const suitSymbols = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠'
};

const suitColors = {
  hearts: 'red',
  diamonds: 'red',
  clubs: 'black',
  spades: 'black'
};

export default function Card({ suit, rank, value, onClick, style, className = '' }) {
  if (suit === '?' || rank === '?') {
    return (
      <div className={`playing-card ${className}`} style={{ background: '#1e293b', border: '1px solid #334155', ...style }}>
        <div style={{ color: 'rgba(255,255,255,0.1)', fontSize: '3rem' }}>?</div>
      </div>
    );
  }

  const color = suitColors[suit];
  const suitSymbol = suitSymbols[suit];

  return (
    <div 
      className={`playing-card ${color} ${className}`} 
      onClick={onClick}
      style={style}
    >
      <div className="card-rank">{rank}</div>
      <div className="card-suit-small">{suitSymbol}</div>
      <div className="suit-icon">{suitSymbol}</div>
    </div>
  );
}
