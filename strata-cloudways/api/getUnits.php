<?php
require 'config.php'; // Assuming config.php contains the database connection details

// Get the JSON payload from the AJAX request
$json = file_get_contents('php://input');
$data = json_decode($json, true);

// Ensure valid JSON and check if 'id' is set
if ($data === null || !isset($data['id'])) {
    echo json_encode(['success' => false, 'error' => 'Invalid request payload or missing report ID.']);
    exit();
}

$reportId = $data['id'];

// Ensure $mysqli is defined and connected
if (!$mysqli) {
    echo json_encode(['success' => false, 'error' => 'Database connection error.']);
    exit();
}

// Query the database to get address and unit_number based on the provided report_id
$stmt = $mysqli->prepare("SELECT address, unit FROM units WHERE id = ?");
if ($stmt) {
    $stmt->bind_param("i", $reportId);
    
    if ($stmt->execute()) {
        $stmt->bind_result($address, $unitNumber);
        if ($stmt->fetch()) {
            echo json_encode(['success' => true, 'address' => $address, 'unit_number' => $unitNumber]);
        } else {
            echo json_encode(['success' => false, 'error' => 'No unit found for the provided report ID.']);
        }
    } else {
        echo json_encode(['success' => false, 'error' => 'Failed to fetch the unit details.']);
    }

    $stmt->close();
} else {
    echo json_encode(['success' => false, 'error' => 'Database error: Failed to prepare statement.']);
}

$mysqli->close();
