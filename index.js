const express = require("express");
const cors = require("cors");
const moment = require("moment"); // Added this line
require("dotenv").config();

const app = express();
const port = process.env.PORT || 8080;
const tg = {
  token: process.env.TELEGRAM_TOKEN,
  chat_id: process.env.TELEGRAM_CHAT_ID,
};

let lastCall = new Date();
let notificationSent = false;
let offlineInterval = null;

app.use(cors());
app.get("/", (req, res) => {
  const emoji = notificationSent ? "🔴" : "🟢";
  const lastSeen = moment(lastCall).fromNow(); // Calculate last seen time using Moment.js
  const icon = notificationSent
    ? '<i class="fas fa-exclamation-circle text-red-500"></i>'
    : '<i class="fas fa-check-circle text-green-500"></i>';

  res.send(`
  <html>
  <head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Server Sentinel</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
    <style>
      body {
        font-family: 'Orbitron', sans-serif;      }

        </style>

  
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css" rel="stylesheet">

  </head>
  <body class="flex flex-col justify-center items-center h-screen bg-gray-100">
    <div class="text-6xl">${icon}</div>
    <h1 class="text-4xl mb-4">Server Sentinel</h1>
    <p class="text-xl mb-8">Last Seen: ${lastSeen}</p>
  </body>
</html>
    `);
});

function checkServerStatus() {
  const currentTime = new Date();
  const timeDifference = currentTime - lastCall;

  if (timeDifference > 15 * 60 * 1000 && !notificationSent) {
    const formattedDate = moment(lastCall).format("MMMM Do YYYY, h:mm:ss a"); // Format date using Moment.js

    const text = `Server went offline at: ${formattedDate}`;
    sendNotification(text);
    notificationSent = true;
    offlineInterval = setInterval(() => {
      const currentTime = new Date();
      const timeDifference = currentTime - lastCall;
      const hoursPassed = Math.floor(timeDifference / (1000 * 60 * 60));

      if (hoursPassed >= 1) {
        const formattedDate = moment(lastCall).format(
          "MMMM Do YYYY, h:mm:ss a"
        );
        const text = `Server has been offline for more than an hour since: ${formattedDate}`;
        sendNotification(text);
      }
    }, 61 * 60 * 1000); // Repeat every hour
  }
}

async function sendNotification(text) {
  const url = `https://api.telegram.org/bot${tg.token}/sendMessage?chat_id=${tg.chat_id}&text=${text}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Failed to send notification");
    }
    const data = await response.json();
    console.log("Notification sent:", data);
  } catch (error) {
    console.error("Error sending notification:", error);
  }
}

setInterval(checkServerStatus, 16 * 60 * 1000); // Check server status every 1 second

app.get("/updateLastCall", (req, res) => {
  const token = req.headers.authorization;
  console.log("Call Detected");

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  lastCall = new Date();

  if (notificationSent == true) {
    const currentTime = new Date();

    const formattedDate = moment(currentTime).format("MMMM Do YYYY, h:mm:ss a");
    const text = `Server came back online at: ${formattedDate}`;
    sendNotification(text);
    clearInterval(offlineInterval); // Clear the offline interval if server is back online
    offlineInterval = null;
    notificationSent = false;
  }

  res.json({ message: "lastCall = " + lastCall });
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
