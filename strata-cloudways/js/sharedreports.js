function validateToken() {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
  
    if (token) {
      // Validate the token
      $.ajax({
        url: "/api/validate-token.php",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({ token: token }),
        success: function (response) {
          if (response.success) {
            console.log("Token is valid: ", response.message);
            console.log("Session Data: ", response.data);
  
            // Optionally, if you want to fetch session data after validating the token:
            fetchSessionData();
          } else {
            console.log("Invalid token: ", response.message);
            window.location.href = "/index.html";
          }
        },
        error: function () {
          console.log("Token validation failed.");
          window.location.href = "/index.html";
        }
      });
    } else {
      console.log("No token found in URL.");
    }
  }

  validateToken() 
