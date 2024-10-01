<?php
require 'config.php';

function generateReportToken($userId, $reportId, $expiryMinutes) {
    $secretKey = 'your-secret-key';
    $issuedAt = time();
    $expiresAt = $issuedAt + ($expiryMinutes * 60);
    $tokenPayload = base64_encode(json_encode([
        'userId' => $userId,
        'reportId' => $reportId,
        'iat' => $issuedAt,
        'exp' => $expiresAt
    ]));
    $tokenSignature = hash_hmac('sha256', $tokenPayload, $secretKey);
    return $tokenPayload . '.' . $tokenSignature;
}

function generateRandomCode($length = 8) {
    return bin2hex(random_bytes($length / 2)); // Generates a random code of the specified length
}

// Get the JSON payload from the AJAX request
$json = file_get_contents('php://input');
$data = json_decode($json, true);

$userId = $data['userId'];
$reportId = $data['reportId'];
$expiryMinutes = $data['expiryMinutes'];  // Default to 1440 for 24 hours

// Generate the token
$token = generateReportToken($userId, $reportId, $expiryMinutes);

// Generate a random code
$randomCode = generateRandomCode(8); // Length of 8 characters

// Calculate the expiration time as a datetime string
$expiresAt = date('Y-m-d H:i:s', time() + ($expiryMinutes * 60));

// Insert the token and code into the database
$stmt = $mysqli->prepare("INSERT INTO report_tokens (token, report_id, user_id, expires_at, code) VALUES (?, ?, ?, ?, ?)");
if ($stmt) {
    $stmt->bind_param("siiss", $token, $reportId, $userId, $expiresAt, $randomCode);

    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'token' => $token, 'code' => $randomCode]);
    } else {
        echo json_encode(['success' => false, 'error' => 'Failed to store token and code.']);
    }

    $stmt->close();
} else {
    echo json_encode(['success' => false, 'error' => 'Database error: Failed to prepare statement.']);
}

$mysqli->close();
