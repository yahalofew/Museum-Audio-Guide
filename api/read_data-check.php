<?php
header('Access-Control-Allow-Origin: *');
header("Content-Type: application/json; charset=utf-8");

include('../server_mysql.php');

$music_number = isset($_GET['music_number']) ? $_GET['music_number'] : null;

if ($music_number === null) {
    echo json_encode(array("status" => "error", "message" => "ไม่มีพารามิเตอร์ music_number"));
    exit();
}

$sql = "SELECT * FROM music WHERE music_number <> ? AND music_number IS NOT NULL";
$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $music_number); // "s" เป็น string i เป็น int
$stmt->execute();
$result = $stmt->get_result();

// ตรวจสอบและส่งข้อมูลในรูปแบบ JSON กลับไปที่ Front-End
if ($result->num_rows > 0) {
    $data = array();
    while ($row = $result->fetch_assoc()) {
        $data[] = $row;
    }
    $responseData = array(
        "results" => $data
    );
    echo json_encode($responseData);
} else {
    echo json_encode(array("result" => false, "message" => "ไม่พบข้อมูลสำหรับ music_number ที่ให้มา "));
}

// $stmt->close();
// $conn->close();
