import React from 'react';

export default function RulesModal({ onClose }) {
  return (
    <div className="modal-overlay fade-in" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.85)' }}>
      <div className="glass-panel" style={{ maxWidth: '600px', width: '90%', maxHeight: '85vh', overflowY: 'auto', textAlign: 'left', padding: '2rem', border: '1px solid var(--primary)' }}>
        <h2 style={{ color: 'var(--primary)', marginBottom: '1.5rem', textAlign: 'center', borderBottom: '1px solid var(--border-glow)', paddingBottom: '0.5rem', letterSpacing: '2px' }}>
          THE PROTOCOL
        </h2>
        
        <div style={{ color: 'var(--text)', fontSize: '0.95rem', lineHeight: '1.6' }}>
          <p style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>"Listen closely. We don't have much time. This city plays by a strict set of rules."</p>
          
          <h3 style={{ color: 'var(--border-glow)', marginTop: '1.5rem', fontSize: '1.1rem' }}>1. The Target (304 Points)</h3>
          <p>The deck is stripped. Only 32 cards remain. The objective? Points.<br/>
          <strong>Jack = 30</strong> | <strong>Nine = 20</strong> | <strong>Ace = 11</strong> | <strong>Ten = 10</strong> | <strong>Queen = 3</strong> | <strong>King = 2</strong>.<br/>
          (8s,7s and remanings are worthless decoys).</p>

          <h3 style={{ color: 'var(--border-glow)', marginTop: '1.5rem', fontSize: '1.1rem' }}>2. The Contract (Bidding)</h3>
          <p>Four players, two syndicates. Calculate your team's strength and place a bid (minimum 155). Win the bid, and you secretly dictate the <strong>Trump Suit</strong>. Choose wisely.</p>

          <h3 style={{ color: 'var(--border-glow)', marginTop: '1.5rem', fontSize: '1.1rem' }}>3. The Execution (Tricks)</h3>
          <p>When a suit is led, you <strong>must follow suit</strong>. No exceptions. If you are out of that suit, you can strike from the shadows with a Trump card or throw away garbage. Highest card of the lead suit wins, unless Trump is played.</p>

          <h3 style={{ color: 'var(--border-glow)', marginTop: '1.5rem', fontSize: '1.1rem' }}>4. The Consequence (Scoring)</h3>
          <p>If your team placed the bid, you better reach that number. Succeed, and your score drops. Fail, and you are penalized double. Hit 1000 points and you become the Donkey of Gotham.</p>
        </div>

        <button 
          className="btn" 
          style={{ width: '100%', marginTop: '2.5rem', background: 'transparent', border: '1px solid var(--primary)' }}
          onClick={onClose}
        >
          ACKNOWLEDGE
        </button>
      </div>
    </div>
  );
}
