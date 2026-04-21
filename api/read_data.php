<?php

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

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
            $data[] = $row;
        }
        echo json_encode($data);
    } else {
        echo json_encode(array());
    }
}

$conn->close();
