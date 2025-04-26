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
const pointsRef = db.ref('pointsTrackers');


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
    const response = await fetch('/api/weather');
    const data = await response.json();

    const temp = data.temp;
    const description = data.description;
    const uvIndex = data.uvIndex;
    const rainForecast = data.rainForecast;
    const icon = data.icon;

    const iconUrl = `https://openweathermap.org/img/wn/${icon}@2x.png`;

    const weatherElement = document.getElementById('weather');
    weatherElement.innerHTML = `
      <img src="${iconUrl}" alt="${description}" style="vertical-align: middle; width: 30px; height: 30px; margin-right: 8px;">
      ${temp}°C ${description} - UV ${uvIndex} - Rain Forecast: ${rainForecast}
    `;
  } catch (error) {
    console.error('Weather fetch error:', error);
    const weatherElement = document.getElementById('weather');
    weatherElement.textContent = `Weather unavailable`;
  }
}
// --- AUTO-UPDATE ---
updateWeather(); // Run once at startup
setInterval(updateWeather, 60000); // Run every minute

interact('.widget')
  .draggable({
    listeners: {
      move(event) {
        const target = event.target;
        const x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
        const y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;

        target.style.transform = `translate(${x}px, ${y}px)`;
        target.setAttribute('data-x', x);
        target.setAttribute('data-y', y);

        saveWidgetStateFirebase(target); // 💾 Save after moving
      }
    }
  })
  .resizable({
    edges: { left: true, right: true, bottom: true, top: true },
    listeners: {
      move(event) {
        let { x, y } = event.target.dataset;

        x = parseFloat(x) || 0;
        y = parseFloat(y) || 0;

        Object.assign(event.target.style, {
          width: `${event.rect.width}px`,
          height: `${event.rect.height}px`,
          transform: `translate(${x + event.deltaRect.left}px, ${y + event.deltaRect.top}px)`
        });

        event.target.dataset.x = x + event.deltaRect.left;
        event.target.dataset.y = y + event.deltaRect.top;

        saveWidgetStateFirebase(event.target); // 💾 Save after resizing
      }
    },
    modifiers: [
      interact.modifiers.restrictSize({
        min: { width: 100, height: 50 },
        max: { width: 800, height: 600 }
      })
    ],
    inertia: true
  });

  function savePointsToFirebase() {
    const points = [];
    document.querySelectorAll('.points-score').forEach(scoreDiv => {
      const container = scoreDiv.closest('.widget');
      const title = container.querySelector('.editable-title') ? container.querySelector('.editable-title').textContent : "Points";
      
      points.push({
        title: title,
        score: parseInt(scoreDiv.textContent, 10)
      });
    });
    pointsRef.set(points);
  }
  
  function loadPointsFromFirebase() {
    pointsRef.on('value', (snapshot) => {
      const points = snapshot.val() || [];
      points.forEach(point => {
        const pointsHTML = `
          <div>
            <h3 contenteditable="true" class="editable-title">${point.title}</h3>
            <div class="points-score">${point.score}</div>
            <button onclick="changePoints(this, 1)">+1</button>
            <button onclick="changePoints(this, -1)">-1</button>
          </div>`;
        createWidget(pointsHTML);
      });
    });
  }
  

  function saveNotesToFirebase() {
    const notes = [];
    document.querySelectorAll('.sticky-note-textarea').forEach(textarea => {
      const container = textarea.closest('.widget');
      const title = container.querySelector('.editable-title') ? container.querySelector('.editable-title').textContent : "Sticky Note";
      const fontSize = textarea.style.fontSize || "16px";
      
      notes.push({
        title: title,
        text: textarea.value,
        fontSize: fontSize
      });
    });
    notesRef.set(notes);
  }
  

  function loadNotesFromFirebase() {
    notesRef.on('value', (snapshot) => {
      const notes = snapshot.val() || [];
      document.getElementById('widgets').innerHTML = '';
  
      notes.forEach(note => {
        const noteHTML = `
          <div>
            <h3 contenteditable="true" class="editable-title">${note.title}</h3>
            <div>
              <button onclick="changeFontSize(this, 1)">🔼</button>
              <button onclick="changeFontSize(this, -1)">🔽</button>
            </div>
            <textarea class="sticky-note-textarea" style="width: 100%; height: 100px; font-size: ${note.fontSize || '16px'};">${note.text}</textarea>
          </div>`;
        createWidget(noteHTML);
      });
  
      attachNoteListeners();
    });
  }
  
