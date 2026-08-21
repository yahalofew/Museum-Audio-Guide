<?php
require_once __DIR__ . '/admin_auth.php';
require_admin_auth();
require_once __DIR__ . '/upload_validation.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
include('../server_mysql.php');
try {
    $songNumber = validate_music_number(isset($_POST['songNumber']) ? $_POST['songNumber'] : '');
    $music_name = isset($_POST['songTitle']) ? trim($_POST['songTitle']) : '';
    if ($music_name === '') {
        throw new UploadValidationException('ข้อมูลไม่ครบถ้วน');
    }

    $audioUpload = validate_audio_upload(isset($_FILES['songFile']) ? $_FILES['songFile'] : null);
    $imageUpload = validate_image_upload(isset($_FILES['songImage']) ? $_FILES['songImage'] : null);

    $music_audio = store_validated_upload($audioUpload, 'music', $songNumber);
    $music_img = store_validated_upload($imageUpload, 'images', $songNumber);

    $stmt = $conn->prepare("INSERT INTO music (music_name, music_img, music_audio, music_number) VALUES (?, ?, ?, ?)");
    $stmt->bind_param("sssi", $music_name, $music_img, $music_audio, $songNumber);
    $stmt->execute();

    if ($stmt->affected_rows > 0) {
        echo json_encode(array("success" => true, "message" => "บันทึกข้อมูลลงในฐานข้อมูลและย้ายไฟล์สำเร็จ"));
    } else {
        echo json_encode(array("success" => false, "message" => "เกิดข้อผิดพลาด: " . $stmt->errno . " - " . $stmt->error));
    }

    $stmt->close();
    $conn->close();
} catch (UploadValidationException $e) {
    http_response_code($e->getStatusCode());
    echo json_encode(array("success" => false, "message" => $e->getMessage()));
    $conn->close();
    exit();
}
