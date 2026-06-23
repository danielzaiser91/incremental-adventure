'use strict';

const VERSION_CHECK_INTERVAL_MS = 3 * 60 * 1000;
let _detectedNewVersion = null;

function startVersionCheck() {
  setTimeout(checkForNewVersion, VERSION_CHECK_INTERVAL_MS);
}

async function checkForNewVersion() {
  try {
    const res = await fetch('version.json?_=' + Date.now());
    if (!res.ok) return;
    const data = await res.json();
    if (data.version && data.version !== GAME_VERSION) {
      _detectedNewVersion = data.version;
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
  if (_detectedNewVersion) {
    sessionStorage.setItem('justUpdated', _detectedNewVersion);
  }
  saveGame();
  location.reload();
}
