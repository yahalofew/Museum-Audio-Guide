<?php
require_once __DIR__ . '/api_response.php';
initialize_json_response();

require_once __DIR__ . '/media_integrity.php';
include('../server_mysql.php');

$sql = "SELECT * FROM music";
$result = $conn->query($sql);

if ($result === false) {
    echo json_encode(array("status" => "error", "message" => "ข้อผิดพลาดในการสืบค้น: " . $conn->error));
} else {
    // ตรวจสอบและส่งข้อมูลในรูปแบบ JSON กลับไปที่ Front-End
    if ($result->num_rows > 0) {
        $data = array();
        while ($row = $result->fetch_assoc()) {
            $data[] = add_media_integrity_status($row);
        }
        echo json_encode($data);
    } else {
        echo json_encode(array());
    }
}

$conn->close();
