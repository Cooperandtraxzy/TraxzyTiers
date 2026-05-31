const SUPABASE_URL = window.SUPABASE_URL;
const SUPABASE_KEY = window.SUPABASE_KEY;

const DEFAULT_MODES = ['Overall', 'Vanilla', 'UHC', 'Pot', 'NethOP', 'SMP', 'Sword', 'Axe', 'Mace', 'Diamond SMP', 'Spear Mace', 'Minecart', 'Speed', 'Creeper'];
const MODE_ORDER = ['Overall', 'Vanilla', 'UHC', 'Pot', 'NethOP', 'SMP', 'Sword', 'Axe', 'Mace', 'Diamond SMP', 'Spear Mace', 'Minecart', 'Speed', 'Creeper'];
const BOARD_TIERS = ['Tier 1', 'Tier 2', 'Tier 3', 'Tier 4', 'Tier 5'];
const TIER_PRIORITY = ['Unranked', 'LT5', 'HT5', 'LT4', 'HT4', 'LT3', 'HT3', 'LT2', 'HT2', 'LT1', 'HT1'];
const TIER_POINTS = {
  HT1: 60, LT1: 45,
  HT2: 30, LT2: 20,
  HT3: 10, LT3: 6,
  HT4: 4, LT4: 3,
  HT5: 2, LT5: 1
};

const RANK_CATEGORIES = [
  { min: 400, label: 'Combat Grandmaster', icon: 'fas fa-crown' },
  { min: 250, label: 'Combat Master', icon: 'fas fa-shield-alt' },
  { min: 100, label: 'Combat Ace', icon: 'fas fa-star' },
  { min: 50, label: 'Combat Specialist', icon: 'fas fa-bolt' },
  { min: 20, label: 'Combat Cadet', icon: 'fas fa-user-graduate' },
  { min: 10, label: 'Combat Novice', icon: 'fas fa-user' },
  { min: 0, label: 'Rookie', icon: 'fas fa-seedling' }
];

const tierBoard = document.getElementById('tierBoard');
const modeTabs = document.getElementById('modeTabs');
const searchInput = document.getElementById('searchInput');

function getTierScore(tierName) {
  const index = TIER_PRIORITY.indexOf(String(tierName || '').trim().toUpperCase());
  return index >= 0 ? index : 0;
}

function getBestTier(tiers) {
  if (!Array.isArray(tiers) || !tiers.length) {
    return { tier: 'Unranked', gamemode: 'N/A' };
  }

  return tiers.reduce((best, next) => {
    if (!next || typeof next !== 'object') return best;
    return getTierScore(next.tier) > getTierScore(best.tier) ? next : best;
  }, { tier: 'Unranked', gamemode: 'N/A' });
}

function getTierArrowIcon(tier) {
  if (/^HT/i.test(tier)) return '<i class="fas fa-angle-double-up"></i>';
  if (/^LT/i.test(tier)) return '<i class="fas fa-angle-up"></i>';
  return '<i class="fas fa-circle"></i>';
}

function getPointsForTier(tier) {
  if (typeof tier !== 'string') return 0;
  const normalized = String(tier || '').replace(/\s+/g, '').toUpperCase();
  return TIER_POINTS[normalized] || 0;
}

function getTotalPoints(tiers) {
  if (!Array.isArray(tiers) || !tiers.length) return 0;
  return tiers.reduce((sum, tier) => sum + getPointsForTier(tier?.tier), 0);
}

function getRankCategory(points) {
  return RANK_CATEGORIES.find(category => points >= category.min) || RANK_CATEGORIES[RANK_CATEGORIES.length - 1];
}

function truncateUsername(name, maxLength = 6) {
  if (!name) return 'Unknown';
  return name.length > maxLength ? `${name.slice(0, maxLength)}...` : name;
}

function normalizeTierGroup(tier) {
  if (typeof tier !== 'string') return 'Tier 5';
  const numericMatch = tier.match(/^(?:HT|LT)?\s*([1-5])$/i);
  if (numericMatch) return `Tier ${numericMatch[1]}`;
  const otherMatch = tier.match(/Tier\s*([1-5])/i);
  if (otherMatch) return `Tier ${otherMatch[1]}`;
  return 'Tier 5';
}

