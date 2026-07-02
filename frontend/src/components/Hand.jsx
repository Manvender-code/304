import React from 'react';
import Card from './Card';

export default function Hand({ cards, onPlayCard, isMyTurn, vertical = false, leadSuit = null }) {
  const suitOrder = { 'spades': 4, 'hearts': 3, 'clubs': 2, 'diamonds': 1 };
  const rankOrder = { 'J': 8, '9': 7, 'A': 6, '10': 5, 'Q': 4, 'K': 3, '8': 2, '7': 1 };
  
  const sortedCards = [...cards].sort((a, b) => {
    if (a.suit === '?') return 0;
    if (suitOrder[a.suit] !== suitOrder[b.suit]) return suitOrder[a.suit] - suitOrder[b.suit];
    return rankOrder[b.rank] - rankOrder[a.rank];
  });

  return (
    <div className={`hand-container ${vertical ? 'vertical' : ''}`}>
      {sortedCards.map((c, i) => {
        const hasLeadSuit = cards.some(card => card.suit === leadSuit);
        const isPlayable = isMyTurn && c.suit !== '?' && (!leadSuit || c.suit === leadSuit || !hasLeadSuit);
        let statusClass = '';
        if (isMyTurn && c.suit !== '?') {
            statusClass = isPlayable ? 'playable-pop' : 'not-playable';
        }

        // Delay deal animation. e.g. 0.3s between cards to finish in ~4s.
        const animationDelay = `${i * 0.3}s`;

        return (
          <Card 
            key={i} 
            suit={c.suit} 
            rank={c.rank} 
            value={c.value}
            className={`deal-animation ${statusClass}`}
            onClick={() => {
              if (isPlayable) {
                  onPlayCard(c);
              }
            }}
            style={{ 
              cursor: isPlayable ? 'pointer' : 'default',
              animationDelay 
            }}
          />
        );
      })}
    </div>
  );
}
