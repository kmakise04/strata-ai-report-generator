<?php

require "config.php";

header('Content-Type: application/json');

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

$json = file_get_contents('php://input');
$data = json_decode($json, true);

$resourceId = $data['resourceId'] ?? null;

if (!$resourceId) {
    echo json_encode(['error' => 'resourceId is required']);
    exit;
}

$query = "
SELECT 
    * 
FROM 
    resource
WHERE 
    resourceId = ?
";

$stmt = $mysqli->prepare($query);

if ($stmt) {
    $stmt->bind_param("i", $resourceId);
    if ($stmt->execute()) {
        $result = $stmt->get_result();
        $resources = $result->fetch_all(MYSQLI_ASSOC);

        // Process each resource to handle long texts and special characters
        foreach ($resources as &$resource) {
            // Attempt to convert encoding using mb_convert_encoding with specified source encoding
            $resource['context'] = mb_convert_encoding($resource['context'], 'UTF-8', 'ISO-8859-1');
            if (!$resource['context']) {
                // Fallback: Remove non-printable characters if conversion fails
                $resource['context'] = preg_replace('/[^\x20-\x7E]/', '', $resource['context']);
            }

            // Optional: Split long text into chunks
            if (strlen($resource['context']) > 1000) {
                $resource['context_chunks'] = str_split($resource['context'], 1000);
                unset($resource['context']); // Optionally remove the original long text
            }

            // Optional: Compress content if too large
            // $resource['context'] = base64_encode(gzcompress($resource['context']));
        }

        if ($resources) {
            echo json_encode(['success' => true, 'resources' => $resources], JSON_UNESCAPED_UNICODE);
        } else {
            echo json_encode(['success' => false, 'message' => 'No resources found.']);
        }
    } else {
        // Log MySQL execution error
        error_log('MySQL execute error: ' . $stmt->error);
        echo json_encode(['error' => 'Failed to retrieve resources']);
    }
    $stmt->close();
} else {
    // Log MySQL prepare error
    error_log('MySQL prepare error: ' . $mysqli->error);
    echo json_encode(['error' => 'Error preparing statement']);
}

$mysqli->close();