function getAvailableModes(players) {
  const modes = new Set();
  players.forEach(player => {
    const tiers = Array.isArray(player.tiers) ? player.tiers : [];
    tiers.forEach(item => {
      const mode = item?.gamemode || item?.mode;
      if (mode) modes.add(mode);
    });
  });
  return Array.from(modes);
}

const MODE_IMAGE_URLS = {
  Overall: 'images/trophy.png',
  Vanilla: 'images/end_crystal.png',
  UHC: 'images/lava_bucket.png',
  Pot: 'images/health_splash_potion.png',
  NethOP: 'images/netherite_helmet.png',
  SMP: 'images/ender_pearl.png',
  Sword: 'images/diamond_sword.png',
  Axe: 'images/diamond_axe.png',
  Mace: 'images/mace.png',
  'Diamond SMP': 'images/chorus_fruit.png',
  'Spear Mace': 'images/netherite_spear.png',
  Minecart: 'images/tnt_minecart.png',
  Speed: 'images/speed_splash_potion.png',
  Creeper: 'images/gunpowder.png'
};

function getModeIconUrl(name) {
  return MODE_IMAGE_URLS[name] || null;
}

function getModeIcon(name) {
  const iconUrl = getModeIconUrl(name);
  if (iconUrl) {
    return `<img src="${iconUrl}" alt="${name}" class="mode-icon-img">`;
  }
  return '<i class="fas fa-dot-circle"></i>';
}

function renderModeTab(name, active = false) {
  return `
    <button class="mode-tab ${active ? 'active' : ''}" data-mode="${name}">
      <span class="mode-icon">${getModeIcon(name)}</span>
      <span class="mode-name">${name}</span>
    </button>
  `;
}

function renderPlayerRow(player, selectedMode) {
  const ign = player.ign || player.name || player.uuid || 'Unknown';
  const displayName = truncateUsername(ign);
  const region = (player.region || 'N/A').toUpperCase();
  const tiers = Array.isArray(player.tiers) ? player.tiers : [];

  const tierItem = selectedMode === 'Overall'
    ? getBestTier(tiers)
    : tiers.find(item => String(item?.gamemode || item?.mode || '').toLowerCase() === selectedMode.toLowerCase()) || { tier: 'Unranked', gamemode: selectedMode };

  const arrowHtml = getTierArrowIcon(tierItem.tier);
  const tierLabel = !tierItem.tier || tierItem.tier === 'Unranked' ? 'N/A' : tierItem.tier;

  return `
    <article class="tier-player" data-ign="${ign.toLowerCase()}">
      <div class="player-entry">
        <img src="https://minotar.net/avatar/${ign}/36" alt="${ign}" class="player-avatar">
        <div class="player-info">
          <div class="player-name">${displayName}</div>
          <div class="player-region">${region}</div>
        </div>
      </div>
      <span class="tier-pill" title="${tierLabel}">
        <span class="tier-arrow">${arrowHtml}</span>
      </span>
    </article>
  `;
}

