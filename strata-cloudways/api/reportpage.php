<?php

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
$unitId = $data['unitId'] ?? '';

// Debugging: Log the received data to a file or error log
error_log(print_r($data, true));

// Check for required fields
if (!$unitId) {
    error_log('Missing field: unitId');
    echo json_encode(['error' => 'unitId is required']);
    exit;
}

// Assuming $mysqli is already created and connected to your database
$query = "
SELECT 
    u.userId, 
    u.id AS unitId, 
    u.address, 
    u.unit, 
    u.created,
    c.resourceId AS contentResourceId,
    c.answer, 
    c.questionId,
    r.resourceId AS resourceResourceId,
    r.filename,
    r.page
FROM 
    units u
LEFT JOIN 
    contents c ON u.id = c.unitId
LEFT JOIN 
    resource r ON c.resourceId = r.resourceId
WHERE 
    u.id = ?
";
$stmt = $mysqli->prepare($query);

if ($stmt) {
    $stmt->bind_param("i", $unitId);
    if ($stmt->execute()) {
        $result = $stmt->get_result();
        $data = $result->fetch_all(MYSQLI_ASSOC);
        echo json_encode(['success' => true, 'data' => $data]);
    } else {
        error_log('MySQL execute error: ' . $stmt->error);
        echo json_encode(['error' => 'Failed to retrieve data', 'sql_error' => $stmt->error]);
    }
    $stmt->close();
} else {
    error_log('MySQL prepare error: ' . $mysqli->error);
    echo json_encode(['error' => 'Error preparing statement', 'sql_error' => $mysqli->error]);
}

$mysqli->close();
?>