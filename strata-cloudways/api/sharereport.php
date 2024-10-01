<?php
session_start();  // Start the session if not already started
require 'config.php';  // Include your database connection setup

header('Content-Type: application/json');  // Set correct header for JSON response

// Check if user is logged in and the required POST data is available
if (isset($_SESSION['user_id']) && isset($_POST['report_id'])) {
    $sharedBy = $_SESSION['user_id'];  // Renamed to reflect shared_by
    $reportId = $_POST['report_id'];
    $expiryMinutes = isset($_POST['expiryMinutes']) ? (int)$_POST['expiryMinutes'] : 1440;  // Default to 1440 minutes (24 hours)

    // Use the random code as the token
    $token = generateRandomCode(16);  // Generate a 16-character random code to be used as the token
    $issuedAt = time();
    $expiresAt = date('Y-m-d H:i:s', $issuedAt + ($expiryMinutes * 60));

    // Insert the token into the shared_reports table
    $stmt = $mysqli->prepare("INSERT INTO shared_reports (report_id, shared_by, token, expires_at) VALUES (?, ?, ?, ?)");
    if ($stmt) {
        $stmt->bind_param("iiss", $reportId, $sharedBy, $token, $expiresAt);

        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'token' => $token, 'expires_at' => $expiresAt]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to store token.']);
        }

        $stmt->close();
    } else {
        echo json_encode(['success' => false, 'message' => 'Database error: Failed to prepare statement.']);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Unauthorized or incomplete request.']);
}

$mysqli->close();

// Random code generation function
function generateRandomCode($length = 16) {
    return bin2hex(random_bytes($length / 2));  // Generates a random code of the specified length
}
?>
