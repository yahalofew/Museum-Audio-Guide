<?php
require_once __DIR__ . '/admin_auth.php';
require_admin_auth();
require_once __DIR__ . '/upload_validation.php';

// โค้ดเดิมต่อจากนี้...
header('Content-Type: application/json; charset=utf-8');

try {
    $songNumber = validate_music_number(isset($_POST['songNumber']) ? $_POST['songNumber'] : '');
    $audioUpload = validate_audio_upload(isset($_FILES['fileAudio']) ? $_FILES['fileAudio'] : null);
    $musicAudio = store_validated_upload($audioUpload, 'music', $songNumber);

    echo json_encode(array(
        "result" => true,
        "message" => "อัปโหลดไฟล์เพลงสำเร็จ",
        "filename" => $musicAudio
    ));
} catch (UploadValidationException $e) {
    http_response_code($e->getStatusCode());
    echo json_encode(array("result" => false, "message" => $e->getMessage()));
    exit();
}
