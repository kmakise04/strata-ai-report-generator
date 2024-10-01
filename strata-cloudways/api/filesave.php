<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
require "config.php";

$json = file_get_contents('php://input');
$data = json_decode($json, true); // Decode as an associative array

// Log the raw JSON data for debugging
error_log("Received JSON: " . $json);

// Check for JSON decoding errors
if (json_last_error() !== JSON_ERROR_NONE) {
    error_log("JSON Decode Error: " . json_last_error_msg());
    echo json_encode(['error' => 'Invalid JSON']);
    exit;
}

// Retrieve data from the decoded JSON
$filename = $data['filename'] ?? '';
$page = $data['page'] ?? '';
$resourceId = $data['resourceId'] ?? '';

// Debugging: Log the received data to a file or error log
error_log(print_r($data, true));

// Check for required fields
$missingFields = [];
if (!$filename) {
    $missingFields[] = 'filename';
}
if (!$page) {
    $missingFields[] = 'page';
}
if (!$resourceId) {
    $missingFields[] = 'resourceId';
}

if (!empty($missingFields)) {
    error_log('Missing fields: ' . implode(', ', $missingFields));
    echo json_encode(['error' => 'All fields are required', 'missing' => $missingFields]);
    exit;
}

// Assuming $mysqli is already created and connected to your database
$query = "INSERT INTO resource (filename, page, resourceId) VALUES (?, ?, ?)";
$stmt = $mysqli->prepare($query);

if ($stmt) {
    $stmt->bind_param("sii", $filename, $page, $resourceId);
    if ($stmt->execute()) {
        echo json_encode(['success' => 'Resource saved successfully']);
    } else {
        error_log('MySQL execute error: ' . $stmt->error);
        echo json_encode(['error' => 'Resource saving failed', 'sql_error' => $stmt->error]);
    }
    $stmt->close();
} else {
    error_log('MySQL prepare error: ' . $mysqli->error);
    echo json_encode(['error' => 'Error preparing statement', 'sql_error' => $mysqli->error]);
}

$mysqli->close();
?>