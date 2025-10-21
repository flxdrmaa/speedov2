document.addEventListener('DOMContentLoaded', () => {
  // === DEFINISI SEMUA ELEMEN ===
  const els = {
    health: document.getElementById('health-bar'), fuel: document.getElementById('fuel-bar'),
    healthPercent: document.getElementById('health-percent'), fuelPercent: document.getElementById('fuel-percent'),
    speed: document.getElementById('speed-display'), gear: document.getElementById('gear-display'),
    unit: document.getElementById('speed-unit'), rpm: document.getElementById('rpm-boxes'),
    icons: { engine: document.getElementById('icon-engine'), lights: document.getElementById('icon-lights'), left: document.getElementById('icon-left'), right: document.getElementById('icon-right'), seatbelt: document.getElementById('icon-seatbelt') },
    audio: { tick: document.getElementById('audio-tick'), alarm: document.getElementById('audio-alarm') },
    ipad: {
        launcher: document.getElementById('head-unit-launcher'),
        root: document.getElementById('ipad-root'),
        closeBtn: document.getElementById('ipad-close-button'),
        appIcons: document.querySelectorAll('.app-icon'),
        appView: document.getElementById('app-view'),
        appViewTitle: document.getElementById('app-view-title'),
        appHomeButton: document.getElementById('app-home-button'),
        appIframe: document.getElementById('app-iframe'),
        gpsView: document.getElementById('gps-content-view'),
        gpsMarker: document.getElementById('player-marker'),
        waypointContainer: document.getElementById('waypoint-container'),
        musicView: document.getElementById('music-content-view'),
        calculatorView: document.getElementById('calculator-content-view'),
    }
  };
  
  const vehicleState = { engineOn: false, hasMoved: false };

  // ===================================================================
  // BAGIAN I: FUNGSI-FUNGSI INTI SPEEDOMETER
  // ===================================================================
  if (els.rpm) { for (let i = 0; i < 10; i++) { const box = document.createElement('div'); box.className = 'rpm-box'; els.rpm.appendChild(box); } const rpmBoxes = Array.from(els.rpm.children); window.setRPM = (rpm) => { const active = Math.round(Math.max(0, Math.min(1, rpm)) * 10); rpmBoxes.forEach((box, i) => box.classList.toggle('on', i < active)); }; } else { window.setRPM = () => {}; }
  window.setSpeed = (speed) => { if (!els.speed) return; const val = Math.round(Math.max(0, speed * 2.23694)); els.speed.textContent = val; if (val > 0) { vehicleState.hasMoved = true; } };
  window.setGear = (gear) => { if (!els.gear) return; let gearText; if (!vehicleState.engineOn) { gearText = 'N'; } else { if (gear > 0) { gearText = gear; } else if (gear === 0 && vehicleState.hasMoved) { gearText = 'R'; } else { gearText = 'N'; } } const upperGear = String(gearText).toUpperCase(); els.gear.textContent = upperGear; els.gear.classList.toggle('gear-reverse', upperGear === 'R'); };
  window.setFuel = (val) => { if (!els.fuel || !els.fuelPercent) return; const p = Math.max(0, Math.min(1, val)); els.fuel.style.transform = `translateY(${100 - p * 100}%)`; els.fuelPercent.textContent = Math.round(p * 100) + '%'; };
  window.setHealth = (val) => { if (!els.health || !els.healthPercent) return; const p = Math.max(0, Math.min(1, val)); els.health.style.transform = `translateY(${100 - p * 100}%)`; els.healthPercent.textContent = Math.round(p * 100) + '%'; };
  const toggleIcon = (id, state) => { if (els.icons[id]) { els.icons[id].classList.toggle('active', !!state); } };
  const manageLoopingAudio = (audioEl, shouldPlay) => { if (!audioEl) return; if (shouldPlay && audioEl.paused) { audioEl.play().catch(e => {}); } else if (!shouldPlay && !audioEl.paused) { audioEl.pause(); audioEl.currentTime = 0; } };
  window.setEngine = (on) => { const newState = !!on; if (vehicleState.engineOn === newState) return; vehicleState.engineOn = newState; toggleIcon('engine', vehicleState.engineOn); if (!newState) { vehicleState.hasMoved = false; window.setGear('N'); } else { window.setGear(0); } };
  window.setSeatbelts = (isBuckled) => { toggleIcon('seatbelt', !!isBuckled); };
  window.setHeadlights = (level) => { const lights = els.icons.lights; if (!lights) return; lights.classList.remove('low-beam', 'high-beam'); if (level === 1) { lights.classList.add('low-beam'); } else if (level === 2) { lights.classList.add('high-beam'); } };
  const updateIndicatorSound = () => { if (!els.icons.left || !els.icons.right) return; const leftOn = els.icons.left.classList.contains('active'); const rightOn = els.icons.right.classList.contains('active'); manageLoopingAudio(els.audio.tick, leftOn || rightOn); };
  window.setLeftIndicator = (on) => { toggleIcon('left', on); updateIndicatorSound(); };
  window.setRightIndicator = (on) => { toggleIcon('right', on); updateIndicatorSound(); };
  
  // ===================================================================
  // BAGIAN II: LOGIKA HEAD UNIT & APLIKASI KUSTOM
  // ===================================================================
  const musicPlayer = { audio: new Audio(), playlistEl: document.getElementById('music-playlist'), titleEl: document.getElementById('music-title'), artistEl: document.getElementById('music-artist'), albumArtEl: document.getElementById('music-album-art'), playPauseBtn: document.getElementById('music-play-pause'), playIcon: els.ipad.musicView.querySelector('.play-icon'), pauseIcon: els.ipad.musicView.querySelector('.pause-icon'), currentIndex: -1, isPlaying: false,
      playlist: [
          { artist: 'Nightride FM', title: 'Synthwave', url: 'https://stream.nightride.fm/nightride.mp3', art: 'https://i.imgur.com/qL3aHbr.jpeg' },
          { artist: 'Radio Paradise', title: 'Eclectic Rock', url: 'http://stream.radioparadise.com/flacm', art: 'https://i.imgur.com/vDe24Jb.jpeg' },
          { artist: 'Lofi Girl', title: 'Beats to Relax', url: 'https://stream.dar.fm/26331', art: 'https://i.imgur.com/D3a2s1d.png' },
      ],
      init() { this.playlist.forEach((t, i) => { const li = document.createElement('li'); li.className = 'playlist-item'; li.textContent = `${t.artist} - ${t.title}`; li.onclick = () => this.playTrack(i); this.playlistEl.appendChild(li); }); this.playPauseBtn.onclick = () => this.togglePlayPause(); document.getElementById('music-next').onclick = () => this.nextTrack(); document.getElementById('music-prev').onclick = () => this.prevTrack(); },
      playTrack(i) { this.currentIndex = i; const t = this.playlist[i]; this.audio.src = t.url; this.audio.play(); this.isPlaying = true; this.updateUI(); },
      togglePlayPause() { if (this.isPlaying) { this.audio.pause(); } else if (this.currentIndex !== -1) { this.audio.play(); } this.isPlaying = !this.isPlaying; this.updateUI(); },
      nextTrack() { this.playTrack((this.currentIndex + 1) % this.playlist.length); },
      prevTrack() { this.playTrack((this.currentIndex - 1 + this.playlist.length) % this.playlist.length); },
      stop() { this.audio.pause(); this.audio.src = ""; this.isPlaying = false; this.updateUI(); },
      updateUI() { this.playIcon.style.display = this.isPlaying ? 'none' : 'block'; this.pauseIcon.style.display = this.isPlaying ? 'block' : 'none'; if (this.currentIndex !== -1) { const t = this.playlist[this.currentIndex]; this.titleEl.textContent = t.title; this.artistEl.textContent = t.artist; this.albumArtEl.src = t.art; Array.from(this.playlistEl.children).forEach((item, i) => item.classList.toggle('playing', i === this.currentIndex)); } }
  };
  musicPlayer.init();

  const calcDisplay = document.getElementById('calc-display');
  document.querySelectorAll('.calc-btn').forEach(b => { b.addEventListener('click', () => { const v = b.textContent; if (v === 'AC') { calcDisplay.textContent = '0'; } else if (v === '=') { try { calcDisplay.textContent = eval(calcDisplay.textContent.replace(/[^-()\d/*+.]/g, '')); } catch { calcDisplay.textContent = 'Error'; } } else if(v==='+/-'){ calcDisplay.textContent = parseFloat(calcDisplay.textContent) * -1; } else if (calcDisplay.textContent === '0' && v !== '.') { calcDisplay.textContent = v; } else { calcDisplay.textContent += v; } }); });

  function openApp(appName, appUrl = null) {
    const { appView, appViewTitle, appIframe, gpsView, musicView, calculatorView } = els.ipad;
    appViewTitle.textContent = appName;
    const allViews = [appIframe, gpsView, musicView, calculatorView];
    allViews.forEach(v => v.classList.remove('active'));
    
    switch (appName) {
        case 'GPS': gpsView.classList.add('active'); break;
        case 'Musik': musicView.classList.add('active'); break;
        case 'Kalkulator': calculatorView.classList.add('active'); break;
        default: if (appUrl) { appIframe.src = appUrl; appIframe.classList.add('active'); } break;
    }
    appView.classList.add('open');
  }

  function closeApp() {
    els.ipad.appView.classList.remove('open');
    musicPlayer.stop();
    setTimeout(() => { els.ipad.appIframe.src = 'about:blank'; }, 350);
  }

  els.ipad.appIcons.forEach(icon => { icon.addEventListener('click', () => { openApp(icon.dataset.appName, icon.dataset.appUrl); }); });
  els.ipad.appHomeButton.addEventListener('click', closeApp);
  els.ipad.launcher.addEventListener('click', () => window.toggleHeadUnit(true));
  els.ipad.closeBtn.addEventListener('click', () => window.toggleHeadUnit(false));
  
  // ===================================================================
  // BAGIAN III: API UNTUK RAGEMP (FUNGSI GLOBAL)
  // ===================================================================
  window.toggleHeadUnit = (show) => {
    const isVisible = els.ipad.root.classList.contains('visible');
    const action = typeof show === 'boolean' ? show : !isVisible;
    els.ipad.root.classList.toggle('visible', action);
    if (!action) { closeApp(); }
    if (typeof mp !== 'undefined') { mp.trigger('hud:toggleCursor', action); }
  };

  const MAP_BOUNDS = { minX: -4000, maxX: 4000, minY: -4000, maxY: 4000 };
  window.updateGps = (playerX, playerY, heading) => {
      if (!els.ipad.gpsMarker) return;
      const percentX = (playerX - MAP_BOUNDS.minX) / (MAP_BOUNDS.maxX - MAP_BOUNDS.minX) * 100;
      const percentY = (MAP_BOUNDS.maxY - playerY) / (MAP_BOUNDS.maxY - MAP_BOUNDS.minY) * 100;
      const clampedX = Math.max(0, Math.min(100, percentX));
      const clampedY = Math.max(0, Math.min(100, percentY));
      els.ipad.gpsMarker.style.left = `${clampedX}%`;
      els.ipad.gpsMarker.style.top = `${clampedY}%`;
      els.ipad.gpsMarker.querySelector('img').style.transform = `rotate(${heading}deg)`;
  };

  window.setServerWaypoints = (waypoints) => {
    const container = els.ipad.waypointContainer;
    if (!container) return;
    container.innerHTML = '';
    if (!Array.isArray(waypoints)) return;
    waypoints.forEach(wp => {
      const percentX = (wp.x - MAP_BOUNDS.minX) / (MAP_BOUNDS.maxX - MAP_BOUNDS.minX) * 100;
      const percentY = (MAP_BOUNDS.maxY - wp.y) / (MAP_BOUNDS.maxY - MAP_BOUNDS.minY) * 100;
      const marker = document.createElement('div');
      marker.className = 'waypoint-marker';
      marker.style.left = `${percentX}%`;
      marker.style.top = `${percentY}%`;
      container.appendChild(marker);
    });
  };
});
