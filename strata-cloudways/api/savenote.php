<?php
// Include your database configuration
require "config.php";

// Set the response header to JSON
header('Content-Type: application/json');

// Read and decode the incoming JSON request
$json = file_get_contents('php://input');
$data = json_decode($json, true);

// Check for JSON decoding errors
if (json_last_error() !== JSON_ERROR_NONE) {
    echo json_encode(['error' => 'Invalid JSON']);
    exit;
}

// Extract data from the request body
$userId = $data['userId'] ?? null;
$unitId = $data['unitId'] ?? null;
$questionId = $data['questionId'] ?? null;
$noteContent = $data['note'] ?? '';

// Validate required fields
if (!$userId || !$unitId || !$questionId || empty($noteContent)) {
    echo json_encode(['error' => 'Missing required fields']);
    exit;
}

// Prepare the SQL query to insert the note into the database
$query = "INSERT INTO notes (user_id, unit_id, question_id, note_content, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())";
$stmt = $mysqli->prepare($query);

// Check if the SQL statement preparation was successful
if ($stmt) {
    // Bind the parameters to the SQL query
    // Use 's' for questionId as it is not an integer
    $stmt->bind_param("iiss", $userId, $unitId, $questionId, $noteContent);

    // Execute the query and check if it was successful
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Note saved successfully']);
    } else {
        // Log the error and return an error message
        echo json_encode(['error' => 'Failed to save note', 'sql_error' => $stmt->error]);
    }

    // Close the statement
    $stmt->close();
} else {
    // Return an error if the SQL statement preparation failed
    echo json_encode(['error' => 'Failed to prepare SQL statement', 'sql_error' => $mysqli->error]);
}

// Close the database connection
$mysqli->close();
?>
