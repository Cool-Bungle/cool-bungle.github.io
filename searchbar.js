const input = document.getElementById("searchInput");
const output = document.getElementById("output");

const commands = [help]; // stuff later

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
    output.innerHTML = "That's the only command";
  }
}

function showQuote(text) {
  const line = document.createElement("div");
  line.innerHTML = '<i>"${text}"</i>'
  output.appendChild(line);
}
