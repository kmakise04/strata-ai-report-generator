<?php
require 'config.php'; // Include your database configuration

// Get the JSON payload from the AJAX request
$json = file_get_contents('php://input');
$data = json_decode($json, true);

// Extract values from the data
$id = $data['id']; // The user id
$email = $data['email']; // The new email

// Validate the input data (Check if id and email are provided)
if (!isset($id) || !isset($email)) {
    echo json_encode(['success' => false, 'error' => 'ID and Email are required.']);
    exit;
}

// Validate the email format
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['success' => false, 'error' => 'Invalid email format.']);
    exit;
}

// Prepare an SQL statement to update the email based on the user id
$stmt = $mysqli->prepare("UPDATE users SET email = ? WHERE id = ?");
if ($stmt) {
    // Bind the parameters
    $stmt->bind_param("si", $email, $id); // "si" indicates a string for email and an integer for id

    // Execute the statement
    if ($stmt->execute()) {
        if ($stmt->affected_rows > 0) {
            echo json_encode(['success' => true, 'message' => 'Email successfully updated.']);
        } else {
            echo json_encode(['success' => false, 'error' => 'No user found with the provided ID.']);
        }
    } else {
        echo json_encode(['success' => false, 'error' => 'Failed to update the email.']);
    }

    // Close the statement
    $stmt->close();
} else {
    echo json_encode(['success' => false, 'error' => 'Database error: Failed to prepare statement.']);
}

// Close the MySQL connection
$mysqli->close();
?>
