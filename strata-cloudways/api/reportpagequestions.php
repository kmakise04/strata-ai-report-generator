<?php

require "config.php";

header('Content-Type: application/json');

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Increase memory limit and execution time if necessary
ini_set('memory_limit', '256M');
ini_set('max_execution_time', 300);

$json = file_get_contents('php://input');
$data = json_decode($json, true);
$unitId = $data['unitId'] ?? '';
$limit = $data['limit'] ?? 5;
$offset = $data['offset'] ?? 0;

if (!$unitId) {
    echo json_encode(['error' => 'unitId is required']);
    exit;
}

$query = "
SELECT 
    resourceId, 
    questionId, 
    answer
FROM 
    contents
WHERE 
    unitId = ?
LIMIT ? OFFSET ?
";

$stmt = $mysqli->prepare($query);

if ($stmt) {
    $stmt->bind_param("iii", $unitId, $limit, $offset);
    if ($stmt->execute()) {
        $result = $stmt->get_result();
        $questions = $result->fetch_all(MYSQLI_ASSOC);

        // Process each question to handle long texts and special characters
        foreach ($questions as &$question) {
            // Attempt to convert encoding using mb_convert_encoding with specified source encoding
            $question['answer'] = mb_convert_encoding($question['answer'], 'UTF-8', 'ISO-8859-1');
            if (!$question['answer']) {
                // Fallback: Remove non-printable characters if conversion fails
                $question['answer'] = preg_replace('/[^\x20-\x7E]/', '', $question['answer']);
            }

            // Optional: Split long text into chunks
            if (strlen($question['answer']) > 1000) {
                $question['answer_chunks'] = str_split($question['answer'], 1000);
                unset($question['answer']); // Optionally remove the original long text
            }

            // Optional: Compress content if too large
            // $question['answer'] = base64_encode(gzcompress($question['answer']));
        }

        // Log the fetched data for debugging
        error_log("Fetched questions: " . print_r($questions, true));

        // Encode to JSON with the JSON_UNESCAPED_UNICODE option to handle special characters
        $jsonData = json_encode(['success' => true, 'questions' => $questions], JSON_UNESCAPED_UNICODE);
        if (json_last_error() !== JSON_ERROR_NONE) {
            error_log("JSON Encode Error: " . json_last_error_msg());
            echo json_encode(['error' => 'JSON encoding error']);
        } else {
            echo $jsonData;
        }
    } else {
        // Log any MySQL execution errors
        error_log('MySQL execute error: ' . $stmt->error);
        echo json_encode(['error' => 'Failed to retrieve questions']);
    }
    $stmt->close();
} else {
    // Log any MySQL prepare errors
    error_log('MySQL prepare error: ' . $mysqli->error);
    echo json_encode(['error' => 'Error preparing statement']);
}

$mysqli->close();
?>