function renderTierBoard(players, selectedMode) {
  if (!tierBoard) return;
  const activeMode = selectedMode || 'Overall';
  tierBoard.classList.toggle('overall-active', activeMode === 'Overall');
  const query = searchInput?.value.trim().toLowerCase() || '';

  let filtered = players;
  if (query) {
    filtered = filtered.filter(player => (player.ign || player.name || player.uuid || '').toLowerCase().includes(query));
  }

  if (activeMode !== 'Overall') {
    filtered = filtered.filter(player => {
      const tiers = Array.isArray(player.tiers) ? player.tiers : [];
      return tiers.some(item => String(item?.gamemode || item?.mode || '').toLowerCase() === activeMode.toLowerCase());
    });
  }

  if (!filtered.length) {
    tierBoard.innerHTML = `<div class="tier-empty">No players found for ${activeMode}.</div>`;
    return;
  }

  if (activeMode === 'Overall') {
    filtered.sort((a, b) => {
      const pointsA = getTotalPoints(Array.isArray(a.tiers) ? a.tiers : []);
      const pointsB = getTotalPoints(Array.isArray(b.tiers) ? b.tiers : []);
      if (pointsB !== pointsA) return pointsB - pointsA;

      const tierScoreA = getTierScore(getBestTier(Array.isArray(a.tiers) ? a.tiers : []).tier);
      const tierScoreB = getTierScore(getBestTier(Array.isArray(b.tiers) ? b.tiers : []).tier);
      if (tierScoreB !== tierScoreA) return tierScoreB - tierScoreA;

      const nameA = (a.ign || a.name || a.uuid || '').toLowerCase();
      const nameB = (b.ign || b.name || b.uuid || '').toLowerCase();
      return nameA.localeCompare(nameB);
    });

    tierBoard.innerHTML = `
      <div class="overall-ranking">
        ${filtered.map((player, index) => {
          const ign = player.ign || player.name || player.uuid || 'Unknown';
          const tiers = Array.isArray(player.tiers) ? player.tiers : [];
          const totalPoints = getTotalPoints(tiers);
          const category = getRankCategory(totalPoints);

          const sortedTiers = [...tiers]
            .filter(tier => tier && typeof tier === 'object' && tier.tier && tier.tier !== 'Unranked')
            .sort((a, b) => getTierScore(b.tier) - getTierScore(a.tier))
            .slice(0, 8);

          const tiersHtml = sortedTiers.map(tier => {
            const tierValue = tier.tier || 'N/A';
            const gamemode = tier.gamemode || tier.mode || 'Unknown';
            const iconUrl = getModeIconUrl(gamemode);
            const iconContent = iconUrl
              ? `<img src="${iconUrl}" alt="${gamemode}" class="tier-icon-img">`
              : getTierArrowIcon(tierValue);

            return `
              <span class="tier-icon" data-tooltip="${tierValue}">${iconContent}</span>
            `;
          }).join('');

          const region = (player.region || 'N/A').toUpperCase();

          return `
            <article class="ranking-row" data-ign="${ign.toLowerCase()}">
              <div class="ranking-number">${index + 1}.</div>
              <div class="ranking-player">
                <img src="https://minotar.net/avatar/${ign}/48" alt="${ign}" class="player-avatar-lg">
                <div>
                  <strong>${ign}</strong>
                  <div class="player-category">
                    <i class="${category.icon}"></i>
                    ${category.label}
                  </div>
                </div>
              </div>
              <div class="ranking-tiers">${tiersHtml}</div>
              <div class="ranking-region">${region}</div>
            </article>
          `;
        }).join('')}
      </div>
    `;
    return;
  }

  const grouped = BOARD_TIERS.reduce((acc, tier) => ({ ...acc, [tier]: [] }), {});
  filtered.forEach(player => {
    const tierItem = (Array.isArray(player.tiers) ? player.tiers : []).find(item => String(item?.gamemode || item?.mode || '').toLowerCase() === activeMode.toLowerCase());
    const group = normalizeTierGroup(tierItem?.tier);
    grouped[group]?.push(player);
  });

  const sortTierPlayers = playersList => playersList.slice().sort((a, b) => {
    const aTier = (Array.isArray(a.tiers) ? a.tiers : []).find(item => String(item?.gamemode || item?.mode || '').toLowerCase() === activeMode.toLowerCase())?.tier || 'Unranked';
    const bTier = (Array.isArray(b.tiers) ? b.tiers : []).find(item => String(item?.gamemode || item?.mode || '').toLowerCase() === activeMode.toLowerCase())?.tier || 'Unranked';
    const scoreA = getTierScore(aTier);
    const scoreB = getTierScore(bTier);
    if (scoreB !== scoreA) return scoreB - scoreA;
    const pointsA = getPointsForTier(aTier);
    const pointsB = getPointsForTier(bTier);
    if (pointsB !== pointsA) return pointsB - pointsA;
    return (a.ign || a.name || a.uuid || '').localeCompare(b.ign || b.name || b.uuid || '');
  });

  tierBoard.innerHTML = BOARD_TIERS.map(tierName => {
    const playersInTier = sortTierPlayers(grouped[tierName]);
    const content = playersInTier.length
      ? playersInTier.map(player => renderPlayerRow(player, activeMode)).join('')
      : '<div class="no-players">No players in this tier</div>';

    return `
      <div class="tier-column">
        <div class="tier-column-header">${tierName}</div>
        <div class="tier-column-body">${content}</div>
      </div>
    `;
  }).join('');
}

