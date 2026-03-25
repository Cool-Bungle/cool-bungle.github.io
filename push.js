window.send = async function () {
  const message = document.getElementById("msg").value;

  await fetch("https://spring-scene-7a88.carderskaggz.workers.dev/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ message: message })
  });

  alert("sent");
};
