const input = document.getElementById("searchInput");
const output = document.getElementById("output");

const commands = ["help"]; // stuff later

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
    output.innerHTML = "list of commands:";
    output.innerHTML = "enable tile";
  }
  if (cmd === "enable tile") {
    output.innerHTML = "decorate.";
    // okay, I don't know how to do that
  }
}

function showQuote(text) {
  const line = document.createElement("div");
  line.innerHTML = `<i>"${text}"</i>`
  output.appendChild(line);
}
