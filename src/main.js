import {
  createInitialGameState,
  drawRoom,
  avoidRoom,
  resolveRoom,
  getRequiredCardCount,
  canUseWeapon,
  MAX_HEALTH
} from './game.js';

// Estado global do jogo
const state = createInitialGameState();
drawRoom(state);

// Elementos do DOM
const els = {
  shakeLayer: document.querySelector('#screen-shake-layer'),
  healthValue: document.querySelector('#health-value'),
  d20Indicator: document.querySelector('#d20-indicator'),
  d20Number: document.querySelector('#d20-number'),
  hpBarFill: document.querySelector('#hp-bar-fill'),

  weaponBadge: document.querySelector('#weapon-badge'),
  weaponName: document.querySelector('#weapon-name'),
  weaponDurability: document.querySelector('#weapon-durability'),

  deckCount: document.querySelector('#deck-count'),
  turnCount: document.querySelector('#turn-count'),
  carryValue: document.querySelector('#carry-value'),

  roomTurnTitle: document.querySelector('#room-turn-title'),
  selectionCounter: document.querySelector('#selection-counter'),
  selectionHelpText: document.querySelector('#selection-help-text'),
  roomCards: document.querySelector('#room-cards'),
  avoidRoomBtn: document.querySelector('#avoid-room-btn'),
  resolveBtn: document.querySelector('#resolve-btn'),

  logCount: document.querySelector('#log-count'),
  logList: document.querySelector('#log-list'),

  newGameBtn: document.querySelector('#new-game-btn'),
  rulesBtn: document.querySelector('#rules-btn'),
  rulesModal: document.querySelector('#rules-modal'),
  closeRulesBtn: document.querySelector('#close-rules-btn'),
  understandRulesBtn: document.querySelector('#understand-rules-btn'),

  endgameModal: document.querySelector('#endgame-modal'),
  endgameBanner: document.querySelector('#endgame-banner'),
  endgameTitle: document.querySelector('#endgame-title'),
  endgameSubtitle: document.querySelector('#endgame-subtitle'),
  endgameScore: document.querySelector('#endgame-score'),
  endgameHp: document.querySelector('#endgame-hp'),
  endgameMonsters: document.querySelector('#endgame-monsters'),
  endgameBlocked: document.querySelector('#endgame-blocked'),
  endgamePotions: document.querySelector('#endgame-potions'),
  endgameRooms: document.querySelector('#endgame-rooms'),
  restartGameBtn: document.querySelector('#restart-game-btn')
};

// ==========================================================================
// GERADORES DE ILUSTRAÇÕES BASEADAS NAS REFERÊNCIAS VISUAIS
// ==========================================================================

// Monstro: Escudo (Font Awesome)
function getMonsterSVG() {
  return `
    <svg viewBox="0 0 640 640" fill="currentColor" class="card-outline-svg" aria-hidden="true">
      <path d="M320 64C324.6 64 329.2 65 333.4 66.9L521.8 146.8C543.8 156.1 560.2 177.8 560.1 204C559.6 303.2 518.8 484.7 346.5 567.2C329.8 575.2 310.4 575.2 293.7 567.2C121.3 484.7 80.6 303.2 80.1 204C80 177.8 96.4 156.1 118.4 146.8L306.7 66.9C310.9 65 315.4 64 320 64zM320 130.8L320 508.9C458 442.1 495.1 294.1 496 205.5L320 130.9L320 130.9z"/>
    </svg>
  `;
}

