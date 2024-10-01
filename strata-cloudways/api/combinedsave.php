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

// Assuming $mysqli is already created and connected to your database
$mysqli->begin_transaction();

try {
    foreach ($data as $item) {
        $questionId = $item['questionId'] ?? '';
        $answer = $item['answer'] ?? '';
        $unitId = $item['unitId'] ?? '';
        $sources = $item['sources'] ?? [];

        // Check for required fields
        if (!$questionId || !$answer || !$unitId) {
            throw new Exception('Missing required fields');
        }

        // Insert main content data
        $query = "INSERT INTO contents (questionId, answer, unitId) VALUES (?, ?, ?)";
        $stmt = $mysqli->prepare($query);
        if ($stmt) {
            $stmt->bind_param("ssi", $questionId, $answer, $unitId);
            if (!$stmt->execute()) {
                throw new Exception('Content addition failed: ' . $stmt->error);
            }
            $resourceId = $mysqli->insert_id; // Get the last inserted ID
            $stmt->close();
        } else {
            throw new Exception('Error preparing statement: ' . $mysqli->error);
        }

        // Insert associated file data
        foreach ($sources as $source) {
            $filename = $source['filename'] ?? '';
            $page_number = $source['page_number'] ?? '';
            $context = $source['context'] ?? '';
            $start_offset = $source['start'] ?? '';
            $end_offset = $source['end'] ?? '';
            $bounding_box = $source['box'] ?? '';

            if (!$filename || !$page_number) {
                throw new Exception('Missing file data fields');
            }

            // Encode the bounding box as a JSON string
            $boxJson = $bounding_box ? json_encode($bounding_box) : null;

            $fileQuery = "INSERT INTO resource (filename, page, resourceId, context, start, end, box) VALUES (?, ?, ?, ?, ?, ?, ?)";
            $fileStmt = $mysqli->prepare($fileQuery);
            if ($fileStmt) {
                $fileStmt->bind_param(
                    "siissss",
                    $filename,
                    $page_number,
                    $resourceId,
                    $context,
                    $start_offset,
                    $end_offset,
                    $boxJson // Bind the JSON string
                );
                if (!$fileStmt->execute()) {
                    throw new Exception('Resource saving failed: ' . $fileStmt->error);
                }
                $fileStmt->close();
            } else {
                throw new Exception('Error preparing file statement: ' . $mysqli->error);
            }
        }
    }

    $mysqli->commit();  // Commit the transaction
    echo json_encode(['success' => 'Data saved successfully']);
} catch (Exception $e) {
    $mysqli->rollback();  // Rollback the transaction if any error occurs
    error_log($e->getMessage());
    echo json_encode(['error' => $e->getMessage()]);
}

$mysqli->close();
