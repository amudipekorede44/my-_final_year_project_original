// ============================================================
// Smart Room dashboard
//
// This file used to invent its own readings every 2 seconds, which is why the
// fan appeared to switch on without caring about temperature or humidity: the
// simulator was doing `state.fan = state.temp >= 28` on made up numbers and
// repainting over whatever Firebase had just delivered.
//
// The simulator is gone. Everything shown here now comes from the ESP32 by way
// of Firebase, and every button press goes back the same way.
//   AUTO   -> clears lightOverride and fanOverride, the room follows the sensors
//   MANUAL -> sets both overrides, the room follows the two power buttons
// ============================================================

const state = {
  mode: 'auto',
  theme: 'dark',
  light: false,
  fan: false,
  lightOverride: false,
  fanOverride: false,
  occupied: false,
  lightPending: false,   // person detected, still inside the 2 second delay
  temp: null,
  humidity: null,
  zone: 'cool',
  distanceCM: null,
  angleDeg: null,
  tempThreshold: 28.0,
  humThreshold: 80.0,
  hasReceivedControllerData: false,
  online: false,
  menuOpen: false,
};

// Helper parsers to ensure Firebase data types (string, number, boolean) map correctly
function parseBoolean(val) {
  if (typeof val === 'boolean') return val;
  if (typeof val === 'number') return val > 0;
  if (typeof val === 'string') {
    const s = val.trim().toLowerCase();
    return s === 'true' || s === '1' || s === 'on' || s === 'present' || s === 'yes' || s === 'detected';
  }
  return false;
}

function parseNumber(val) {
  if (typeof val === 'number' && !isNaN(val)) return val;
  if (typeof val === 'string') {
    const n = parseFloat(val);
    if (!isNaN(n)) return n;
  }
  return null;
}

// Display thresholds, kept in step with the firmware.
const TEMP_THRESHOLD = 28.0;
const HUM_THRESHOLD  = 85.0;

// After a user tap, briefly protect the local UI to ensure smooth state transition
let localLockUntil = 0;
const LOCAL_LOCK_MS = 500;

function lockLocal() { localLockUntil = Date.now() + LOCAL_LOCK_MS; }
function localLocked() { return Date.now() < localLockUntil; }

// ---------- Side menu ----------
function toggleMenu() {
  const overlay = document.getElementById('side-menu-overlay');
  const menu = document.getElementById('side-menu');
  const isActive = overlay.classList.toggle('active');
  menu.classList.toggle('open', isActive);
}

// ---------- Theme ----------
if (typeof Theme === 'undefined') {
  console.warn('theme.js is not loaded — the theme will not be remembered between pages.');
  window.Theme = { get: () => 'dark', set: () => {}, toggle: () => {}, subscribe: (fn) => fn('dark') };
}

function paintThemeButtons(theme) {
  const btnLight = document.getElementById('btn-theme-light');
  const btnDark = document.getElementById('btn-theme-dark');
  if (!btnLight || !btnDark) return;

  if (theme === 'light') {
    btnLight.classList.add('is-active-light');
    btnDark.classList.remove('is-active-dark');
  } else {
    btnDark.classList.add('is-active-dark');
    btnLight.classList.remove('is-active-light');
  }
}

function setTheme(theme) {
  Theme.set(theme);
}

Theme.subscribe((theme) => {
  state.theme = theme;
  paintThemeButtons(theme);
  updateUI();
});

// ---------- Mode ----------
function setMode(mode) {
  if (mode !== 'auto' && mode !== 'manual') return;
  state.mode = mode;

  lockLocal();
  updateUI();

  if (window.roomControl) {
    window.roomControl.setMode(mode, { light: state.light, fan: state.fan });
  }
}