// Arma: Espada (Font Awesome)
function getWeaponSVG() {
  return `
    <svg viewBox="0 0 640 640" fill="currentColor" class="card-outline-svg" aria-hidden="true">
      <path d="M352 188.5L300.1 175.5C293.6 173.9 288.8 168.4 288.1 161.7C287.4 155 290.9 148.6 296.8 145.6L337.6 125.2L294.3 92.7C288.8 88.6 286.5 81.4 288.7 74.8C290.9 68.2 297.1 64 304 64L464 64C494.2 64 522.7 78.2 540.8 102.4L598.4 179.2C604.6 187.5 608 197.6 608 208C608 234.5 586.5 256 560 256L538.5 256C521.5 256 505.2 249.3 493.2 237.3L479.9 224L447.9 224L447.9 245.5C447.9 270.3 460.7 293.4 481.7 306.6L588.3 373.2C620.4 393.3 639.9 428.4 639.9 466.3C639.9 526.9 590.8 576.1 530.1 576.1L32.3 576C29 576 25.7 575.6 22.7 574.6C13.5 571.8 6 565 2.3 556C1 552.7 .1 549.1 0 545.3C-.2 541.6 .3 538 1.3 534.6C4.1 525.4 10.9 517.9 19.9 514.2C22.9 513 26.1 512.2 29.4 512L433.3 476C441.6 475.3 448 468.3 448 459.9C448 455.6 446.3 451.5 443.3 448.5L398.9 404.1C368.9 374.1 352 333.4 352 291L352 188.5zM512 136.3C512 136.2 512 136.1 512 136C512 135.9 512 135.8 512 135.7L512 136.3zM510.7 143.7L464.3 132.1C464.1 133.4 464 134.7 464 136C464 149.3 474.7 160 488 160C498.6 160 507.5 153.2 510.7 143.7zM130.9 180.5C147.2 166 171.3 164.3 189.4 176.4L320 263.4L320 290.9C320 323.7 328.4 355.7 344 383.9L112 383.9C105.3 383.9 99.3 379.7 97 373.5C94.7 367.3 96.5 360.2 101.6 355.8L171 296.3L18.4 319.8C11.4 320.9 4.5 317.2 1.5 310.8C-1.5 304.4 .1 296.8 5.4 292L130.9 180.5z"/>
    </svg>
  `;
}

// Poção: Frasco (Font Awesome)
function getPotionSVG() {
  return `
    <svg viewBox="0 0 640 640" fill="currentColor" class="card-outline-svg" aria-hidden="true">
      <path d="M384 64L224 64C206.3 64 192 78.3 192 96C192 113.7 206.3 128 224 128L224 279.5L103.5 490.3C98.6 499 96 508.7 96 518.7C96 550.4 121.6 576 153.3 576L486.7 576C518.3 576 544 550.4 544 518.7C544 508.7 541.4 498.9 536.5 490.3L416 279.5L416 128C433.7 128 448 113.7 448 96C448 78.3 433.7 64 416 64L384 64zM288 279.5L288 128L352 128L352 279.5C352 290.6 354.9 301.6 360.4 311.3L402 384L238 384L279.6 311.3C285.1 301.6 288 290.7 288 279.5z"/>
    </svg>
  `;
}

function renderCardArt(card) {
  if (card.type === 'monster') {
    return getWeaponSVG();
  }
  if (card.type === 'potion') {
    return getPotionSVG();
  }
  return getMonsterSVG();
}

// ==========================================================================
// RENDERIZAÇÃO & ATUALIZAÇÃO DA UI
// ==========================================================================

function triggerDamageShake() {
  els.shakeLayer.classList.remove('shake-effect');
  void els.shakeLayer.offsetWidth; // Força reflow
  els.shakeLayer.classList.add('shake-effect');
}

function updateD20State() {
  const hp = state.health;
  const ratio = Math.max(0, hp / MAX_HEALTH);

  els.healthValue.textContent = `${hp} / ${MAX_HEALTH}`;
  els.d20Number.textContent = String(hp);
  els.hpBarFill.style.width = `${ratio * 100}%`;

  els.d20Indicator.classList.remove('state-healthy', 'state-wounded', 'state-critical', 'state-dead');

  if (hp >= 16) {
    els.d20Indicator.classList.add('state-healthy');
    els.healthValue.className = 'status-badge health-badge';
  } else if (hp >= 8) {
    els.d20Indicator.classList.add('state-wounded');
    els.healthValue.className = 'status-badge weapon-badge';
  } else if (hp > 0) {
    els.d20Indicator.classList.add('state-critical');
    els.healthValue.className = 'status-badge critical-badge';
  } else {
    els.d20Indicator.classList.add('state-dead');
    els.healthValue.textContent = '0 / 20 (Derrota)';
    els.healthValue.className = 'status-badge dead-badge';
  }
}

