const input = document.getElementById("searchInput");
const output = document.getElementById("output");

const commands = ["help", "enable tile", "disable tile"]; // stuff later

input.addEventListener("keydown", (e) => {
  if(e.key === "Enter") {
    const value = input.value.trim();
    const lower = value.toLowerCase();

    if(commands.includes(lower)) {
      handleCommand(lower);
    } else {
      showQuote(value);
    }

    input.value = "";
  }
});

function handleCommand(cmd) {
  if (cmd === "help") {
    output.innerHTML = 
      "commands:<br>" +
      "help<br>" +
      "enable tile<br>" +
      "disable tile<br>";
  }
  if (cmd === "enable tile") {
    output.innerHTML = "decorate.";
    document.getElementById("draggable").style.display = "block";
  }
  if (cmd === "disable tile") {
    output.innerHTML = "okay fine. be that way"
    document.getElementById("draggable").style.display = "none";
  }
}

function showQuote(text) {
  const line = document.createElement("div");
  line.innerHTML = `<i>"${text}"</i>`
  output.appendChild(line);
}
