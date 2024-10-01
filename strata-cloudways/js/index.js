let sharedId;

$("#login").on("submit", function (e) {
  e.preventDefault();
  console.log("Login button clicked");
  loginUser(); // Attempt to log in the user
});

$("#signup").on("submit", function (e) {
  e.preventDefault();
  console.log("Signup button clicked");
  registerUser();
});

function checkSessionStatus() {
  console.log("Checking session status...");
  $.get("api/usersession.php", function (data) {
    if (data.success) {
      let user_id = data.user_id;
      let redirectUrl = "/user/home/index.html";

      // Redirect to home page
      window.location.href = redirectUrl;

    } else {
      console.log("Session not active");
      notify("Session not active");
    }
  }).fail(function() {
    console.error("Session status check failed");
    notify("Unable to check session status. Please try again.");
  });
}

function loginUser() {
  let username = $("#username").val();
  let password = $("#password").val();

  completeLogin(username, password); // Proceed with normal login
}

function completeLogin(username, password) {
  console.log("Attempting login for", username); // Log username at login attempt
  $.ajax({
    url: "api/userlogin.php",
    type: "POST",
    contentType: "application/json",
    data: JSON.stringify({
      username: username,
      password: password,
    }),
    dataType: "json",
    success: function (data) {
      if (data.success) {
        console.log("Login successful", data.username); // Consider safety and privacy when logging user data
        
        notify("Login successful");

        // After successful login, check the session and handle the shared report
        checkSessionStatus();
        
      } else if (data.error) {
        console.log("Login failed: " + data.error);
        notify("Login failed: " + data.error);
      }
    },
    error: function (jqXHR, textStatus, errorThrown) {
      console.error("Login request failed: " + textStatus + ", " + errorThrown);
      notify("An error occurred during the login process. Please try again.");
    },
  });
}