function updateWeaponState() {
  if (state.weapon) {
    els.weaponBadge.textContent = `Poder ${state.weapon.value}`;
    els.weaponName.textContent = `Arma: ${state.weapon.label} ${state.weapon.symbol}`;

    if (state.weaponLastDefeatedValue !== null) {
      els.weaponDurability.textContent = `Desgaste: apenas monstros < ${state.weaponLastDefeatedValue}`;
      els.weaponDurability.style.color = 'var(--amber)';
    } else {
      els.weaponDurability.textContent = 'Íntegra (qualquer monstro)';
      els.weaponDurability.style.color = 'var(--emerald-accent)';
    }
  } else {
    els.weaponBadge.textContent = 'Desarmado';
    els.weaponName.textContent = 'Nenhuma (Punhos)';
    els.weaponDurability.textContent = 'Sem absorção de dano';
    els.weaponDurability.style.color = 'var(--text-muted)';
  }
}

function renderCard(card) {
  const cardEl = document.createElement('button');
  const selectedIndex = state.selectedCardIds.indexOf(card.id);
  const isSelected = selectedIndex !== -1;

  cardEl.type = 'button';
  cardEl.className = `game-card ${card.type} ${card.color} ${isSelected ? 'selected' : ''}`;
  cardEl.dataset.cardId = card.id;
  cardEl.setAttribute('aria-label', `${card.label} de ${card.suit}, ${card.type}`);

  // Badge numerada de ordem de resolução sequencial [1], [2], [3]
  const badgeHTML = isSelected
    ? `<div class="card-order-badge" aria-label="Ordem ${selectedIndex + 1}">${selectedIndex + 1}</div>`
    : '';

  cardEl.innerHTML = `
    ${badgeHTML}
    <div class="card-header-bar">
      <span class="card-label-val">${card.label} ${card.symbol}</span>
      <span class="card-category-badge">${card.type}</span>
    </div>
    <div class="card-artwork-frame">
      ${renderCardArt(card)}
    </div>
    <div class="card-footer-bar">
      <span class="card-footer-suit">${card.symbol}</span>
      <span class="card-footer-val">${card.value}</span>
    </div>
  `;

  cardEl.addEventListener('click', () => {
    if (state.ended) return;

    const requiredCount = getRequiredCardCount(state);

    if (!state.selectedCardIds.includes(card.id)) {
      if (state.selectedCardIds.length >= requiredCount) {
        return;
      }
      state.selectedCardIds.push(card.id);
    } else {
      state.selectedCardIds = state.selectedCardIds.filter((id) => id !== card.id);
    }

    render();
  });

  return cardEl;
}

function renderLogs() {
  els.logCount.textContent = `${state.logs.length} ações`;
  els.logList.innerHTML = '';

  state.logs.slice(0, 25).forEach((entry) => {
    const item = document.createElement('li');
    item.className = `log-item log-type-${entry.type || 'info'}`;
    item.textContent = entry.text;
    els.logList.appendChild(item);
  });
}

