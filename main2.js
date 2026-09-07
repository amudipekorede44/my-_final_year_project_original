// ============================================================
// Smart Room Automation — vanilla JS (no framework)
// ============================================================

const state = {
  mode: 'auto',
  theme: 'dark',
  light: false,
  fan: false,
  occupied: true,
  temp: 24.5,
  humidity: 62,
  zone: 'cool',
  power: 1.25,
  menuOpen: false,
};

// ---------- Menu ----------
function setMenu(open) {
  state.menuOpen = open;

  const overlay   = document.getElementById('menu-overlay');
  const wrapper   = document.getElementById('content-wrapper');
  const menuBtn   = document.getElementById('menu-toggle-btn');
  const menuIcon  = document.getElementById('menu-icon');

  overlay.classList.toggle('is-open', open);
  wrapper.classList.toggle('blurred', open);
  menuBtn.classList.toggle('menu-open', open);
  menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
  menuIcon.textContent = open ? 'close' : 'menu';
}

function toggleMenu() { setMenu(!state.menuOpen); }
function closeMenu()  { if (state.menuOpen) setMenu(false); }

// ---------- Theme ----------
function setTheme(theme) {
  state.theme = theme;
  const html = document.documentElement;
  const btnLight = document.getElementById('btn-theme-light');
  const btnDark  = document.getElementById('btn-theme-dark');

  if (theme === 'light') {
    html.classList.remove('dark');
    btnLight.classList.add('is-active-light');
    btnDark.classList.remove('is-active-dark');
  } else {
    html.classList.add('dark');
    btnDark.classList.add('is-active-dark');
    btnLight.classList.remove('is-active-light');
  }
  updateUI();
}

// ---------- Mode ----------
function setMode(mode) {
  state.mode = mode;
  updateUI();
}

// ---------- Devices ----------
function toggleDevice(device) {
  if (state.mode === 'auto') return;
  state[device] = !state[device];
  updateUI();
}

// ---------- UI ----------
function updateUI() {
  const isAuto = state.mode === 'auto';
  document.body.classList.toggle('auto-mode', isAuto);
  document.body.classList.toggle('manual-mode', !isAuto);

  const btnAuto   = document.getElementById('btn-auto');
  const btnManual = document.getElementById('btn-manual');
  btnAuto.classList.toggle('is-active-auto', isAuto);
  btnManual.classList.toggle('is-active-manual', !isAuto);

  const banner = document.getElementById('mode-banner');
  banner.classList.toggle('mode-auto', isAuto);
  banner.classList.toggle('mode-manual', !isAuto);
  document.getElementById('mode-icon').textContent = isAuto ? '🤖' : '✋';
  document.getElementById('mode-text').textContent =
    isAuto ? 'Auto — sensors control all devices'
           : 'Manual — you are in full control';

  // Sensors
  const tempEl = document.getElementById('temp-value');
  const zoneEl = document.getElementById('temp-zone');
  tempEl.textContent = `${state.temp.toFixed(1)}°C`;
  zoneEl.textContent = state.zone;
  const zoneClass = `zone-${state.zone}`;
  tempEl.className = `sensor-value ${zoneClass}`;
  zoneEl.className = `sensor-label ${zoneClass}`;

  document.getElementById('humidity-value').textContent = `${state.humidity}%`;
  document.getElementById('occ-value').textContent = state.occupied ? 'Yes' : 'No';

  // Radar
  const radarPill = document.getElementById('radar-pill');
  const radarText = document.getElementById('radar-text');
  if (state.occupied) {
    radarPill.classList.add('is-detected'); radarPill.classList.remove('is-empty');
    radarText.textContent = 'Detected';
  } else {
    radarPill.classList.add('is-empty'); radarPill.classList.remove('is-detected');
    radarText.textContent = 'Empty';
  }

  // Light
  const lightCard = document.getElementById('card-light');
  const lightBox  = document.getElementById('light-icon-container');
  const lightIcon = document.getElementById('light-icon');
  const lightPill = document.getElementById('light-pill');
  if (state.light) {
    lightCard.classList.add('card-glow-amber');
    lightBox.classList.add('is-amber');
    lightIcon.classList.add('is-amber');
    lightPill.classList.add('is-on-light');
    lightPill.textContent = 'On';
  } else {
    lightCard.classList.remove('card-glow-amber');
    lightBox.classList.remove('is-amber');
    lightIcon.classList.remove('is-amber');
    lightPill.classList.remove('is-on-light');
    lightPill.textContent = 'Off';
  }

  // Fan
  const fanCard = document.getElementById('card-fan');
  const fanBox  = document.getElementById('fan-icon-container');
  const fanIcon = document.getElementById('fan-icon');
  const fanPill = document.getElementById('fan-pill');
  if (state.fan) {
    fanCard.classList.add('card-glow-blue');
    fanBox.classList.add('is-blue');
    fanIcon.classList.add('is-blue', 'fan-spin');
    fanPill.classList.add('is-on-fan');
    fanPill.textContent = 'Running';
  } else {
    fanCard.classList.remove('card-glow-blue');
    fanBox.classList.remove('is-blue');
    fanIcon.classList.remove('is-blue', 'fan-spin');
    fanPill.classList.remove('is-on-fan');
    fanPill.textContent = 'Off';
  }

  // Power buttons
  document.querySelectorAll('.power-btn').forEach(btn => {
    btn.classList.toggle('is-disabled', isAuto);
    btn.disabled = isAuto;
  });
}

