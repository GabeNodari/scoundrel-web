const MAX_HEALTH = 20;

const SUIT_SYMBOLS = {
  club: '♣',
  spade: '♠',
  diamond: '♦',
  heart: '♥'
};

const FACE_LABELS = {
  11: 'J',
  12: 'Q',
  13: 'K',
  14: 'A'
};

function shuffle(items) {
  const clone = [...items];
  for (let index = clone.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [clone[index], clone[randomIndex]] = [clone[randomIndex], clone[index]];
  }
  return clone;
}

function getCardLabel(value) {
  return FACE_LABELS[value] ?? String(value);
}

function getCardType(card) {
  if (card.suit === 'heart') return 'potion';
  if (card.suit === 'diamond') return 'weapon';
  return 'monster';
}

function createDeck() {
  const deck = [];

  ['club', 'spade', 'heart', 'diamond'].forEach((suit) => {
    for (let value = 2; value <= 14; value += 1) {
      const isRed = suit === 'heart' || suit === 'diamond';
      const isRedFaceOrAce = isRed && value >= 11;

      if (isRedFaceOrAce) {
        continue;
      }

      deck.push({
        id: `${suit}-${value}-${Math.random().toString(16).slice(2, 10)}`,
        suit,
        value,
        label: getCardLabel(value),
        symbol: SUIT_SYMBOLS[suit],
        type: getCardType({ suit }),
        color: isRed ? 'red' : 'black'
      });
    }
  });

  return shuffle(deck);
}

function createInitialGameState() {
  return {
    health: MAX_HEALTH,
    maxHealth: MAX_HEALTH,
    deck: createDeck(),
    room: [],
    carry: null,
    weapon: null,
    weaponLastDefeatedValue: null,
    avoidedLastRoom: false,
    selectedCardIds: [],
    turn: 1,
    potionUsedThisRoom: false,
    logs: [
      { type: 'info', text: 'O baralho do dungeon foi embaralhado. Entre na primeira sala!' }
    ],
    ended: false,
    outcome: null,
    score: null,
    stats: {
      roomsCleared: 0,
      monstersDefeated: 0,
      potionsDrank: 0,
      damageTaken: 0,
      damagePrevented: 0
    }
  };
}

function addLog(state, entry) {
  const normalized = typeof entry === 'string' ? { type: 'info', text: entry } : entry;
  state.logs.unshift(normalized);
}

function canUseWeapon(state, monsterValue) {
  if (!state.weapon) return false;
  if (state.weaponLastDefeatedValue === null) return true;
  return monsterValue < state.weaponLastDefeatedValue;
}

function getRequiredCardCount(state) {
  if (state.room.length === 0) return 0;
  // If deck is empty and room has <= 3 cards, player must resolve all of them
  if (state.deck.length === 0 && state.room.length <= 3) {
    return state.room.length;
  }
  return Math.min(3, state.room.length);
}

function applyCardEffect(state, card) {
  if (card.type === 'potion') {
    if (!state.potionUsedThisRoom) {
      state.potionUsedThisRoom = true;
      const healed = Math.min(card.value, state.maxHealth - state.health);
      state.health += healed;
      state.stats.potionsDrank += 1;
      addLog(state, {
        type: 'heal',
        text: `Você bebeu a poção ${card.label}${card.symbol} (+${card.value} HP) e recuperou ${healed} HP (${state.health}/${state.maxHealth}).`
      });
    } else {
      addLog(state, {
        type: 'waste',
        text: `Limite de poções atingido nesta sala! ${card.label}${card.symbol} (+${card.value} HP) descartada sem efeito.`
      });
    }
    return;
  }

  if (card.type === 'weapon') {
    const previous = state.weapon ? `${state.weapon.label}${state.weapon.symbol} (Poder ${state.weapon.value})` : 'punhos';
    state.weapon = { ...card };
    state.weaponLastDefeatedValue = null; // Reset degradation for new weapon
    addLog(state, {
      type: 'equip',
      text: `Arma equipada: ${card.label}${card.symbol} (Poder ${card.value}). Arma anterior (${previous}) descartada.`
    });
    return;
  }

  if (card.type === 'monster') {
    const equipped = state.weapon;

    if (!equipped) {
      state.health -= card.value;
      state.stats.monstersDefeated += 1;
      state.stats.damageTaken += card.value;
      addLog(state, {
        type: 'combat-bare',
        text: `Combateu ${card.label}${card.symbol} (Pwr ${card.value}) de mãos nuas! Sofreu ${card.value} de dano.`
      });
      return;
    }

    if (!canUseWeapon(state, card.value)) {
      state.health -= card.value;
      state.stats.monstersDefeated += 1;
      state.stats.damageTaken += card.value;
      addLog(state, {
        type: 'combat-degraded',
        text: `Arma ${equipped.label}${equipped.symbol} desgastada (requer monstro < ${state.weaponLastDefeatedValue})! Combateu ${card.label}${card.symbol} (${card.value}) de mãos nuas por ${card.value} de dano.`
      });
      return;
    }

    const damageTaken = Math.max(0, card.value - equipped.value);
    const damageBlocked = Math.min(card.value, equipped.value);
    state.health -= damageTaken;
    state.weaponLastDefeatedValue = card.value;
    state.stats.monstersDefeated += 1;
    state.stats.damageTaken += damageTaken;
    state.stats.damagePrevented += damageBlocked;
    addLog(state, {
      type: 'combat-weapon',
      text: `Derrotou ${card.label}${card.symbol} (${card.value}) com ${equipped.label}${equipped.symbol} (${equipped.value})! Sofreu ${damageTaken} de dano (${damageBlocked} bloqueados). Desgaste da arma: agora requer monstro < ${card.value}.`
    });
  }
}

