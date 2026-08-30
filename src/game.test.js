import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createInitialGameState,
  drawRoom,
  resolveRoom,
  avoidRoom,
  canUseWeapon,
  getRequiredCardCount
} from './game.js';

test('creates a filtered deck with 44 valid cards', () => {
  const state = createInitialGameState();
  assert.equal(state.deck.length, 44);
  assert.ok(state.deck.every((card) => !['joker'].includes(card.suit)));
  assert.ok(state.deck.every((card) => !(card.suit === 'heart' && card.value >= 11)));
  assert.ok(state.deck.every((card) => !(card.suit === 'diamond' && card.value >= 11)));
  assert.equal(state.deck.filter((c) => c.suit === 'club' || c.suit === 'spade').length, 26);
  assert.equal(state.deck.filter((c) => c.suit === 'heart').length, 9);
  assert.equal(state.deck.filter((c) => c.suit === 'diamond').length, 9);
});

test('healing caps at max health', () => {
  const state = createInitialGameState();
  state.health = 15;
  state.maxHealth = 20;
  state.room = [{ id: 'potion', suit: 'heart', value: 10, type: 'potion', label: '10', symbol: '♥', color: 'red' }];
  state.selectedCardIds = ['potion'];
  state.deck = [];
  resolveRoom(state, { requireExactCount: false });
  assert.equal(state.health, 20);
  assert.equal(state.stats.potionsDrank, 1);
});

test('only the first potion in a room restores health', () => {
  const state = createInitialGameState();
  state.health = 5;
  state.maxHealth = 20;
  state.room = [
    { id: 'p1', suit: 'heart', value: 5, type: 'potion', label: '5', symbol: '♥', color: 'red' },
    { id: 'p2', suit: 'heart', value: 7, type: 'potion', label: '7', symbol: '♥', color: 'red' }
  ];
  state.selectedCardIds = ['p1', 'p2'];
  state.deck = [];
  resolveRoom(state, { requireExactCount: false });
  // First potion adds 5 (5 -> 10). Second potion is ignored for healing.
  assert.equal(state.health, 10);
  assert.equal(state.stats.potionsDrank, 1);
});

test('weapon damage is reduced and sets degradation threshold', () => {
  const state = createInitialGameState();
  state.health = 20;
  state.weapon = { id: 'w1', suit: 'diamond', value: 6, label: '6', symbol: '♦', type: 'weapon', color: 'red' };
  state.weaponLastDefeatedValue = null;
  state.room = [{ id: 'm1', suit: 'club', value: 10, type: 'monster', label: '10', symbol: '♣', color: 'black' }];
  state.selectedCardIds = ['m1'];
  state.deck = [];
  resolveRoom(state, { requireExactCount: false });
  assert.equal(state.health, 16); // 20 - (10 - 6) = 16
  assert.equal(state.weaponLastDefeatedValue, 10);
  assert.equal(state.stats.damagePrevented, 6);
  assert.equal(state.stats.damageTaken, 4);
});

test('weapon degradation blocks fighting stronger or equal monsters with weapon', () => {
  const state = createInitialGameState();
  state.health = 20;
  state.weapon = { id: 'w1', suit: 'diamond', value: 8, label: '8', symbol: '♦', type: 'weapon', color: 'red' };
  state.weaponLastDefeatedValue = 7; // Previously defeated a 7

  // Cannot fight a 7 or higher with this weapon
  assert.equal(canUseWeapon(state, 7), false);
  assert.equal(canUseWeapon(state, 8), false);
  // Can fight a 6 or lower
  assert.equal(canUseWeapon(state, 6), true);

  // Attempting to fight a 9 should take full barehanded damage
  state.room = [{ id: 'm9', suit: 'spade', value: 9, type: 'monster', label: '9', symbol: '♠', color: 'black' }];
  state.selectedCardIds = ['m9'];
  state.deck = [];
  resolveRoom(state, { requireExactCount: false });
  assert.equal(state.health, 11); // 20 - 9 = 11 barehanded
});

test('equipping a new weapon resets degradation', () => {
  const state = createInitialGameState();
  state.health = 20;
  state.weapon = { id: 'w1', suit: 'diamond', value: 4, label: '4', symbol: '♦', type: 'weapon', color: 'red' };
  state.weaponLastDefeatedValue = 5;

  state.room = [{ id: 'w2', suit: 'diamond', value: 9, label: '9', symbol: '♦', type: 'weapon', color: 'red' }];
  state.selectedCardIds = ['w2'];
  state.deck = [];
  resolveRoom(state, { requireExactCount: false });

  assert.equal(state.weapon.value, 9);
  assert.equal(state.weaponLastDefeatedValue, null);
  assert.equal(canUseWeapon(state, 14), true); // Can fight any monster now
});

test('resolves cards in player-selected order', () => {
  const state = createInitialGameState();
  state.health = 5;
  // Room has Monster first, then Potion in room array
  state.room = [
    { id: 'm1', suit: 'club', value: 6, type: 'monster', label: '6', symbol: '♣', color: 'black' },
    { id: 'p1', suit: 'heart', value: 8, type: 'potion', label: '8', symbol: '♥', color: 'red' }
  ];
  // Player selects Potion FIRST, then Monster SECOND
  state.selectedCardIds = ['p1', 'm1'];
  state.deck = [];
  resolveRoom(state, { requireExactCount: false });

  // If resolved in selection order: HP becomes 5 + 8 = 13, then - 6 = 7 (Survives!)
  // If resolved in room order: 5 - 6 = -1 (Defeat!)
  assert.equal(state.health, 7);
  assert.equal(state.ended, true); // Ended because deck empty
  assert.equal(state.outcome, 'won');
});