// ---------- Simulation ----------
function simulateData() {
  if (state.mode === 'auto') {
    if (Math.random() > 0.8) state.occupied = !state.occupied;
    state.temp += (Math.random() - 0.5) * 0.5;
    state.humidity += Math.floor((Math.random() - 0.5) * 2);
    state.humidity = Math.max(0, Math.min(100, state.humidity));

    if (state.temp < 26)      state.zone = 'cool';
    else if (state.temp < 28) state.zone = 'average';
    else if (state.temp < 32) state.zone = 'warm';
    else                       state.zone = 'hot';

    if (state.occupied) {
      state.light = true;
      state.fan = state.temp >= 28;
    } else {
      state.light = false;
      state.fan = false;
    }
  } else {
    state.temp += (Math.random() - 0.5) * 0.2;
    state.humidity += Math.floor((Math.random() - 0.5) * 1);
    state.humidity = Math.max(0, Math.min(100, state.humidity));

    if (state.temp < 26)      state.zone = 'cool';
    else if (state.temp < 28) state.zone = 'average';
    else if (state.temp < 32) state.zone = 'warm';
    else                       state.zone = 'hot';
  }

  let basePower = 0.15;
  if (state.light) basePower += 0.45;
  if (state.fan)   basePower += 0.8;
  state.power = basePower + Math.random() * 0.1;

  updateUI();
}

// ---------- Init ----------
document.addEventListener('DOMContentLoaded', () => {
  // Wire menu controls — no inline onclicks
  document.getElementById('menu-toggle-btn').addEventListener('click', toggleMenu);
  document.getElementById('menu-overlay__rest').addEventListener('click', closeMenu);
  document.querySelectorAll('[data-menu-close]').forEach(el => {
    el.addEventListener('click', closeMenu);
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && state.menuOpen) closeMenu();
  });

  // Theme toggle
  document.getElementById('btn-theme-light').addEventListener('click', () => setTheme('light'));
  document.getElementById('btn-theme-dark').addEventListener('click',  () => setTheme('dark'));

  // Mode toggle
  document.getElementById('btn-auto').addEventListener('click',   () => setMode('auto'));
  document.getElementById('btn-manual').addEventListener('click', () => setMode('manual'));

  // Device toggles
  document.querySelector('[data-device="light"]').addEventListener('click', () => toggleDevice('light'));
  document.querySelector('[data-device="fan"]').addEventListener('click',   () => toggleDevice('fan'));

  // Initialize
  setMode('auto');
  setTheme('dark');
  setInterval(simulateData, 2000);
});
