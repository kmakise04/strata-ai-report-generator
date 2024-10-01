let username = "";
let fname = "";
let lname = "";
let imgUrl = "";
let userId;

function fetchSessionData() {
  // Directly fetch the session data without token validation
  getSessionData();
}

function getSessionData() {
  $.ajax({
    url: "/api/usersession.php",
    type: "GET",
    dataType: "json",
    success: function (response) {
      if (response.success) {
        console.log("Session Active: ", response.message);
        console.log("User Session: ", response.data);
        userId = response.data.user_id;
        username = response.data.username;
        fname = response.data.fname;
        lname = response.data.lname;
        email = response.data.email;
        imgUrl = response.data.img_url;

        // Initialize report view or other page functions
        if (typeof initializeReport === "function") {
          initializeReport();
        }
      } else {
        window.location.href = "/index.html";
      }
    },
    error: function () {
      console.log("AJAX Error fetching session data.");
      window.location.href = "/index.html";
    }
  });
}

// Directly call the session data fetching function on page load
fetchSessionData();
