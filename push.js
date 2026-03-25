    async function send() {
      const message = document.getElementById("msg").value;

      await fetch("https://discord.com/api/webhooks/1486392154401017901/QzclzfTWdNq5E4Sye7MvATf1CFsW5Yno_eenhPM7kvVhYhl03OcJE0xdmXxr4unO0OpC", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ message })
      });

      alert("sent");
    }
