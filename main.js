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


//new nav
// Side menu toggle — global so inline onclick attributes resolve
function toggleMenu() {
  const overlay = document.getElementById('side-menu-overlay');
  const menu = document.getElementById('side-menu');
  const isActive = overlay.classList.toggle('active');
  menu.classList.toggle('open', isActive);
}


// ---------- Theme ----------
function setTheme(theme) {
  state.theme = theme;
  const html = document.documentElement;
  const btnLight = document.getElementById('btn-theme-light');
  const btnDark = document.getElementById('btn-theme-dark');

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

// ---------- UI updates ----------
function updateUI() {
  const isAuto = state.mode === 'auto';
  document.body.classList.toggle('auto-mode', isAuto);
  document.body.classList.toggle('manual-mode', !isAuto);

  // Auto / Manual pill
  const btnAuto = document.getElementById('btn-auto');
  const btnManual = document.getElementById('btn-manual');
  btnAuto.classList.toggle('is-active-auto', isAuto);
  btnManual.classList.toggle('is-active-manual', !isAuto);

  // Mode banner
  const banner = document.getElementById('mode-banner');
  const modeIcon = document.getElementById('mode-icon');
  const modeText = document.getElementById('mode-text');
  banner.classList.toggle('mode-auto', isAuto);
  banner.classList.toggle('mode-manual', !isAuto);
  modeIcon.innerText = isAuto ? '🤖' : '✋';
  modeText.innerText = isAuto ? 'Auto — sensors control all devices'
                              : 'Manual — you are in full control';

  // Sensors
  const tempEl = document.getElementById('temp-value');
  const zoneEl = document.getElementById('temp-zone');
  tempEl.innerText = `${state.temp.toFixed(1)}°C`;
  zoneEl.innerText = state.zone;

  const zoneClass = `zone-${state.zone}`;
  tempEl.className = `sensor-value ${zoneClass}`;
  zoneEl.className = `sensor-label ${zoneClass}`;

  document.getElementById('humidity-value').innerText = `${state.humidity}%`;
  document.getElementById('occ-value').innerText = state.occupied ? 'Yes' : 'No';

  // Radar pill
  const radarPill = document.getElementById('radar-pill');
  const radarText = document.getElementById('radar-text');
  if (state.occupied) {
    radarPill.classList.add('is-detected');
    radarPill.classList.remove('is-empty');
    radarText.innerText = 'Detected';
  } else {
    radarPill.classList.add('is-empty');
    radarPill.classList.remove('is-detected');
    radarText.innerText = 'Empty';
  }

  // Light card
  const lightCard = document.getElementById('card-light');
  const lightBox = document.getElementById('light-icon-container');
  const lightIcon = document.getElementById('light-icon');
  const lightPill = document.getElementById('light-pill');
  if (state.light) {
    lightCard.classList.add('card-glow-amber');
    lightBox.classList.add('is-amber');
    lightIcon.classList.add('is-amber');
    lightPill.classList.add('is-on-light');
    lightPill.innerText = 'On';
  } else {
    lightCard.classList.remove('card-glow-amber');
    lightBox.classList.remove('is-amber');
    lightIcon.classList.remove('is-amber');
    lightPill.classList.remove('is-on-light');
    lightPill.innerText = 'Off';
  }

  // Fan card
  const fanCard = document.getElementById('card-fan');
  const fanBox = document.getElementById('fan-icon-container');
  const fanIcon = document.getElementById('fan-icon');
  const fanPill = document.getElementById('fan-pill');
  if (state.fan) {
    fanCard.classList.add('card-glow-blue');
    fanBox.classList.add('is-blue');
    fanIcon.classList.add('is-blue', 'fan-spin');
    fanPill.classList.add('is-on-fan');
    fanPill.innerText = 'Running';
  } else {
    fanCard.classList.remove('card-glow-blue');
    fanBox.classList.remove('is-blue');
    fanIcon.classList.remove('is-blue', 'fan-spin');
    fanPill.classList.remove('is-on-fan');
    fanPill.innerText = 'Off';
  }

  // Power buttons enabled state
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

    if (state.temp < 26) state.zone = 'cool';
    else if (state.temp < 28) state.zone = 'average';
    else if (state.temp < 32) state.zone = 'warm';
    else state.zone = 'hot';

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

    if (state.temp < 26) state.zone = 'cool';
    else if (state.temp < 28) state.zone = 'average';
    else if (state.temp < 32) state.zone = 'warm';
    else state.zone = 'hot';
  }

  let basePower = 0.15;
  if (state.light) basePower += 0.45;
  if (state.fan) basePower += 0.8;
  state.power = basePower + (Math.random() * 0.1);

  updateUI();
}

// ---------- Init ----------
document.addEventListener('DOMContentLoaded', () => {
  setMode('auto');
  setTheme('dark');
  setInterval(simulateData, 2000);
});
