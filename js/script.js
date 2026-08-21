const content = document.querySelector('.content');
const playImage = content.querySelector('.music-image img');
const musicName = content.querySelector('.music-titles .name');
const musicNumber = content.querySelector('.music-titles .artist');
const audio = document.querySelector('.main-song');
const playButton = content.querySelector('.play-pause');
const playButtonIcon = playButton.querySelector('span');
const previousButton = content.querySelector('#prev');
const nextButton = content.querySelector('#next');
const progress = content.querySelector('.progress-details');
const progressBar = content.querySelector('.progress-bar');
const currentTimeLabel = progress.querySelector('.current');
const finalTimeLabel = progress.querySelector('.final');
const statusMessage = content.querySelector('.status-message');
const displayNumber = content.querySelector('.display-number');
const numberButtons = Array.from(content.querySelectorAll('.number-button'));

let currentTrack = null;
let currentNumber = '';
let numberTimeout;
let isDragging = false;
let shouldAutoplay = false;

window.addEventListener('load', loadInitialTrack);

function setPlayerState(state, message) {
  if (state === 'ready' && content.classList.contains('has-media-error')) {
    state = 'error';
    message = message || statusMessage.textContent || 'ไม่พบภาพประกอบของเสียงบรรยายนี้';
  }
  content.classList.remove('is-loading', 'is-ready', 'is-empty', 'is-error');
  content.classList.add(`is-${state}`);
  content.setAttribute('aria-busy', state === 'loading' ? 'true' : 'false');
  statusMessage.textContent = message || '';

  const noAudio = !audio.getAttribute('src');
  const navigationBlocked = state === 'loading' || state === 'empty';
  playButton.disabled = navigationBlocked || noAudio;
  previousButton.disabled = navigationBlocked;
  nextButton.disabled = navigationBlocked;
  progress.setAttribute('aria-disabled', navigationBlocked || noAudio ? 'true' : 'false');
  numberButtons.forEach((button) => { button.disabled = navigationBlocked; });
}

function handleDataError(error) {
  console.error('Music data error:', error);
  resetPlayback();
  if (error && error.code === 'EMPTY') {
    setPlayerState('empty', 'ยังไม่มีเสียงบรรยายในขณะนี้');
  } else if (error && error.code === 'NO_PLAYABLE_MEDIA') {
    setPlayerState('empty', 'ยังไม่มีไฟล์เสียงบรรยายที่พร้อมใช้งาน');
  } else {
    setPlayerState('error', 'ไม่สามารถโหลดเสียงบรรยายได้ กรุณาลองใหม่');
  }
}

function sortedTracks(data) {
  return data.slice().sort((a, b) => Number(a.music_number) - Number(b.music_number));
}

function loadInitialTrack() {
  setPlayerState('loading', 'กำลังโหลดเสียงบรรยาย...');
  fetchData((error, data) => {
    if (error) {
      handleDataError(error);
      return;
    }
    loadTrack(sortedTracks(data)[0], false);
  });
}

function loadAdjacentTrack(direction) {
  setPlayerState('loading', 'กำลังโหลดเสียงบรรยาย...');
  fetchData((error, data) => {
    if (error) {
      handleDataError(error);
      return;
    }

    const tracks = sortedTracks(data);
    const currentIndex = tracks.findIndex((track) => currentTrack
      && String(track.music_number) === String(currentTrack.music_number));
    const nextIndex = currentIndex < 0
      ? (direction > 0 ? 0 : tracks.length - 1)
      : (currentIndex + direction + tracks.length) % tracks.length;
    loadTrack(tracks[nextIndex], true);
  });
}

function loadTrack(track, autoplay) {
  currentTrack = track;
  shouldAutoplay = autoplay;
  content.classList.remove('has-media-error', 'paused');
  musicName.textContent = ` - ${track.music_name}`;
  musicNumber.textContent = track.music_number;
  playImage.alt = `ภาพประกอบ ${track.music_name}`;
  playImage.src = `images/${track.music_number}/${track.music_img}`;
  audio.src = `music/${track.music_number}/${track.music_audio}`;
  playButtonIcon.textContent = 'play_arrow';
  playButton.setAttribute('aria-label', 'เล่นเสียงบรรยาย');
  resetProgress();
  setPlayerState('loading', 'กำลังเตรียมเสียงบรรยาย...');
  audio.load();
}

function resetPlayback() {
  currentTrack = null;
  shouldAutoplay = false;
  audio.pause();
  audio.removeAttribute('src');
  playImage.removeAttribute('src');
  musicName.textContent = '';
  musicNumber.textContent = '';
  content.classList.remove('paused', 'has-media-error');
  playButtonIcon.textContent = 'play_arrow';
  playButton.setAttribute('aria-label', 'เล่นเสียงบรรยาย');
  resetProgress();
}

function resetProgress() {
  progressBar.style.width = '0%';
  currentTimeLabel.textContent = '0:00';
  finalTimeLabel.textContent = '0:00';
  updateProgressAccessibility(0, 0);
}

