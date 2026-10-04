// ============================================================
// Activity Log — vanilla JS (no framework)
// ============================================================

let deviceData = [];

let currentFilter = 'all';

// Cached at DOMContentLoaded
let tableBody, logTable, searchInput, filterChips, scrollTopBtn;

// ---------- Render ----------
function renderLogs() {
  if (!tableBody) return;

  const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
  const filtered = deviceData.filter(item => {
    const matchesSearch = !query || 
      item.name.toLowerCase().includes(query) || 
      item.type.toLowerCase().includes(query) ||
      (item.status && item.status.toLowerCase().includes(query)) ||
      (item.mode && item.mode.toLowerCase().includes(query));
    const matchesFilter = currentFilter === 'all' || item.type === currentFilter;
    return matchesSearch && matchesFilter;
  });

  if (filtered.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="4" style="text-align:center; padding: 40px 16px; color: var(--text-muted); font-size: 0.9rem;">
          ${deviceData.length === 0 ? 'No activity recorded yet. Fan and light events will appear here in real time.' : 'No events match your search or filter.'}
        </td>
      </tr>
    `;
  } else {
    tableBody.innerHTML = filtered.map(item => {
      const statusClass = item.status === 'ON' ? 'is-on' : 'is-off';
      const modeLabel = item.mode ? ` <span style="opacity:0.65; font-size:0.75rem;">(${item.mode})</span>` : '';
      return `
        <tr>
          <td>
            <div class="log-event">
              <span class="log-event__icon">
                <span class="material-symbols-outlined size-18">${item.icon}</span>
              </span>
              <span class="log-event__name">${item.name}${modeLabel}</span>
            </div>
          </td>
          <td class="log-cell-type">${item.type}</td>
          <td class="log-cell-time time-col">${item.time}</td>
          <td class="right">
            <span class="status-badge ${statusClass}">${item.status}</span>
          </td>
        </tr>
      `;
    }).join('');
  }

  const statTotal = document.getElementById('stat-total');
  const statOn = document.getElementById('stat-on');
  const statOff = document.getElementById('stat-off');

  if (statTotal) statTotal.innerText = deviceData.length;
  if (statOn) statOn.innerText = deviceData.filter(i => i.status === 'ON').length;
  if (statOff) statOff.innerText = deviceData.filter(i => i.status === 'OFF').length;
}

// Exposed for the Firebase module in history.html
window.setActivityData = function (newLogs) {
  const previousFirstId = deviceData.length > 0 ? deviceData[0].id : null;
  deviceData = Array.isArray(newLogs) ? newLogs : [];
  renderLogs();

  // Flash newest row when a fresh event arrives
  if (previousFirstId && deviceData.length > 0 && deviceData[0].id !== previousFirstId && tableBody) {
    const firstRow = tableBody.querySelector('tr');
    if (firstRow) {
      firstRow.classList.add('flash');
      setTimeout(() => firstRow.classList.remove('flash'), 600);
    }
  }
};

// ---------- Theme ----------
// theme.js owns the `dark` class on <html> and remembers the choice in
// localStorage, so main.html and power.html open in the same theme. All that
// is left here is keeping the two toggle buttons in step.

// theme.js has to be loaded first, from the <head> of the page. If it is
// missing, fall back to the old fixed-dark behaviour rather than break.
if (typeof Theme === 'undefined') {
  console.warn('theme.js is not loaded — the theme will not be remembered between pages.');
  window.Theme = { get: () => 'dark', set: () => {}, toggle: () => {}, subscribe: (fn) => fn('dark') };
}

function paintThemeButtons(theme) {
  const btnLight = document.getElementById('btn-theme-light');
  const btnDark = document.getElementById('btn-theme-dark');
  if (!btnLight || !btnDark) return;

  if (theme === 'light') {
    btnLight.classList.add('is-light-active');
    btnDark.classList.remove('is-dark-active');
  } else {
    btnDark.classList.add('is-dark-active');
    btnLight.classList.remove('is-light-active');
  }
}

// Still global with the same signature, because history.html calls
// setTheme('light') / setTheme('dark') from inline onclick attributes.
function setTheme(theme) {
  Theme.set(theme);
}

// Runs once the page is ready with whatever theme was saved, and again on
// every later change — including one made in another open tab.
Theme.subscribe(paintThemeButtons);

// ---------- Side menu ----------
function toggleMenu() {
  const overlay = document.getElementById('side-menu-overlay');
  const menu = document.getElementById('side-menu');
  const isActive = overlay.classList.toggle('active');
  menu.classList.toggle('open', isActive);
}

// Fallback logout handler
window.handleLogout = window.handleLogout || function(e) {
  if (e) e.preventDefault();
  sessionStorage.clear();
  localStorage.removeItem("user");
  window.location.href = "../login.html";
};

// ---------- Responsive time column ----------
function applyResponsiveColumns() {
  const hide = window.innerWidth < 400;
  logTable.classList.toggle('hide-time', hide);
}

// ---------- Init ----------
document.addEventListener('DOMContentLoaded', () => {
  tableBody    = document.getElementById('log-table-body');
  logTable     = document.getElementById('log-table');
  searchInput  = document.getElementById('log-search');
  filterChips  = document.querySelectorAll('.filter-chip');
  scrollTopBtn = document.getElementById('scroll-top');

  // Filters
  filterChips.forEach(chip => {
    chip.addEventListener('click', () => {
      filterChips.forEach(c => c.classList.remove('is-active'));
      chip.classList.add('is-active');
      currentFilter = chip.dataset.filter;
      renderLogs();
    });
  });

  // Search
  searchInput.addEventListener('input', renderLogs);

  // Scroll-to-top button visibility
  window.addEventListener('scroll', () => {
    scrollTopBtn.classList.toggle('is-visible', window.scrollY > 300);
  });
  scrollTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // Responsive
  window.addEventListener('resize', applyResponsiveColumns);

  // Initialize
  renderLogs();
  applyResponsiveColumns();
});
