<?php
// Include your database configuration
require "config.php"; // Assuming you have a config.php with DB connection

// Set the response header to JSON
header('Content-Type: application/json');

// Get the `id` from the query parameter
$userId = $_GET['id'] ?? null;

// Validate the required field
if (!$userId) {
    echo json_encode(['error' => 'Missing required field: id']);
    exit;
}

// Prepare the SQL query to fetch user based on `id`
$query = "
    SELECT 
        id, 
        fname, 
        lname, 
        username, 
        email, 
        level 
    FROM users
    WHERE id = ?
";

// Prepare the SQL statement
$stmt = $mysqli->prepare($query);

// Check if the SQL statement preparation was successful
if ($stmt) {
    // Bind the `id` parameter to the SQL query
    $stmt->bind_param("i", $userId);

    // Execute the query
    $stmt->execute();

    // Fetch the result
    $result = $stmt->get_result();

    // Check if the user exists
    if ($result->num_rows > 0) {
        // Fetch the user data
        $user = $result->fetch_assoc();

        // Return the user data as JSON
        echo json_encode(['success' => true, 'user' => $user]);
    } else {
        // Return a message if no user is found
        echo json_encode(['success' => false, 'message' => 'User not found']);
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