/* Modal functionality */
function buildModalHtml(player) {
  const ign = player.ign || player.name || player.uuid || 'Unknown';
  const tiers = Array.isArray(player.tiers) ? player.tiers : [];
  const totalPoints = getTotalPoints(tiers);
  const position = (latestPlayers || []).findIndex(p => (p.ign || p.name || p.uuid || '').toLowerCase() === ign.toLowerCase()) + 1 || '-';
  const category = getRankCategory(totalPoints);

  const tiersHtml = tiers
    .filter(t => t && t.tier && t.tier !== 'Unranked')
    .sort((a,b) => getTierScore(b.tier) - getTierScore(a.tier))
    .map(t => {
      const gamemode = t.gamemode || t.mode || 'Unknown';
      const iconUrl = getModeIconUrl(gamemode);
      const label = t.tier || 'N/A';
      const icon = iconUrl ? `<img src="${iconUrl}" alt="${gamemode}" class="tier-icon-img">` : getTierArrowIcon(label);
      return `<span class="modal-tier-pill" title="${label}">${icon}<span style=\"margin-left:6px;font-size:0.86rem;color:#ffd8ff;\">${label}</span></span>`;
    }).join('');

  return `
    <div class="player-modal-overlay">
      <div class="player-modal">
        <button class="modal-close" aria-label="Close">✕</button>
        <div class="modal-header">
          <div class="modal-avatar"><img src="https://minotar.net/avatar/${ign}/100" alt="${ign}"></div>
          <div style="flex:1;display:flex;flex-direction:column;">
            <div style="display:flex;align-items:center;gap:1rem;">
              <div class="modal-title">${ign}</div>
              <div class="modal-region" style="color:var(--muted-2);text-transform:uppercase;font-weight:600;opacity:0.9;">${(player.region || 'N/A').toUpperCase()}</div>
            </div>
            <div class="modal-badge" style="margin-top:0.5rem;"><i class="${category.icon}" style="margin-right:6px"></i>${category.label}</div>
          </div>
        </div>
        <div class="modal-position">
          <div class="position-number">${position}.</div>
          <div>
            <div class="position-label">OVERALL</div>
            <div style="color:#d9c2ea;">${totalPoints} points</div>
          </div>
        </div>
        <div class="modal-tiers">
          ${tiersHtml || '<div style="color:#b79bd6">No tiers available</div>'}
        </div>
      </div>
    </div>
  `;
}

function openPlayerModal(player) {
  const root = document.getElementById('playerModalRoot');
  if (!root) return;
  root.innerHTML = buildModalHtml(player);
  const overlay = root.querySelector('.player-modal-overlay');
  const closeBtn = root.querySelector('.modal-close');
  const modal = root.querySelector('.player-modal');
  // trigger staggered animations
  setTimeout(() => modal?.classList.add('animate'), 30);
  function close() { root.innerHTML = ''; document.removeEventListener('keydown', onKey); }
  closeBtn?.addEventListener('click', close);
  overlay?.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  function onKey(e) { if (e.key === 'Escape') close(); }
  document.addEventListener('keydown', onKey);
}

function closePlayerModal() { const root = document.getElementById('playerModalRoot'); if (root) root.innerHTML = ''; }

// Delegate clicks from tierBoard to open modal for clicked player
if (tierBoard) {
  tierBoard.addEventListener('click', (e) => {
    const card = e.target.closest('.tier-player, .ranking-row');
    if (!card) return;
    const ign = card.dataset?.ign;
    if (!ign) return;
    const player = latestPlayers.find(p => (p.ign || p.name || p.uuid || '').toLowerCase() === ign.toLowerCase());
    if (player) openPlayerModal(player);
  });
}

