<?php
session_start();
if (!isset($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
    header('Content-Type: application/json; charset=utf-8');
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "Unauthorized access"]);
    exit; // หยุดการทำงานทันที
}

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
include('../server_mysql.php');


// ตรวจสอบว่ามีการส่งไฟล์มาหรือไม่ 'file' คือชื่อ input name
if ($_FILES['songFile']['error'] == UPLOAD_ERR_OK && $_FILES['songImage']['error'] == UPLOAD_ERR_OK) {
    //หมายเลข
    // $songNumber = $_POST['songNumber'];
    // $music_number = $_POST['songNumber'];
    // $music_name = $_POST['songTitle'];
    // $music_audio = $_POST['songFile'];
    // $music_img = $_POST['songImage'];
    $music_audio = isset($_FILES['songFile']['name']) ? $_FILES['songFile']['name'] : '';
    $music_img = isset($_FILES['songImage']['name']) ? $_FILES['songImage']['name'] : '';
    $songNumber = isset($_POST['songNumber']) ? $_POST['songNumber'] : '';
    $music_name = isset($_POST['songTitle']) ? $_POST['songTitle'] : '';


    // ตรวจสอบค่าว่าว่างหรือไม่
    if (empty($songNumber) || empty($music_name) || empty($music_audio) || empty($music_img)) {
        echo json_encode(array("result" => false, "message" => "ข้อมูลไม่ครบถ้วน"));
        exit();
    }

    // กำหนดโฟลเดอร์ปลายทางที่ต้องการสำหรับแต่ละไฟล์
    $folderPathImg = '../images/' . $songNumber . '/';
    $folderPathAudio = '../music/' . $songNumber . '/';  // แก้ไขเป็นโฟลเดอร์ที่ต้องการ

    // ตรวจสอบว่าโฟลเดอร์มีอยู่หรือไม่ สำหรับทั้ง 2 ไฟล์
    //สร้างโฟลเดอร์รูป
    if (!file_exists($folderPathImg)) {
        mkdir($folderPathImg, 0777, true);
        error_log("โฟลเดอร์รูปภาพ '{$songNumber}' ถูกสร้างสำเร็จแล้ว");
    } else {
        error_log("โฟลเดอร์รูปภาพ '{$songNumber}' มีอยู่แล้ว");
    }
    //สร้างโฟลเดอร์เสียง
    if (!file_exists($folderPathAudio)) {
        mkdir($folderPathAudio, 0777, true);
        error_log("โฟลเดอร์เสียง '{$songNumber}' ถูกสร้างสำเร็จแล้ว");
    } else {
        error_log("โฟลเดอร์เสียง '{$songNumber}' มีอยู่แล้ว");
    }

    // ย้ายไฟล์ที่อัปโหลดมาไปยังโฟลเดอร์ปลายทาง
    $targetPathAudio = $folderPathAudio . $_FILES['songFile']['name'];
    move_uploaded_file($_FILES['songFile']['tmp_name'], $targetPathAudio);

    $targetPathImg = $folderPathImg . $_FILES['songImage']['name'];
    move_uploaded_file($_FILES['songImage']['tmp_name'], $targetPathImg);


    // เตรียมคำสั่ง SQL
    $stmt = $conn->prepare("INSERT INTO music (music_name, music_img, music_audio, music_number) VALUES (?, ?, ?, ?)");
    $stmt->bind_param("sssi", $music_name, $music_img, $music_audio, $songNumber);
    $stmt->execute();

    // ตรวจสอบว่า execute สำเร็จหรือไม่
    if ($stmt->affected_rows > 0) {
        echo json_encode(array("success" => true, "message" => "บันทึกข้อมูลลงในฐานข้อมูลและย้ายไฟล์สำเร็จ"));
    } else {
        echo json_encode(array("success" => false, "message" => "เกิดข้อผิดพลาด: " . $stmt->errno . " - " . $stmt->error));
    }

    // ปิดการเชื่อมต่อฐานข้อมูล
    $stmt->close();
    $conn->close();
} else {
    echo "เกิดข้อผิดพลาดในการอัพโหลดไฟล์";
    exit();
}
