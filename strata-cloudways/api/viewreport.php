<?php
require 'config.php';

// Get the JSON payload from the AJAX request
$json = file_get_contents('php://input');
$data = json_decode($json, true);

$code = $data['code'];

// Query the database to get token, report_id, and user_id based on the provided code
$stmt = $mysqli->prepare("SELECT token, report_id, user_id FROM report_tokens WHERE code = ?");
if ($stmt) {
    $stmt->bind_param("s", $code);
    
    if ($stmt->execute()) {
        $stmt->bind_result($token, $reportId, $userId);
        if ($stmt->fetch()) {
            echo json_encode(['success' => true, 'token' => $token, 'report_id' => $reportId, 'user_id' => $userId]);
        } else {
            echo json_encode(['success' => false, 'error' => 'No record found for the provided code.']);
        }
    } else {
        echo json_encode(['success' => false, 'error' => 'Failed to fetch the report details.']);
    }

    $stmt->close();
} else {
    echo json_encode(['success' => false, 'error' => 'Database error: Failed to prepare statement.']);
}

$mysqli->close();
