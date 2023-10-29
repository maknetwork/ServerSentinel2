const express = require("express");
const cors = require("cors");
const moment = require("moment"); // Added this line

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
  res.send(`
      <html>
        <head>
          <title>Server Sentinel</title>
          <style>
            body {
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
            }
            h1 {
              font-size: 3em;
            }
          </style>
        </head>
        <body>
          <h1>Server Sentinel</h1>
        </body>
      </html>
    `);
});
function checkServerStatus() {
  const currentTime = new Date();
  const timeDifference = currentTime - lastCall;

  if (timeDifference > 10 * 1000 && !notificationSent) {
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
    }, 60 * 60 * 1000); // Repeat every hour
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

setInterval(checkServerStatus, 11 * 1000); // Check server status every 1 second

app.get("/updateLastCall", (req, res) => {
  const token = req.headers.authorization;

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
