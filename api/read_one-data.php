<?php
require_once __DIR__ . '/api_response.php';
initialize_json_response();

require_once __DIR__ . '/media_integrity.php';
include('../server_mysql.php');

$music_number = isset($_GET['music_number']) ? $_GET['music_number'] : null;

if ($music_number === null) {
    echo json_encode(array("status" => "error", "message" => "กรุณาระบุตัวเลขในพารามิเตอร์"));
    exit();
}


$sql = "SELECT * FROM music WHERE music_number = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $music_number); // "s" เป็น string i เป็น int
$stmt->execute();
$result = $stmt->get_result();

// ตรวจสอบและส่งข้อมูลในรูปแบบ JSON กลับไปที่ Front-End
if ($result->num_rows > 0) {
    $data = array();
    while ($row = $result->fetch_assoc()) {
        $data[] = add_media_integrity_status($row);
    }
    $responseData = array(
        "result" => true,
        "results" => $data
    );

    echo json_encode($responseData);
} else {
    echo json_encode(array("result" => false, "message" => "ไม่พบข้อมูลสำหรับ music_number ที่ให้มา "));
}

// $stmt->close();
$conn->close();
