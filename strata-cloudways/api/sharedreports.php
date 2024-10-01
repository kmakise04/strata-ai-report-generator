<?php

require "config.php"; // Include your database config

header('Content-Type: application/json');

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Capture the incoming JSON payload
$json = file_get_contents('php://input');
$data = json_decode($json, true);

// Check if 'report_id' and 'user_id' are provided in the request
if (!isset($data['report_id']) || !isset($data['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Missing report_id or user_id']);
    exit;
}

$report_id = $data['report_id'];
$user_id = $data['user_id'];

try {
    // Prepare the SQL query
    $query = "SELECT * FROM report_tokens WHERE report_id = ? AND user_id = ?";

    // Initialize the statement
    if ($stmt = $mysqli->prepare($query)) {
        // Bind the parameters
        $stmt->bind_param("ii", $report_id, $user_id); // i indicates integer type for both parameters

        // Execute the statement
        $stmt->execute();

        // Get the result
        $result = $stmt->get_result();

        // Fetch all results
        $data = $result->fetch_all(MYSQLI_ASSOC);

        // Check if any results were returned
        if ($data) {
            echo json_encode(['success' => true, 'data' => $data]);
        } else {
            echo json_encode(['success' => false, 'message' => 'No records found']);
        }

        // Close the statement
        $stmt->close();
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to prepare the query']);
    }

} catch (Exception $e) {
    // Handle any errors
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}

// Close the connection
$mysqli->close();