function saveWidgetStateFirebase(target) {
  const id = target.id || target.dataset.id;
  if (!id) return; // Skip if no ID

  const widgetData = {
    x: parseFloat(target.getAttribute('data-x')) || 0,
    y: parseFloat(target.getAttribute('data-y')) || 0,
    width: target.style.width || null,
    height: target.style.height || null
  };

  firebase.database().ref('widgetLayout/' + id).set(widgetData);
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
  widget.className = 'widget'; // Important - so interact.js knows it!
  widget.innerHTML = `<button class="widget-close" onclick="this.parentElement.remove()">✖️</button>${contentHTML}`;
  document.getElementById('widgets').appendChild(widget);

  interact(widget) // 💾 Make new widgets draggable/resizable immediately
    .draggable({
      listeners: {
        move(event) {
          const target = event.target;
          const x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
          const y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;

          target.style.transform = `translate(${x}px, ${y}px)`;
          target.setAttribute('data-x', x);
          target.setAttribute('data-y', y);

          saveWidgetStateFirebase(target);
        }
      }
    })
    .resizable({
      edges: { left: true, right: true, bottom: true, top: true },
      listeners: {
        move(event) {
          let { x, y } = event.target.dataset;

          x = parseFloat(x) || 0;
          y = parseFloat(y) || 0;

          Object.assign(event.target.style, {
            width: `${event.rect.width}px`,
            height: `${event.rect.height}px`,
            transform: `translate(${x + event.deltaRect.left}px, ${y + event.deltaRect.top}px)`
          });

          event.target.dataset.x = x + event.deltaRect.left;
          event.target.dataset.y = y + event.deltaRect.top;

          saveWidgetStateFirebase(event.target);
        }
      },
      modifiers: [
        interact.modifiers.restrictSize({
          min: { width: 100, height: 50 },
          max: { width: 800, height: 600 }
        })
      ],
      inertia: true
    });
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
  const noteHTML = `
    <div>
      <h3 contenteditable="true" class="editable-title">📝 Sticky Note</h3>
      <div>
        <button onclick="changeFontSize(this, 1)">🔼</button>
        <button onclick="changeFontSize(this, -1)">🔽</button>
      </div>
      <textarea class="sticky-note-textarea" style="width: 100%; height: 100px; font-size: 16px;"></textarea>
    </div>`;
  createWidget(noteHTML);
  attachNoteListeners();
}


function addPoints() {
  const pointsHTML = `
    <div>
      <h3 contenteditable="true" class="editable-title">🏆 Enter Name</h3>
      <div class="points-score">0</div>
      <button onclick="changePoints(this, 1)">+1</button>
      <button onclick="changePoints(this, -1)">-1</button>
    </div>`;
  createWidget(pointsHTML);
}

function changeFontSize(button, direction) {
  const container = button.closest('div').parentElement;
  const textarea = container.querySelector('textarea');
  const style = window.getComputedStyle(textarea);
  const fontSize = parseFloat(style.fontSize);

  let newFontSize = fontSize + (direction * 2); // 2px bigger/smaller
  newFontSize = Math.max(8, Math.min(newFontSize, 48)); // Limit range

  textarea.style.fontSize = `${newFontSize}px`;
}


function changePoints(button, amount) {
  const scoreDiv = button.parentElement.querySelector('.points-score');
  let score = parseInt(scoreDiv.textContent, 10);
  score += amount;
  scoreDiv.textContent = score;
  savePointsToFirebase();
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

// Sound Meter Setup
async function setupSoundMeter() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });

    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    const microphone = audioContext.createMediaStreamSource(stream);
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    microphone.connect(analyser);

    const soundBar = document.getElementById('sound-bar');
    const soundBarContainer = document.getElementById('sound-meter');

    soundBarContainer.style.display = 'block'; // Make sure it's visible now

    function updateSoundBar() {
      analyser.getByteTimeDomainData(dataArray);

      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        const value = (dataArray[i] - 128) / 128;
        sum += value * value;
      }
      const volume = Math.sqrt(sum / dataArray.length);

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
    document.getElementById('sound-meter').style.display = 'none';
  }
}


window.addEventListener('load', () => {
  updateClockAndDate();
  setInterval(updateClockAndDate, 1000);

  updateWeather();
  setInterval(updateWeather, 600000);

  loadNotesFromFirebase();
  loadPointsFromFirebase();

  document.querySelectorAll('.widget').forEach(widget => {
    loadWidgetStateFirebase(widget);
  });
  
  setupSoundMeter(); // <- Now safely loading after everything else
});

