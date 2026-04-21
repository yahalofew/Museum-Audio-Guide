<?php
session_start();
if (!isset($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
    header('Content-Type: application/json; charset=utf-8');
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "Unauthorized access"]);
    exit;
}
// โค้ดเดิมต่อจากนี้...
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

include('../server_mysql.php');
if ($_FILES['fileAudio']['error'] == UPLOAD_ERR_OK) {
    try {
        $songNumber = isset($_POST['songNumber']) ? $_POST['songNumber'] : '';

        if ($songNumber === null) {
            echo json_encode(array("status" => "error", "message" => "ไม่มีพารามิเตอร์ songNumber"));
            exit();
        }

        $folderPathAudio = '../music/' . $songNumber . '/';

        $targetPathAudio = $folderPathAudio . $_FILES['fileAudio']['name'];
        move_uploaded_file($_FILES['fileAudio']['tmp_name'], $targetPathAudio);

        echo json_encode(array("result" => true, "message" => "อัปโหลดไฟล์เพลงสำเร็จ"));
        // exit();
    } catch (PDOException $e) {
        echo json_encode(array("result" => false, "message" => "เกิดข้อผิดพลาด: " . $e->getMessage()));
        exit();
    }
} else {
    echo json_encode(array("result" => false, "message" => "เกิดข้อผิดพลาดในการอัพโหลดไฟล์"));
    exit();
}

// $conn->close();
