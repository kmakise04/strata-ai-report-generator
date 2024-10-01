<?php
// Include your database configuration
require "config.php";

// Set the response header to JSON
header('Content-Type: application/json');

// Check if the required query parameters are provided
$userId = $_GET['userId'] ?? null;
$unitId = $_GET['unitId'] ?? null;
$questionId = $_GET['questionId'] ?? null; // New parameter for question ID

// Validate required fields
if (!$userId || !$unitId) {
    echo json_encode(['error' => 'Missing required fields']);
    exit;
}

// Prepare the SQL query to fetch notes based on userId, unitId, and optional questionId
$query = "
    SELECT 
        notes.id, 
        notes.user_id, 
        notes.unit_id, 
        notes.question_id, 
        notes.note_content, 
        notes.created_at, 
        notes.updated_at,
        users.fname, 
        users.lname 
    FROM notes
    JOIN users ON notes.user_id = users.id
    WHERE notes.user_id = ? 
    AND notes.unit_id = ? 
    AND notes.deleted_at IS NULL
";
if ($questionId) {
    $query .= " AND notes.question_id = ?";
}

$stmt = $mysqli->prepare($query);

// Check if the SQL statement preparation was successful
if ($stmt) {
    // Bind the parameters to the SQL query
    if ($questionId) {
        $stmt->bind_param("iii", $userId, $unitId, $questionId); // For when questionId is provided
    } else {
        $stmt->bind_param("ii", $userId, $unitId); // Without questionId
    }

    // Execute the query
    $stmt->execute();

    // Fetch the result
    $result = $stmt->get_result();

    // Check if there are any notes
    if ($result->num_rows > 0) {
        $notes = [];

        // Fetch all notes into an array
        while ($row = $result->fetch_assoc()) {
            $notes[] = $row;
        }

        // Return the notes as JSON
        echo json_encode(['success' => true, 'notes' => $notes]);
    } else {
        // Return a message if no notes are found
        echo json_encode(['success' => true, 'notes' => [], 'message' => 'No notes found']);
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