function checkEndgameModal() {
  if (state.ended) {
    els.endgameModal.hidden = false;

    if (state.outcome === 'won') {
      els.endgameBanner.className = 'endgame-status-header state-victory';
      els.endgameTitle.textContent = 'VITÓRIA NO DUNGEON';
      els.endgameSubtitle.textContent = 'Você derrotou os perigos e conquistou o calabouço.';
      els.endgameScore.textContent = `+${state.score} HP`;
      els.endgameScore.style.color = 'var(--gold-accent)';
    } else {
      els.endgameBanner.className = 'endgame-status-header state-defeat';
      els.endgameTitle.textContent = 'DERROTA NO DUNGEON';
      els.endgameSubtitle.textContent = 'Seus pontos de vida chegaram a zero.';
      els.endgameScore.textContent = `${state.score} pts`;
      els.endgameScore.style.color = 'var(--crimson-accent)';
      triggerDamageShake();
    }

    els.endgameHp.textContent = `${state.health} / ${MAX_HEALTH}`;
    els.endgameMonsters.textContent = String(state.stats.monstersDefeated);
    els.endgameBlocked.textContent = `${state.stats.damagePrevented} dano`;
    els.endgamePotions.textContent = String(state.stats.potionsDrank);
    els.endgameRooms.textContent = String(state.stats.roomsCleared);
  } else {
    els.endgameModal.hidden = true;
  }
}

function render() {
  updateD20State();
  updateWeaponState();

  els.deckCount.textContent = String(state.deck.length);
  els.turnCount.textContent = `Turno ${state.turn}`;
  els.carryValue.textContent = state.carry ? `${state.carry.label} ${state.carry.symbol}` : 'Nenhuma';

  const requiredCount = getRequiredCardCount(state);
  const isFinalRoom = state.deck.length === 0 && state.room.length <= 3;

  if (isFinalRoom) {
    els.roomTurnTitle.textContent = `Sala Final — Resolva as ${requiredCount} cartas restantes`;
    els.selectionHelpText.textContent = `Esta é a sala final do dungeon! Selecione todas as ${requiredCount} cartas restantes para finalizar.`;
  } else {
    els.roomTurnTitle.textContent = `Sala ${state.turn} — Escolha 3 cartas`;
    els.selectionHelpText.textContent = 'Selecione 3 cartas na sequência tática desejada. A 4ª carta permanecerá para a próxima sala.';
  }

  els.selectionCounter.textContent = `${state.selectedCardIds.length}/${requiredCount}`;

  els.avoidRoomBtn.disabled = state.ended || state.avoidedLastRoom || state.room.length === 0;
  els.resolveBtn.disabled = state.ended || state.selectedCardIds.length !== requiredCount;

  // Grade de Cartas
  els.roomCards.innerHTML = '';
  if (state.room.length === 0) {
    const emptyMsg = document.createElement('div');
    emptyMsg.className = 'empty-dungeon-message';
    emptyMsg.textContent = 'O calabouço foi totalmente explorado e superado.';
    els.roomCards.appendChild(emptyMsg);
  } else {
    state.room.forEach((card) => {
      els.roomCards.appendChild(renderCard(card));
    });
  }

  renderLogs();
  checkEndgameModal();
}

// ==========================================================================
// TRATAMENTO DE EVENTOS
// ==========================================================================

function startNewGame() {
  const fresh = createInitialGameState();
  Object.assign(state, fresh);
  drawRoom(state);
  els.endgameModal.hidden = true;
  render();
}

els.newGameBtn.addEventListener('click', startNewGame);
els.restartGameBtn.addEventListener('click', startNewGame);

els.avoidRoomBtn.addEventListener('click', () => {
  avoidRoom(state);
  render();
});

els.resolveBtn.addEventListener('click', () => {
  const prevHealth = state.health;
  resolveRoom(state, { requireExactCount: true });

  if (state.health < prevHealth) {
    triggerDamageShake();
  }

  render();
});

// Modal de Regras
els.rulesBtn.addEventListener('click', () => {
  els.rulesModal.hidden = false;
});

els.closeRulesBtn.addEventListener('click', () => {
  els.rulesModal.hidden = true;
});

els.understandRulesBtn.addEventListener('click', () => {
  els.rulesModal.hidden = true;
});

els.rulesModal.addEventListener('click', (e) => {
  if (e.target === els.rulesModal) {
    els.rulesModal.hidden = true;
  }
});

// Render inicial
render();
