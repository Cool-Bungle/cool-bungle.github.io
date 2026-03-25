const phrases = [
  "guh",
  "wazzup twin",
  "splash text",
  "this will be relevant later",
  "i'm gonna kiss you",
  "look behind you",
  "you can send a push notification directly to my phone"
];

const datastream = document.getElementById("datastream");

function cycleDataStream() {
  const text = phrases[Math.floor(Math.random() * phrases.length)];

  datastream.textContent = text;
  datastream.style.opacity = 1;

  setTimeout(() => {
    datastream.style.opacity = 0;
  }, 4000);
}

setInterval(cycleDataStream, 6000);
