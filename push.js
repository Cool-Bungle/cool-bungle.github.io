async function sendMessage(message) {
  try {
    await fetch("https://spring-scene-7a88.carderskaggz.workers.dev", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ message })
    });

    const line = document.createElement("div");
    line.innerHTML = `<span style="color:lightgreen">sent: "${message}"</span>`;
    output.appendChild(line);

  } catch (err) {
    const line = document.createElement("div");
    line.innerHTML = `<span style="color:red">failed to send</span>`;
    output.appendChild(line);
  }
}
