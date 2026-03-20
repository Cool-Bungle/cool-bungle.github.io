const phrases = [
  "guh",
  "wazzup twin",
  "splash text",
  "try typing help in the search bar",
  "i'm gonna kiss you"
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
