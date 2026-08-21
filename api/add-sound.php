<?php
require_once __DIR__ . '/admin_auth.php';
require_admin_auth();
require_once __DIR__ . '/upload_validation.php';
require_once __DIR__ . '/music_number_integrity.php';

header('Content-Type: application/json; charset=utf-8');
include('../server_mysql.php');
$storedUploads = [];
$transactionStarted = false;
try {
    $songNumber = validate_music_number(isset($_POST['songNumber']) ? $_POST['songNumber'] : '');
    $music_name = isset($_POST['songTitle']) ? trim($_POST['songTitle']) : '';
    if ($music_name === '') {
        throw new UploadValidationException('ข้อมูลไม่ครบถ้วน');
    }

    $audioUpload = validate_audio_upload(isset($_FILES['songFile']) ? $_FILES['songFile'] : null);
    $imageUpload = validate_image_upload(isset($_FILES['songImage']) ? $_FILES['songImage'] : null);

    $conn->begin_transaction();
    $transactionStarted = true;
    assert_music_number_available($conn, $songNumber, null, true);

    $music_audio = store_validated_upload($audioUpload, 'music', $songNumber);
    $storedUploads[] = ['music', $music_audio];
    $music_img = store_validated_upload($imageUpload, 'images', $songNumber);
    $storedUploads[] = ['images', $music_img];

    $stmt = $conn->prepare("INSERT INTO music (music_name, music_img, music_audio, music_number) VALUES (?, ?, ?, ?)");
    $stmt->bind_param("sssi", $music_name, $music_img, $music_audio, $songNumber);
    $stmt->execute();

    if ($stmt->affected_rows > 0) {
        $stmt->close();
        $conn->commit();
        $transactionStarted = false;
        echo json_encode(array("success" => true, "message" => "บันทึกข้อมูลลงในฐานข้อมูลและย้ายไฟล์สำเร็จ"));
    } else {
        throw new RuntimeException('บันทึกข้อมูลไม่สำเร็จ');
    }
    $conn->close();
} catch (Throwable $e) {
    if ($transactionStarted) {
        $conn->rollback();
    }
    foreach (array_reverse($storedUploads) as $storedUpload) {
        remove_stored_upload($storedUpload[0], $songNumber, $storedUpload[1]);
    }

    if ($e instanceof MusicNumberConflictException || is_duplicate_music_number_error($e)) {
        http_response_code(409);
        $message = 'มีหมายเลขนี้อยู่แล้ว กรุณาเปลี่ยนเป็นหมายเลขอื่น';
    } elseif ($e instanceof UploadValidationException) {
        http_response_code($e->getStatusCode());
        $message = $e->getMessage();
    } else {
        http_response_code(500);
        $message = 'เกิดข้อผิดพลาดในการบันทึกข้อมูล';
        error_log($e->getMessage());
    }
    echo json_encode(array("success" => false, "message" => $message));
    $conn->close();
    exit();
}
