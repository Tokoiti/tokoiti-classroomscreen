// Initialise Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBkiEy9vKIBctXX08pyAeru1bWs30Ia8tw",
  authDomain: "tokoiticlassroomscreen.firebaseapp.com",
  databaseURL: "https://tokoiticlassroomscreen-default-rtdb.firebaseio.com",
  projectId: "tokoiticlassroomscreen",
  storageBucket: "tokoiticlassroomscreen.appspot.com",
  messagingSenderId: "332718500502",
  appId: "1:332718500502:web:d644ead3b68c4538e970b7"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const notesRef = db.ref('stickyNotes');

function updateClockAndDate() {
  const now = new Date();
  const clockElement = document.getElementById('clock');
  const dateElement = document.getElementById('date');

  let hours = now.getHours();
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;

  clockElement.textContent = `${hours}:${minutes} ${ampm}`;

  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  dateElement.textContent = now.toLocaleDateString('en-NZ', options);
}

async function updateWeather() {
  try {
    const response = await fetch(`https://api.openweathermap.org/data/2.5/onecall?lat=-46.1213&lon=169.9609&exclude=minutely,daily,alerts&units=metric&appid=27654027f6761d87e2a5143e7733d7c9`);
    const data = await response.json();

    const temp = Math.round(data.current.temp);
    const description = data.current.weather[0].main;
    const uvIndex = Math.round(data.current.uvi);
    const pop = Math.round((data.hourly[0].pop || 0) * 100);

    const weatherElement = document.getElementById('weather');
    weatherElement.textContent = `${temp}°C ${description} - UV ${uvIndex} - ${pop}% rain`;
  } catch (error) {
    console.error('Weather fetch error:', error);
  }
}

function saveNotesToFirebase() {
  const notes = [];
  document.querySelectorAll('.sticky-note-textarea').forEach(textarea => {
    notes.push(textarea.value);
  });
  notesRef.set(notes);
}

function loadNotesFromFirebase() {
  notesRef.on('value', (snapshot) => {
    const notes = snapshot.val() || [];
    document.getElementById('widgets').innerHTML = '';

    notes.forEach(noteText => {
      const noteHTML = `<div><h3>📝 Sticky Note</h3><textarea class="sticky-note-textarea" style="width: 100%; height: 100px;">${noteText}</textarea></div>`;
      createWidget(noteHTML);
    });

    attachNoteListeners();
  });
}

function attachNoteListeners() {
  document.querySelectorAll('.sticky-note-textarea').forEach(textarea => {
    textarea.addEventListener('input', saveNotesToFirebase);
  });
}

document.getElementById('add-widget-button').addEventListener('click', () => {
  const menu = document.getElementById('widget-menu');
  menu.style.display = (menu.style.display === 'none') ? 'flex' : 'none';
});

document.getElementById('clear-notes-button').addEventListener('click', () => {
  if (confirm('Are you sure you want to clear all Sticky Notes?')) {
    notesRef.set([]);
    document.getElementById('widgets').innerHTML = '';
  }
});

function createWidget(contentHTML) {
  const widget = document.createElement('div');
  widget.className = 'widget-card';
  widget.innerHTML = `<button class="widget-close" onclick="this.parentElement.remove()">✖️</button>${contentHTML}`;
  document.getElementById('widgets').appendChild(widget);
}

function addTimer() {
  const timerHTML = `<div><h3>⏰ Timer</h3><input type="number" placeholder="Minutes" style="width: 80px;"><button onclick="startTimer(this)">Start</button><div class="timer-display">00:00</div></div>`;
  createWidget(timerHTML);
}

function startTimer(button) {
  const container = button.parentElement;
  const minutes = container.querySelector('input').value;
  const display = container.querySelector('.timer-display');
  let time = minutes * 60;

  button.disabled = true;
  const interval = setInterval(() => {
    const mins = Math.floor(time / 60);
    const secs = time % 60;
    display.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    if (time <= 0) {
      clearInterval(interval);
      button.disabled = false;
    }
    time--;
  }, 1000);
}

function addStickyNote() {
  const noteHTML = `<div><h3>📝 Sticky Note</h3><textarea class="sticky-note-textarea" style="width: 100%; height: 100px;"></textarea></div>`;
  createWidget(noteHTML);
  attachNoteListeners();
}

function addPoints() {
  const pointsHTML = `<div><h3>🏆 Points Tracker</h3><div class="points-score">0</div><button onclick="changePoints(this, 1)">+1</button><button onclick="changePoints(this, -1)">-1</button></div>`;
  createWidget(pointsHTML);
}

function changePoints(button, amount) {
  const scoreDiv = button.parentElement.querySelector('.points-score');
  let score = parseInt(scoreDiv.textContent, 10);
  score += amount;
  scoreDiv.textContent = score;
}

function addGroupMaker() {
  const groupHTML = `<div><h3>👥 Group Maker</h3><textarea placeholder="Enter names, one per line..." style="width: 100%; height: 100px;"></textarea><button onclick="makeGroups(this)">Make Groups</button><div class="groups-output"></div></div>`;
  createWidget(groupHTML);
}

function makeGroups(button) {
  const container = button.parentElement;
  const textarea = container.querySelector('textarea');
  const output = container.querySelector('.groups-output');

  const names = textarea.value.trim().split('\n').filter(Boolean);
  names.sort(() => 0.5 - Math.random());
  output.innerHTML = `<strong>Group:</strong> ${names.join(', ')}`;
}

async function setupSoundMeter() {
  const soundBarContainer = document.getElementById('sound-meter');

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    const microphone = audioContext.createMediaStreamSource(stream);
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    microphone.connect(analyser);

    function updateSoundBar() {
      analyser.getByteTimeDomainData(dataArray);

      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        const value = (dataArray[i] - 128) / 128;
        sum += value * value;
      }
      const volume = Math.sqrt(sum / dataArray.length);

      const soundBar = document.getElementById('sound-bar');
      const volumeWidth = Math.min(volume * 1000, 100);
      soundBar.style.width = volumeWidth + '%';

      if (volumeWidth < 20) {
        soundBar.style.background = 'green';
      } else if (volumeWidth < 50) {
        soundBar.style.background = 'yellow';
      } else {
        soundBar.style.background = 'red';
      }

      requestAnimationFrame(updateSoundBar);
    }

    updateSoundBar();
  } catch (error) {
    console.error('Microphone access denied or not available.', error);
    soundBarContainer.style.display = 'none';
  }
}

window.addEventListener('load', () => {
  updateClockAndDate();
  setInterval(updateClockAndDate, 1000);

  updateWeather();
  setInterval(updateWeather, 600000);

  loadNotesFromFirebase();
  setupSoundMeter();
});