// ---------- Devices ----------
function toggleDevice(device) {
  if (device !== 'light' && device !== 'fan') return;

  if (state.mode === 'auto') {
    state.mode = 'manual';
  }

  const next = !state[device];
  state[device] = next;
  state[device + 'Override'] = true;
  lockLocal();
  updateUI();

  if (window.roomControl) {
    window.roomControl.setManual(device, next);
  } else if (window.firebaseSetOverride) {
    window.firebaseSetOverride(device, next);
  }
}

// ---------- Incoming data ----------
function zoneFor(temp) {
  if (temp === null || isNaN(temp)) return 'cool';
  if (temp < 24) return 'cool';
  if (temp < state.tempThreshold) return 'average';
  if (temp < 32) return 'warm';
  return 'hot';
}

// Called by the Firebase module in main.html on every snapshot.
function applyRoomSnapshot(data) {
  if (!data) return;
  state.online = true;

  // Temperature
  const t = parseNumber(data.temperature ?? data.temp ?? data.temperatureC ?? data.tempC);
  if (t !== null) {
    state.temp = t;
    state.zone = zoneFor(state.temp);
    state.hasReceivedControllerData = true;
  }

  // Humidity
  const h = parseNumber(data.humidity ?? data.hum ?? data.humidityPct);
  if (h !== null) {
    state.humidity = h;
    state.hasReceivedControllerData = true;
  }

  // Occupancy / Radar Presence
  const rawOcc = data.occupancy ?? data.occupied ?? data.presence;
  if (rawOcc !== undefined && rawOcc !== null) {
    state.occupied = parseBoolean(rawOcc);
    state.hasReceivedControllerData = true;
  }
  if (data.lightPending !== undefined) {
    state.lightPending = parseBoolean(data.lightPending);
  }

  // Distance and Angle from RD-03D mmWave radar
  const dist = parseNumber(data.distanceCM ?? data.distance);
  if (dist !== null) state.distanceCM = dist;
  const ang = parseNumber(data.angleDeg ?? data.angle);
  if (ang !== null) state.angleDeg = ang;

  // Dynamic thresholds
  const thresh = parseNumber(data.threshold ?? data.tempThreshold ?? data.TEMP_THRESHOLD_C);
  if (thresh !== null) state.tempThreshold = thresh;
  const humThresh = parseNumber(data.humThreshold ?? data.HUMIDITY_THRESHOLD_PCT);
  if (humThresh !== null) state.humThreshold = humThresh;

  // Devices & Mode sync
  if (!localLocked()) {
    const rawLight = data.light ?? data.lightState;
    if (rawLight !== undefined && rawLight !== null) {
      state.light = parseBoolean(rawLight);
    }
    const rawFan = data.fan ?? data.fanState;
    if (rawFan !== undefined && rawFan !== null) {
      state.fan = parseBoolean(rawFan);
    }

    if (data.lightOverride !== undefined) {
      state.lightOverride = parseBoolean(data.lightOverride);
    }
    if (data.fanOverride !== undefined) {
      state.fanOverride = parseBoolean(data.fanOverride);
    }

    const hasManual = state.lightOverride || state.fanOverride ||
                      parseBoolean(data.manualModeActive) || parseBoolean(data.manualMode);
    if (data.mode === 'manual' || data.mode === 'auto') {
      state.mode = data.mode;
    } else {
      state.mode = hasManual ? 'manual' : 'auto';
    }
  }

  updateUI();
}

