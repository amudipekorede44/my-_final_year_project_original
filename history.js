// ============================================================
// Activity Log — vanilla JS (no framework)
// ============================================================

const deviceData = [
  { id: 1,  type: 'Lighting', name: 'Light', time: '14:20:05', status: 'ON',  icon: 'lightbulb' },
  { id: 2,  type: 'HVAC',     name: 'Fan',   time: '14:18:12', status: 'ON',  icon: 'mode_fan' },
  { id: 4,  type: 'Lighting', name: 'Light', time: '14:12:01', status: 'OFF', icon: 'lightbulb' },
  { id: 5,  type: 'HVAC',     name: 'Fan',   time: '14:05:33', status: 'ON',  icon: 'mode_fan' },
  { id: 6,  type: 'Lighting', name: 'Light', time: '13:58:19', status: 'ON',  icon: 'lightbulb' },
  { id: 8,  type: 'Lighting', name: 'Light', time: '13:45:22', status: 'OFF', icon: 'lightbulb' },
  { id: 9,  type: 'HVAC',     name: 'Fan',   time: '13:30:11', status: 'OFF', icon: 'mode_fan' },
  { id: 11, type: 'Lighting', name: 'Light', time: '13:10:45', status: 'ON',  icon: 'lightbulb' },
  { id: 12, type: 'HVAC',     name: 'Fan',   time: '13:05:00', status: 'OFF', icon: 'mode_fan' },
  { id: 13, type: 'Lighting', name: 'Light', time: '12:55:12', status: 'ON',  icon: 'lightbulb' },
  { id: 15, type: 'Lighting', name: 'Light', time: '12:30:15', status: 'OFF', icon: 'lightbulb' },
  { id: 16, type: 'HVAC',     name: 'Fan',   time: '12:15:00', status: 'OFF', icon: 'mode_fan' },
  { id: 17, type: 'Lighting', name: 'Light', time: '11:55:40', status: 'ON',  icon: 'lightbulb' },
  { id: 19, type: 'HVAC',     name: 'Fan',   time: '11:25:33', status: 'ON',  icon: 'mode_fan' },
  { id: 20, type: 'Lighting', name: 'Light', time: '11:10:05', status: 'ON',  icon: 'lightbulb' },
];

let currentFilter = 'all';

// Cached at DOMContentLoaded
let tableBody, logTable, searchInput, filterChips, scrollTopBtn;

// ---------- Render ----------
function renderLogs() {
  const query = searchInput.value.toLowerCase();
  const filtered = deviceData.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(query) || item.type.toLowerCase().includes(query);
    const matchesFilter = currentFilter === 'all' || item.type === currentFilter;
    return matchesSearch && matchesFilter;
  });

  tableBody.innerHTML = filtered.map(item => {
    const statusClass = item.status === 'ON' ? 'is-on' : 'is-off';
    return `
      <tr>
        <td>
          <div class="log-event">
            <span class="log-event__icon">
              <span class="material-symbols-outlined size-18">${item.icon}</span>
            </span>
            <span class="log-event__name">${item.name}</span>
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

  document.getElementById('stat-total').innerText = filtered.length;
  document.getElementById('stat-on').innerText = filtered.filter(i => i.status === 'ON').length;
  document.getElementById('stat-off').innerText = filtered.filter(i => i.status === 'OFF').length;
}

// ---------- Theme ----------
function setTheme(theme) {
  const html = document.documentElement;
  const btnLight = document.getElementById('btn-theme-light');
  const btnDark = document.getElementById('btn-theme-dark');

  if (theme === 'light') {
    html.classList.remove('dark');
    btnLight.classList.add('is-light-active');
    btnDark.classList.remove('is-dark-active');
  } else {
    html.classList.add('dark');
    btnDark.classList.add('is-dark-active');
    btnLight.classList.remove('is-light-active');
  }
}

// ---------- Side menu ----------
function toggleMenu() {
  const overlay = document.getElementById('side-menu-overlay');
  const menu = document.getElementById('side-menu');
  const isActive = overlay.classList.toggle('active');
  menu.classList.toggle('open', isActive);
}

// ---------- Real-time simulation ----------
function simulateRealTimeUpdates() {
  setInterval(() => {
    if (Math.random() > 0.8) {
      const randomDevice = deviceData[Math.floor(Math.random() * deviceData.length)];
      const newStatus = randomDevice.status === 'ON' ? 'OFF' : 'ON';
      const newTime = new Date().toLocaleTimeString('en-GB');

      deviceData.unshift({ ...randomDevice, status: newStatus, time: newTime, id: Date.now() });
      if (deviceData.length > 50) deviceData.pop();
      renderLogs();

      // Flash the first row
      const firstRow = tableBody.querySelector('tr');
      if (firstRow) {
        firstRow.classList.add('flash');
        setTimeout(() => firstRow.classList.remove('flash'), 500);
      }
    }
  }, 5000);
}

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
  simulateRealTimeUpdates();
  setTheme('dark');
});
