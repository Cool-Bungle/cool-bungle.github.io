const phrases = [
  "guh",
  "wazzup",
  "splash text",
  "click me",
];

const datastream = document.getElementById("datastream");

function cycleDataStream() {
  const text = phrases[Math.floor(Math.random() * phrases.length)];

  datastream.textContent = text;
  datastream.style.opacity = 1;

  setTimeout(() => {
    datastream.style.opacity = 0;
  }, 2000);
}

setInterval(cycleDataStream, 4000);
