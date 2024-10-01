<?php

require "config.php";

header('Content-Type: application/json');

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Capture the incoming JSON payload
$json = file_get_contents('php://input');
$data = json_decode($json, true);

// Check if required fields are present
$questionId = $data['questionId'] ?? null;
$answer = $data['answer'] ?? null;
$unitId = $data['unitId'] ?? null;

if (!$questionId || !$answer || !$unitId) {
    echo json_encode(['error' => 'questionId, answer, and unitId are required']);
    exit;
}

// Prepare SQL statement to update the answer in the contents table
$query = "
UPDATE 
    contents 
SET 
    answer = ? 
WHERE 
    questionId = ? 
    AND unitId = ?
";

$stmt = $mysqli->prepare($query);

if ($stmt) {
    $stmt->bind_param("sss", $answer, $questionId, $unitId);

    // Execute the query
    if ($stmt->execute()) {
        if ($stmt->affected_rows > 0) {
            // Successful update
            echo json_encode(['success' => true, 'message' => 'Answer updated successfully']);
        } else {
            // No rows were affected (e.g., invalid questionId or unitId)
            echo json_encode(['success' => false, 'message' => 'No rows were updated. Check if questionId and unitId are correct.']);
        }
    } else {
        // Log MySQL execution error
        error_log('MySQL execute error: ' . $stmt->error);
        echo json_encode(['error' => 'Failed to update answer']);
    }

    $stmt->close();
} else {
    // Log MySQL prepare error
    error_log('MySQL prepare error: ' . $mysqli->error);
    echo json_encode(['error' => 'Error preparing statement']);
}

$mysqli->close();
?>