function setConnectionState(online) {
  state.online = online;
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
  if (btnAuto && btnManual) {
    btnAuto.classList.toggle('is-active-auto', isAuto);
    btnManual.classList.toggle('is-active-manual', !isAuto);
  }

  // Mode banner
  const banner = document.getElementById('mode-banner');
  const modeIcon = document.getElementById('mode-icon');
  const modeText = document.getElementById('mode-text');
  if (banner) {
    banner.classList.toggle('mode-auto', isAuto);
    banner.classList.toggle('mode-manual', !isAuto);
  }
  if (modeIcon) modeIcon.innerText = isAuto ? '🤖' : '✋';
  if (modeText) {
    if (!state.online) {
      modeText.innerText = 'Connecting to Firebase…';
    } else if (!state.hasReceivedControllerData && state.temp === null && state.humidity === null) {
      modeText.innerText = 'Connected to Firebase — waiting for ESP32 readings…';
    } else if (isAuto) {
      modeText.innerText = `Auto — light on presence, fan above ${state.tempThreshold.toFixed(0)}°C and ${state.humThreshold.toFixed(0)}%`;
    } else {
      modeText.innerText = 'Manual — you are in full control';
    }
  }

  // Sensors
  const tempEl = document.getElementById('temp-value');
  const zoneEl = document.getElementById('temp-zone');
  if (tempEl && zoneEl) {
    tempEl.innerText = (state.temp === null) ? '--°C' : `${state.temp.toFixed(1)}°C`;
    zoneEl.innerText = state.zone;
    const zoneClass = `zone-${state.zone}`;
    tempEl.className = `sensor-value ${zoneClass}`;
    zoneEl.className = `sensor-label ${zoneClass}`;
  }

  const humEl = document.getElementById('humidity-value');
  if (humEl) humEl.innerText = (state.humidity === null) ? '--%' : `${state.humidity.toFixed(1)}%`;

  const occEl = document.getElementById('occ-value');
  if (occEl) occEl.innerText = state.occupied ? 'Yes' : 'No';

  // Radar pill & subtitle
  const radarPill = document.getElementById('radar-pill');
  const radarText = document.getElementById('radar-text');
  const radarSub  = document.getElementById('radar-sub');
  if (radarPill && radarText) {
    if (state.occupied) {
      radarPill.classList.add('is-detected');
      radarPill.classList.remove('is-empty');
      radarText.innerText = 'Detected';
      if (radarSub) {
        if (state.distanceCM !== null && state.distanceCM > 0) {
          radarSub.innerText = `Target: ${state.distanceCM.toFixed(0)} cm${state.angleDeg !== null ? ' (' + state.angleDeg.toFixed(0) + '°)' : ''}`;
        } else {
          radarSub.innerText = 'Target detected';
        }
      }
    } else {
      radarPill.classList.add('is-empty');
      radarPill.classList.remove('is-detected');
      radarText.innerText = state.online ? 'Empty' : 'Offline';
      if (radarSub) {
        radarSub.innerText = 'Rd-03D mmWave sensor';
      }
    }
  }

  // Light card
  const lightCard = document.getElementById('card-light');
  const lightBox = document.getElementById('light-icon-container');
  const lightIcon = document.getElementById('light-icon');
  const lightPill = document.getElementById('light-pill');
  const lightModeLabel = document.getElementById('light-mode-label');
  if (lightModeLabel) {
    lightModeLabel.innerText = (!isAuto || state.lightOverride) ? 'Manual' : 'Auto';
  }
  if (lightCard && lightBox && lightIcon && lightPill) {
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
  }

  // Fan card
  const fanCard = document.getElementById('card-fan');
  const fanBox = document.getElementById('fan-icon-container');
  const fanIcon = document.getElementById('fan-icon');
  const fanPill = document.getElementById('fan-pill');
  const fanModeLabel = document.getElementById('fan-mode-label');
  if (fanModeLabel) {
    fanModeLabel.innerText = (!isAuto || state.fanOverride) ? 'Manual' : 'Auto';
  }
  if (fanCard && fanBox && fanIcon && fanPill) {
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
  }

  // Power buttons
  document.querySelectorAll('.power-btn').forEach(btn => {
    const offline = !state.online;
    btn.classList.toggle('is-disabled', offline);
    btn.disabled = offline;
  });
}

// ---------- Init ----------
document.addEventListener('DOMContentLoaded', () => {
  updateUI();
});

// Exposed for the Firebase module in main.html
window.applyRoomSnapshot = applyRoomSnapshot;
window.setConnectionState = setConnectionState;
