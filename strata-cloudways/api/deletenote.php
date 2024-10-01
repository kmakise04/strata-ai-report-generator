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

// Extract data from the request body, making sure the keys match the payload
$noteId = $data['noteId'] ?? null;
$userId = $data['userId'] ?? null;
$questionId = $data['questionId'] ?? null;

// Validate required fields
if (!$noteId || !$userId || !$questionId) {
    echo json_encode(['error' => 'Missing required fields']);
    exit;
}

// Prepare the SQL query to update the deleted_at column in the database
$query = "UPDATE notes SET deleted_at = NOW() WHERE id = ? AND user_id = ? AND question_id = ?";
$stmt = $mysqli->prepare($query);

// Check if the SQL statement preparation was successful
if ($stmt) {
    // Bind the parameters to the SQL query
    $stmt->bind_param("iis", $noteId, $userId, $questionId);

    // Execute the query and check if it was successful
    if ($stmt->execute()) {
        if ($stmt->affected_rows > 0) {
            echo json_encode(['success' => true, 'message' => 'Note deleted successfully']);
        } else {
            echo json_encode(['error' => 'No rows updated. Check if noteId, userId, or questionId are correct.']);
        }
    } else {
        // Log the error and return an error message
        echo json_encode(['error' => 'Failed to update note', 'sql_error' => $stmt->error]);
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
