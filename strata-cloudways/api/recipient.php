<?php

require 'config.php';

function updateSharedReport($sharedId, $recipient_id) {
    global $mysqli;

    // Prepare the SQL statement to update recipient_id and set accessed_at to the current date
    $stmt = $mysqli->prepare("UPDATE shared_reports SET recipient_id = ?, accessed_at = NOW() WHERE id = ?");
    
    if (!$stmt) {
        return ['success' => false, 'message' => 'Database error: unable to prepare statement'];
    }

    $stmt->bind_param("ii", $recipient_id, $sharedId);
    $result = $stmt->execute();

    if ($result) {
        return ['success' => true, 'message' => 'Recipient and accessed_at updated successfully'];
    } else {
        return ['success' => false, 'message' => 'Failed to update recipient and accessed_at', 'error' => $mysqli->error];
    }
}

// Get data from the request
$json = file_get_contents('php://input');
$data = json_decode($json, true);

$sharedId = $data['sharedId'] ?? null;
$recipient_id = $data['recipient_id'] ?? null;

// Ensure sharedId and recipient_id are provided
if ($sharedId === null || $recipient_id === null) {
    $response = ['success' => false, 'message' => 'Missing required parameters: sharedId or recipient_id'];
} else {
    // Update the shared report entry
    $response = updateSharedReport($sharedId, $recipient_id);
}

// Return the operation result as JSON
header('Content-Type: application/json');
echo json_encode($response);

?>
