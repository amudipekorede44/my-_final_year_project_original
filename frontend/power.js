// =====================================================
// Power Analytics — Connected to Firebase
// Calculates usage percentage from Light & Fan operations
// =====================================================

// Side menu toggle
function toggleMenu() {
  const overlay = document.getElementById('side-menu-overlay');
  const menu = document.getElementById('side-menu');
  const isActive = overlay.classList.toggle('active');
  menu.classList.toggle('open', isActive);
}

// Shared theme handler
if (typeof Theme === 'undefined') {
  console.warn('theme.js is not loaded — the theme will not be remembered between pages.');
  window.Theme = { get: () => 'dark', set: () => {}, toggle: () => {}, subscribe: (fn) => fn('dark') };
}

// ---------- Calculate and Render Usage Percentages ----------
function updatePowerAnalytics(activityLogs, liveRoomData) {
  const logs = Array.isArray(activityLogs) ? activityLogs : [];
  const room = liveRoomData || {};

  // Count "ON" operations for Lighting and Fan from real Firebase records
  let lightOnCount = 0;
  let fanOnCount = 0;

  logs.forEach((item) => {
    const status = (item.status || '').toUpperCase();
    const type = item.type || '';
    const name = item.name || '';
    const isLight = type === 'Lighting' || name === 'Light';
    const isFan = type === 'Fan' || name === 'Fan';

    if (status === 'ON') {
      if (isLight) lightOnCount++;
      if (isFan) fanOnCount++;
    }
  });

  const totalOnCount = lightOnCount + fanOnCount;

  let lightPct = 0;
  let fanPct = 0;

  if (totalOnCount > 0) {
    lightPct = Math.round((lightOnCount / totalOnCount) * 100);
    fanPct = 100 - lightPct; // Guaranteed to equal 100% total
  } else {
    // If no logged ON records yet, use current live device status as fallback
    const isLightLive = !!(room.light === true || room.light === 'true' || room.light === 1 || room.light === 'on');
    const isFanLive   = !!(room.fan === true || room.fan === 'true' || room.fan === 1 || room.fan === 'on');

    if (isLightLive && isFanLive) {
      lightPct = 50;
      fanPct = 50;
    } else if (isLightLive) {
      lightPct = 100;
      fanPct = 0;
    } else if (isFanLive) {
      lightPct = 0;
      fanPct = 100;
    } else {
      lightPct = 0;
      fanPct = 0;
    }
  }

  // 1. Update Fan Breakdown Card
  const fanPctEl = document.getElementById('fan-usage-pct');
  const fanBarEl = document.getElementById('fan-bar-fill');
  const fanSubEl = document.getElementById('fan-usage-sub');
  if (fanPctEl) fanPctEl.innerText = `${fanPct}%`;
  if (fanBarEl) fanBarEl.style.width = `${fanPct}%`;
  if (fanSubEl) {
    fanSubEl.innerText = totalOnCount > 0 ? `Fan (${fanOnCount} ON operations)` : 'Fan (0 operations)';
  }

  // 2. Update Lighting Breakdown Card
  const lightPctEl = document.getElementById('light-usage-pct');
  const lightBarEl = document.getElementById('light-bar-fill');
  const lightSubEl = document.getElementById('light-usage-sub');
  if (lightPctEl) lightPctEl.innerText = `${lightPct}%`;
  if (lightBarEl) lightBarEl.style.width = `${lightPct}%`;
  if (lightSubEl) {
    lightSubEl.innerText = totalOnCount > 0 ? `Lighting (${lightOnCount} ON operations)` : 'Lighting (0 operations)';
  }

  // 3. Update Current Load Pill
  const isLightActive = !!(room.light === true || room.light === 'true' || room.light === 1 || room.light === 'on');
  const isFanActive   = !!(room.fan === true || room.fan === 'true' || room.fan === 1 || room.fan === 'on');
  const loadTextEl = document.getElementById('current-load-text');
  if (loadTextEl) {
    if (isLightActive && isFanActive) {
      loadTextEl.innerText = 'High Load — Fan & Light Active';
    } else if (isLightActive) {
      loadTextEl.innerText = 'Moderate Load — Lighting Active';
    } else if (isFanActive) {
      loadTextEl.innerText = 'Moderate Load — Fan Active';
    } else {
      loadTextEl.innerText = 'Optimal Performance — Idle (0 Active)';
    }
  }

}

// Exposed for the Firebase module in power.html
window.updatePowerAnalytics = updatePowerAnalytics;

document.addEventListener('DOMContentLoaded', () => {
  const themeToggle = document.getElementById('theme-toggle');

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      Theme.toggle();
    });
  }

  Theme.subscribe((theme) => {
    if (!themeToggle) return;
    const iconEl = themeToggle.querySelector('.material-symbols-outlined');
    if (iconEl) iconEl.innerText = (theme === 'light') ? 'light_mode' : 'dark_mode';
  });

  // Hover lift on glass cards
  document.querySelectorAll('.glass-effect').forEach(card => {
    card.addEventListener('mouseenter', () => {
      card.style.transition = 'transform 0.2s ease-out';
      card.style.transform = 'translateY(-2px)';
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'translateY(0)';
    });
  });
});
