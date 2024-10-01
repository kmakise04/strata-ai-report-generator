<?php

$api_key = 'MS0xNDcxNDcwODI5Mjk1Mzc4MDM5LUxmQlJteGVnRkVOL2lrZ2RuY0o2TitCVytRcEVHRFRG-au3';
$base_url = 'https://api.au3.cliniko.com/v1/patients';
$webhook_url = 'https://services.leadconnectorhq.com/hooks/NPLiTIcKg7xx4TeVkHHe/webhook-trigger/50635e9c-113a-40f4-8c35-a83668d103b1';

function fetch_patients($api_key, $base_url) {
    $url = $base_url;
    $params = [
        'page' => 1,
        'per_page' => 50, // Adjusted per_page to 50
        'sort' => 'created_at:desc' // Sort by created_at in descending order
    ];

    $headers = [
        'Authorization: Basic ' . base64_encode("$api_key:"),
        'User-Agent: PHP-Client/1.0'
    ];

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url . '?' . http_build_query($params));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

    $response = curl_exec($ch);
    $http_status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($http_status == 200) {
        return json_decode($response, true);
    } else {
        echo "Error fetching patients: $http_status - $response\n";
        return null;
    }
}

function send_webhook($patient, $webhook_url) {
    $phone_numbers = array_map(function($phone) {
        return $phone['number'];
    }, isset($patient['patient_phone_numbers']) ? $patient['patient_phone_numbers'] : []);

    $data = [
        'Name' => $patient['first_name'] . ' ' . $patient['last_name'],
        'Phone' => $phone_numbers,
        'Email' => isset($patient['email']) ? $patient['email'] : null
    ];

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $webhook_url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'User-Agent: PHP-Client/1.0'
    ]);

    $response = curl_exec($ch);
    $http_status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($http_status != 200) {
        echo "Error sending webhook for patient " . $patient['id'] . ": $http_status - $response\n";
    }
}

function send_all_webhooks($patients, $webhook_url) {
    foreach ($patients as $patient) {
        send_webhook($patient, $webhook_url);
    }
}

$patients_data = fetch_patients($api_key, $base_url);

if ($patients_data && isset($patients_data['patients'])) {
    send_all_webhooks($patients_data['patients'], $webhook_url);
}
?>