test('drawRoom consumes the carry card into the current room while keeping a visible carry state', () => {
  const state = createInitialGameState();
  const carry = { id: 'carry-1', suit: 'heart', value: 6, type: 'potion', label: '6', symbol: '♥', color: 'red' };
  state.carry = carry;
  state.deck = [
    { id: 'd1', suit: 'club', value: 8, type: 'monster', label: '8', symbol: '♣', color: 'black' },
    { id: 'd2', suit: 'club', value: 9, type: 'monster', label: '9', symbol: '♣', color: 'black' }
  ];

  drawRoom(state);

  assert.equal(state.room[0].id, 'carry-1');
  assert.equal(state.carry, null);
  assert.equal(state.carryDisplay.id, 'carry-1');
  assert.equal(state.room.length, 3);
});

test('avoiding a room places cards at bottom of deck without shuffling and blocks consecutive avoid', () => {
  const state = createInitialGameState();
  const c1 = { id: 'c1', suit: 'club', value: 2, type: 'monster', label: '2', symbol: '♣', color: 'black' };
  const c2 = { id: 'c2', suit: 'club', value: 3, type: 'monster', label: '3', symbol: '♣', color: 'black' };
  const c3 = { id: 'c3', suit: 'heart', value: 4, type: 'potion', label: '4', symbol: '♥', color: 'red' };
  const c4 = { id: 'c4', suit: 'diamond', value: 5, type: 'weapon', label: '5', symbol: '♦', color: 'red' };
  state.room = [c1, c2, c3, c4];
  state.deck = [
    { id: 'd1', suit: 'spade', value: 6, type: 'monster', label: '6', symbol: '♠', color: 'black' },
    { id: 'd2', suit: 'spade', value: 7, type: 'monster', label: '7', symbol: '♠', color: 'black' },
    { id: 'd3', suit: 'spade', value: 8, type: 'monster', label: '8', symbol: '♠', color: 'black' },
    { id: 'd4', suit: 'spade', value: 9, type: 'monster', label: '9', symbol: '♠', color: 'black' }
  ];

  avoidRoom(state);

  assert.equal(state.avoidedLastRoom, true);
  // New room drew d1, d2, d3, d4
  assert.equal(state.room.length, 4);
  assert.equal(state.room[0].id, 'd1');
  // The avoided cards c1..c4 are at the bottom of the deck
  assert.equal(state.deck.length, 4);
  assert.equal(state.deck[0].id, 'c1');
  assert.equal(state.deck[3].id, 'c4');

  // Attempting to avoid again must be blocked
  avoidRoom(state);
  assert.equal(state.avoidedLastRoom, true);
  assert.equal(state.room[0].id, 'd1'); // Room remained unchanged
});

test('handles endgame victory and final score calculation', () => {
  const state = createInitialGameState();
  state.health = 18;
  state.deck = [];
  state.room = [
    { id: 'm1', suit: 'club', value: 3, type: 'monster', label: '3', symbol: '♣', color: 'black' },
    { id: 'p1', suit: 'heart', value: 5, type: 'potion', label: '5', symbol: '♥', color: 'red' }
  ];
  state.selectedCardIds = ['m1', 'p1'];

  assert.equal(getRequiredCardCount(state), 2);
  resolveRoom(state);

  assert.equal(state.ended, true);
  assert.equal(state.outcome, 'won');
  assert.equal(state.score, 20); // 18 - 3 + 5 = 20 HP
});

test('handles defeat and negative score for remaining monsters', () => {
  const state = createInitialGameState();
  state.health = 4;
  state.deck = [
    { id: 'm_deck1', suit: 'spade', value: 14, type: 'monster', label: 'A', symbol: '♠', color: 'black' },
    { id: 'p_deck', suit: 'heart', value: 6, type: 'potion', label: '6', symbol: '♥', color: 'red' }
  ];
  state.room = [
    { id: 'm1', suit: 'club', value: 10, type: 'monster', label: '10', symbol: '♣', color: 'black' },
    { id: 'm2', suit: 'club', value: 8, type: 'monster', label: '8', symbol: '♣', color: 'black' },
    { id: 'p1', suit: 'heart', value: 2, type: 'potion', label: '2', symbol: '♥', color: 'red' },
    { id: 'w1', suit: 'diamond', value: 3, type: 'weapon', label: '3', symbol: '♦', color: 'red' }
  ];
  // Fight m1 barehanded: 4 - 10 = -6 -> Dies immediately
  state.selectedCardIds = ['m1', 'p1', 'w1'];
  resolveRoom(state);

  assert.equal(state.health, 0);
  assert.equal(state.ended, true);
  assert.equal(state.outcome, 'lost');
  // Remaining monsters: m_deck1 (14) + room remaining m2 (8) = 22 -> Score = -22
  assert.equal(state.score, -22);
});