function drawRoom(state) {
  state.potionUsedThisRoom = false;
  const nextCards = [];

  if (state.carry) {
    nextCards.push(state.carry);
    state.carry = null;
  }

  while (nextCards.length < 4 && state.deck.length > 0) {
    nextCards.push(state.deck.shift());
  }

  state.room = nextCards;
  state.selectedCardIds = [];

  if (state.room.length === 0 && state.deck.length === 0) {
    state.ended = true;
    state.outcome = 'won';
    state.score = state.health;
    addLog(state, {
      type: 'victory',
      text: `VITÓRIA! Você explorou cada canto do dungeon! Pontuação final: ${state.score} HP.`
    });
    return;
  }

  addLog(state, {
    type: 'room',
    text: `Turno ${state.turn}: Sala revelada com ${state.room.length} carta${state.room.length !== 1 ? 's' : ''} (${state.deck.length} restantes no dungeon).`
  });
}

function avoidRoom(state) {
  if (state.ended) return;
  if (state.avoidedLastRoom) {
    addLog(state, {
      type: 'warning',
      text: 'Não é possível evitar duas salas consecutivas! Você deve enfrentar esta sala.'
    });
    return;
  }

  if (state.room.length === 0) return;

  state.avoidedLastRoom = true;
  // Place all current room cards at the bottom of the deck in order (NO shuffle per Scoundrel rules)
  state.room.forEach((card) => {
    state.deck.push(card);
  });
  state.room = [];
  state.selectedCardIds = [];
  state.turn += 1;
  addLog(state, {
    type: 'avoid',
    text: 'Você fugiu da sala! As 4 cartas foram movidas para o fundo do baralho do dungeon.'
  });
  drawRoom(state);
}

function resolveRoom(state, options = {}) {
  if (state.ended) return;

  const requiredCount = getRequiredCardCount(state);

  if (state.selectedCardIds.length === 0) {
    addLog(state, { type: 'warning', text: 'Selecione as cartas para resolver antes de confirmar.' });
    return;
  }

  const enforceExactCount = options.requireExactCount ?? true;
  if (enforceExactCount && state.selectedCardIds.length !== requiredCount) {
    addLog(state, {
      type: 'warning',
      text: `Você deve selecionar exatamente ${requiredCount} carta${requiredCount === 1 ? '' : 's'} para resolver esta sala.`
    });
    return;
  }

  // Resolve cards in the exact order selected by the player
  const chosen = state.selectedCardIds
    .map((id) => state.room.find((card) => card.id === id))
    .filter(Boolean);

  const remaining = state.room.filter((card) => !state.selectedCardIds.includes(card.id));

  for (const card of chosen) {
    applyCardEffect(state, card);

    if (state.health <= 0) {
      state.health = 0;
      state.ended = true;
      state.outcome = 'lost';
      const dungeonMonsters = state.deck
        .filter((c) => c.type === 'monster')
        .reduce((sum, c) => sum + c.value, 0);
      const roomMonsters = remaining
        .filter((c) => c.type === 'monster')
        .reduce((sum, c) => sum + c.value, 0);
      const totalRemainingMonsterPwr = dungeonMonsters + roomMonsters;
      state.score = -totalRemainingMonsterPwr;
      addLog(state, {
        type: 'defeat',
        text: `DERROTA! Sua vida chegou a 0. Pontuação final: ${state.score} (Poder dos monstros restantes: ${totalRemainingMonsterPwr}).`
      });
      return;
    }
  }

  state.stats.roomsCleared += 1;
  state.carry = remaining[0] ?? null;
  state.room = [];
  state.selectedCardIds = [];
  state.avoidedLastRoom = false;

  // Check victory: deck is empty and no carry-over card remains
  if (state.deck.length === 0 && !state.carry) {
    state.ended = true;
    state.outcome = 'won';
    state.score = state.health;
    addLog(state, {
      type: 'victory',
      text: `VITÓRIA! Você conquistou o dungeon! Pontuação final: ${state.score} HP restantes.`
    });
    return;
  }

  state.turn += 1;
  drawRoom(state);
}

export {
  createInitialGameState,
  drawRoom,
  avoidRoom,
  resolveRoom,
  canUseWeapon,
  getRequiredCardCount,
  MAX_HEALTH,
  createDeck
};
