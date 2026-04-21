<?php
header('Access-Control-Allow-Origin: *');
header("Content-Type: application/json; charset=utf-8");

// ตรวจสอบ HTTP Method: API นี้ไว้สำหรับดึงข้อมูล ควรอนุญาตแค่ GET เท่านั้น
if ($_SERVER["REQUEST_METHOD"] !== 'GET') {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method Not Allowed"]);
    exit();
}

include('../server_mysql.php');

$music_id = isset($_GET['music_id']) ? $_GET['music_id'] : null;

// Input Validation: ป้องกันคนแกล้งส่งตัวอักษรหรือข้อความแปลกๆ เข้ามา
// โดยเช็คว่าต้องมีค่าส่งมา และ "ต้องเป็นตัวเลขเท่านั้น" (is_numeric) ก่อนนำไปค้นหาในฐานข้อมูล
if ($music_id === null || !is_numeric($music_id)) {
    http_response_code(400);
    echo json_encode(array("success" => false, "message" => "พารามิเตอร์ไม่ถูกต้อง กรุณาระบุเป็นตัวเลข"));
    exit();
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
        $results[] = $row;
    }
    http_response_code(200);
    echo json_encode(array("success" => true, "data" => $results));
} else {
    http_response_code(404);
    echo json_encode(array("success" => false, "message" => "ไม่พบข้อมูลสำหรับหมายเลขที่ให้มา"));
}

$stmt->close();
$conn->close();
