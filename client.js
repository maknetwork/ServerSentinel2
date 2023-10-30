const SERVER_URL = "http://150.230.167.182:8080/updateLastCall"; // Replace with your server URL

function updateLastCall() {
  fetch(SERVER_URL, {
    method: "GET",
    headers: {
      Authorization: "YOUR_AUTH_TOKEN", // Replace with your authorization token if required
    },
  })
    .then((response) => response.json())
    .then((data) => {
      console.log("Response from server:", data);
    })
    .catch((error) => {
      console.error("Error updating last call:", error);
    });
}

// Call the function initially
updateLastCall();

// Set an interval to call the function every 5 minutes
setInterval(updateLastCall, 5 * 60 * 1000);
