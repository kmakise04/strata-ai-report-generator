<?php

require 'config.php';

function validateToken($token) {
    global $mysqli;

    // Check if the token exists in the shared_reports table, has not expired, and has not been accessed yet (accessed_at is NULL)
    $stmt = $mysqli->prepare("
        SELECT id, shared_by, report_id, expires_at 
        FROM shared_reports 
        WHERE token = ? 
          AND expires_at > NOW() 
          AND accessed_at IS NULL
    ");
    $stmt->bind_param("s", $token);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        $tokenData = $result->fetch_assoc();
        return ['success' => true, 'message' => 'Token is valid', 'reportData' => $tokenData];
    } else {
        return ['success' => false, 'message' => 'Token is invalid, expired, or already accessed'];
    }
}

// Get token from the request
$json = file_get_contents('php://input');
$data = json_decode($json, true);
$token = $data['token'] ?? '';

// Validate the token
$response = validateToken($token);

// Return the validation result as JSON
header('Content-Type: application/json');
echo json_encode($response);

?>