async function playSong() {
  if (!audio.getAttribute('src')) return;
  try {
    await audio.play();
    content.classList.add('paused');
    playButtonIcon.textContent = 'pause';
    playButton.setAttribute('aria-label', 'หยุดเสียงบรรยายชั่วคราว');
    setPlayerState('ready', '');
  } catch (error) {
    console.error('Audio playback error:', error);
    pauseSong();
    setPlayerState('error', 'ไม่สามารถเล่นไฟล์เสียงนี้ได้ กรุณาเลือกเสียงบรรยายอื่น');
  }
}

function pauseSong() {
  content.classList.remove('paused');
  playButtonIcon.textContent = 'play_arrow';
  playButton.setAttribute('aria-label', 'เล่นเสียงบรรยาย');
  audio.pause();
}

playButton.addEventListener('click', () => {
  if (content.classList.contains('paused')) pauseSong();
  else playSong();
});

nextButton.addEventListener('click', () => loadAdjacentTrack(1));
previousButton.addEventListener('click', () => loadAdjacentTrack(-1));

playImage.addEventListener('error', () => {
  content.classList.add('has-media-error');
  playImage.alt = 'ไม่พบภาพประกอบเสียงบรรยาย';
  if (!content.classList.contains('is-error')) {
    setPlayerState('error', 'ไม่พบภาพประกอบของเสียงบรรยายนี้');
  }
});

playImage.addEventListener('load', () => content.classList.remove('has-media-error'));

audio.addEventListener('loadedmetadata', () => {
  if (!Number.isFinite(audio.duration)) return;
  finalTimeLabel.textContent = formatTime(audio.duration);
  updateProgressAccessibility(audio.currentTime, audio.duration);
  setPlayerState('ready', '');
  if (shouldAutoplay) {
    shouldAutoplay = false;
    playSong();
  }
});

audio.addEventListener('waiting', () => {
  if (!audio.paused) setPlayerState('loading', 'กำลังโหลดเสียงบรรยาย...');
});

audio.addEventListener('playing', () => setPlayerState('ready', ''));

audio.addEventListener('error', () => {
  pauseSong();
  setPlayerState('error', 'ไม่สามารถโหลดไฟล์เสียงนี้ได้ กรุณาเลือกเสียงบรรยายอื่น');
});

audio.addEventListener('timeupdate', () => {
  if (!Number.isFinite(audio.duration) || audio.duration <= 0) return;
  const percent = Math.min(100, Math.max(0, (audio.currentTime / audio.duration) * 100));
  progressBar.style.width = `${percent}%`;
  currentTimeLabel.textContent = formatTime(audio.currentTime);
  updateProgressAccessibility(audio.currentTime, audio.duration);
});

audio.addEventListener('ended', () => loadAdjacentTrack(1));

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${minutes}:${remainingSeconds}`;
}

function updateProgressAccessibility(current, duration) {
  const percent = duration > 0 ? Math.round((current / duration) * 100) : 0;
  progress.setAttribute('aria-valuenow', String(percent));
  progress.setAttribute('aria-valuetext', `${formatTime(current)} จาก ${formatTime(duration)}`);
}

function seekFromClientX(clientX) {
  if (!Number.isFinite(audio.duration) || audio.duration <= 0) return;
  const bounds = progress.getBoundingClientRect();
  const ratio = Math.min(1, Math.max(0, (clientX - bounds.left) / bounds.width));
  audio.currentTime = ratio * audio.duration;
}

progress.addEventListener('pointerdown', (event) => {
  if (progress.getAttribute('aria-disabled') === 'true') return;
  isDragging = true;
  progress.classList.add('is-dragging');
  progress.setPointerCapture(event.pointerId);
  seekFromClientX(event.clientX);
});

progress.addEventListener('pointermove', (event) => {
  if (isDragging) seekFromClientX(event.clientX);
});

progress.addEventListener('pointerup', (event) => {
  isDragging = false;
  progress.classList.remove('is-dragging');
  if (progress.hasPointerCapture(event.pointerId)) progress.releasePointerCapture(event.pointerId);
});

progress.addEventListener('keydown', (event) => {
  if (!Number.isFinite(audio.duration) || audio.duration <= 0) return;
  let newTime = audio.currentTime;
  if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') newTime -= 5;
  else if (event.key === 'ArrowRight' || event.key === 'ArrowUp') newTime += 5;
  else if (event.key === 'Home') newTime = 0;
  else if (event.key === 'End') newTime = audio.duration;
  else return;
  event.preventDefault();
  audio.currentTime = Math.min(audio.duration, Math.max(0, newTime));
});

numberButtons.forEach((button) => {
  button.addEventListener('click', () => {
    currentNumber += button.dataset.number;
    displayNumber.textContent = currentNumber;
    clearTimeout(numberTimeout);
    numberTimeout = setTimeout(playSongByNumber, 3000);
  });
});

function playSongByNumber() {
  setPlayerState('loading', 'กำลังค้นหาเสียงบรรยาย...');
  fetchData((error, data) => {
    if (error) {
      handleDataError(error);
      clearNumberEntry();
      return;
    }

    const track = data.find((item) => String(item.music_number) === currentNumber);
    if (track) {
      clearNumberEntry();
      loadTrack(track, true);
    } else {
      displayNumber.textContent = 'ไม่มีเสียงบรรยายหมายเลขนี้';
      currentNumber = '';
      setPlayerState('ready', '');
    }
  });
}

function clearNumberEntry() {
  currentNumber = '';
  displayNumber.innerHTML = '&nbsp;';
}
