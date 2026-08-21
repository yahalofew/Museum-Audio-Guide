<?php
require_once __DIR__ . '/api_response.php';
initialize_json_response();

require_once __DIR__ . '/media_integrity.php';

// ตรวจสอบ HTTP Method: API นี้ไว้สำหรับดึงข้อมูล ควรอนุญาตแค่ GET เท่านั้น
require_request_method('GET', ["success" => false, "message" => "Method Not Allowed"]);

include('../server_mysql.php');

$music_id = isset($_GET['music_id']) ? $_GET['music_id'] : null;

// Input Validation: ป้องกันคนแกล้งส่งตัวอักษรหรือข้อความแปลกๆ เข้ามา
// โดยเช็คว่าต้องมีค่าส่งมา และ "ต้องเป็นตัวเลขเท่านั้น" (is_numeric) ก่อนนำไปค้นหาในฐานข้อมูล
if ($music_id === null || !is_numeric($music_id)) {
    json_response_and_exit(array("success" => false, "message" => "พารามิเตอร์ไม่ถูกต้อง กรุณาระบุเป็นตัวเลข"), 400);
}
// ส่วนค้นหาข้อมูล
$sql = "SELECT * FROM music WHERE music_id = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $music_id); // "s" เป็น string i เป็น int
$stmt->execute();
$result = $stmt->get_result();

// ตรวจสอบและส่งข้อมูลในรูปแบบ JSON กลับไปที่ Front-End
if ($result->num_rows > 0) {
    $results = array();
    while ($row = $result->fetch_assoc()) {
        $results[] = add_media_integrity_status($row);
    }
    $response = array("success" => true, "data" => $results);
    $statusCode = 200;
} else {
    $response = array("success" => false, "message" => "ไม่พบข้อมูลสำหรับหมายเลขที่ให้มา");
    $statusCode = 404;
}

$stmt->close();
$conn->close();
json_response_and_exit($response, $statusCode);
