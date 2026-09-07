// =====================================================
// Power Analytics — vanilla JS (no framework)
// =====================================================

// Side menu toggle — global so inline onclick attributes resolve
function toggleMenu() {
  const overlay = document.getElementById('side-menu-overlay');
  const menu = document.getElementById('side-menu');
  const isActive = overlay.classList.toggle('active');
  menu.classList.toggle('open', isActive);
}

document.addEventListener('DOMContentLoaded', () => {
  // Theme toggle
  const themeToggle = document.getElementById('theme-toggle');
  const htmlEl = document.documentElement;

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const iconEl = themeToggle.querySelector('.material-symbols-outlined');
      if (htmlEl.classList.contains('dark')) {
        htmlEl.classList.remove('dark');
        if (iconEl) iconEl.innerText = 'light_mode';
      } else {
        htmlEl.classList.add('dark');
        if (iconEl) iconEl.innerText = 'dark_mode';
      }
    });
  }

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