// Update search behavior: open modal if exact name matches, otherwise render board
// Only run search action when Enter is pressed
if (searchInput) {
  searchInput.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    const q = searchInput.value.trim();
    if (!q) return renderTierBoard(latestPlayers, document.querySelector('.mode-tab.active')?.dataset.mode || 'Overall');
    const match = latestPlayers.find(p => (p.ign || p.name || p.uuid || '').toLowerCase() === q.toLowerCase());
    if (match) {
      openPlayerModal(match);
    } else {
      renderTierBoard(latestPlayers, document.querySelector('.mode-tab.active')?.dataset.mode || 'Overall');
    }
  });
}

function setupModeTabs(players) {
  if (!modeTabs) return;
  const availableModes = getAvailableModes(players);
  const tabs = [...new Set([...MODE_ORDER, ...availableModes])];
  modeTabs.innerHTML = tabs.map((mode, idx) => renderModeTab(mode, idx === 0)).join('');

  modeTabs.addEventListener('click', event => {
    const button = event.target.closest('.mode-tab');
    if (!button) return;
    const selectedMode = button.dataset.mode;
    modeTabs.querySelectorAll('.mode-tab').forEach(tab => tab.classList.remove('active'));
    button.classList.add('active');
    renderTierBoard(latestPlayers, selectedMode);
  });
}

async function fetchPlayers() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/players?select=*`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      Accept: 'application/json',
    },
  });
  if (!res.ok) throw new Error('Failed to load players');
  return res.json();
}

let latestPlayers = [];

async function init() {
  try {
    if (tierBoard) tierBoard.innerHTML = '<div class="loader" aria-hidden="true"></div>';
    const data = await fetchPlayers();
    latestPlayers = data.map(player => ({
      ...player,
      ign: player.ign || player.name || player.uuid || 'Unknown',
      region: player.region || 'N/A',
    }));
    setupModeTabs(latestPlayers);
    renderTierBoard(latestPlayers, 'Overall');
  } catch (err) {
    if (tierBoard) tierBoard.innerHTML = '<div class="tier-empty">Unable to fetch tiers.</div>';
    console.error(err);
  }
}

init();

/* Floating tooltip handlers for `.tier-icon[data-tooltip]` to ensure tooltips render above all layers */
let _floatingTooltip = null;
let _tooltipTarget = null;

function showFloatingTooltip(target) {
  const text = target.dataset.tooltip;
  if (!text) return;
  hideFloatingTooltip();
  _tooltipTarget = target;
  const el = document.createElement('div');
  el.className = 'floating-tooltip';
  el.textContent = text;
  document.body.appendChild(el);
  const rect = target.getBoundingClientRect();
  el.style.left = (rect.left + rect.width / 2) + 'px';
  el.style.top = (rect.top - 8) + 'px';
  requestAnimationFrame(() => el.classList.add('show'));
  _floatingTooltip = el;
}

function moveFloatingTooltip() {
  if (!_floatingTooltip || !_tooltipTarget) return;
  const rect = _tooltipTarget.getBoundingClientRect();
  _floatingTooltip.style.left = (rect.left + rect.width / 2) + 'px';
  _floatingTooltip.style.top = (rect.top - 8) + 'px';
}

function hideFloatingTooltip() {
  if (_floatingTooltip) {
    _floatingTooltip.remove();
    _floatingTooltip = null;
    _tooltipTarget = null;
  }
}

document.addEventListener('mouseover', (e) => {
  const t = e.target.closest && e.target.closest('.tier-icon[data-tooltip]');
  if (t) showFloatingTooltip(t);
});
document.addEventListener('mouseout', (e) => {
  const t = e.target.closest && e.target.closest('.tier-icon[data-tooltip]');
  if (t) hideFloatingTooltip();
});
document.addEventListener('mousemove', moveFloatingTooltip);
