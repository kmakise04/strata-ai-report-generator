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
$noteId = $data['noteId'] ?? null;
$userId = $data['userId'] ?? null;
$questionId = $data['questionId'] ?? null;
$noteContent = $data['note_content'] ?? '';  // Expecting note_content

// Validate required fields
if (!$noteId || !$userId || !$questionId || empty($noteContent)) {
    echo json_encode(['error' => 'Missing required fields']);
    exit;
}

// Prepare the SQL query to update the note in the database
$query = "UPDATE notes SET note_content = ?, updated_at = NOW() WHERE id = ? AND user_id = ? AND question_id = ?";
$stmt = $mysqli->prepare($query);

// Check if the SQL statement preparation was successful
if ($stmt) {
    // Bind the parameters to the SQL query
    $stmt->bind_param("siis", $noteContent, $noteId, $userId, $questionId);

    // Execute the query and check if it was successful
    if ($stmt->execute()) {
        if ($stmt->affected_rows > 0) {
            echo json_encode(['success' => true, 'message' => 'Note updated successfully']);
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
