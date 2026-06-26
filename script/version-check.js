'use strict';

const VERSION_CHECK_INTERVAL_MS = 45 * 1000;
const VERSION_CHECK_INITIAL_MS  = 15 * 1000;

function startVersionCheck() {
  setTimeout(checkForNewVersion, VERSION_CHECK_INITIAL_MS);
}

async function checkForNewVersion() {
  try {
    const res = await fetch('version.json?_=' + Date.now());
    if (!res.ok) return;
    const data = await res.json();
    if (data.version && data.version !== GAME_VERSION) {
      showUpdateBanner();
      return;
    }
  } catch (_) {}
  setTimeout(checkForNewVersion, VERSION_CHECK_INTERVAL_MS);
}

function showUpdateBanner() {
  const banner = document.getElementById('update-banner');
  if (banner) banner.classList.remove('hidden');
}

function saveAndReload() {
  saveGame();
  // Cache-Buster: zwingt den Browser, alle Ressourcen frisch vom Server zu laden
  window.location.href = window.location.pathname + '?v=' + Date.now();
}
