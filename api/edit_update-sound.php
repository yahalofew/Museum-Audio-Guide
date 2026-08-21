<?php
require_once __DIR__ . '/admin_auth.php';
require_admin_auth();
require_once __DIR__ . '/upload_validation.php';
require_once __DIR__ . '/api_response.php';

initialize_json_response();

include('../server_mysql.php');

$storedAudio = null;
$transactionStarted = false;
try {
    $songNumber = validate_music_number(isset($_POST['songNumber']) ? $_POST['songNumber'] : '');
    $audioUpload = validate_audio_upload(isset($_FILES['fileAudio']) ? $_FILES['fileAudio'] : null);

    $conn->begin_transaction();
    $transactionStarted = true;
    $stmt = $conn->prepare('SELECT music_id, music_audio FROM music WHERE music_number = ? FOR UPDATE');
    $stmt->bind_param('i', $songNumber);
    $stmt->execute();
    $music = $stmt->get_result()->fetch_assoc();
    $stmt->close();
    if (!$music) {
        throw new MediaPathException('ไม่พบข้อมูลเพลง', 404);
    }

    $storedAudio = store_validated_upload($audioUpload, 'music', $songNumber);
    $stmt = $conn->prepare('UPDATE music SET music_audio = ? WHERE music_id = ?');
    $musicId = (int) $music['music_id'];
    $stmt->bind_param('si', $storedAudio, $musicId);
    $stmt->execute();
    if ($stmt->affected_rows < 1) {
        throw new RuntimeException('อัปเดตข้อมูลไฟล์เสียงไม่สำเร็จ');
    }
    $stmt->close();
    $conn->commit();
    $transactionStarted = false;

    if ($music['music_audio'] !== $storedAudio) {
        try {
            delete_media_file('music', $songNumber, $music['music_audio']);
        } catch (MediaPathException $cleanupError) {
            error_log('ไม่สามารถลบไฟล์เสียงเดิมได้: ' . $cleanupError->getMessage());
        }
    }

    echo json_encode(array(
        'result' => true,
        'message' => 'อัปโหลดไฟล์เพลงสำเร็จ',
        'filename' => $storedAudio
    ));
} catch (Throwable $e) {
    if ($transactionStarted) {
        $conn->rollback();
    }
    if ($storedAudio !== null) {
        remove_stored_upload('music', $songNumber, $storedAudio);
    }

    if ($e instanceof UploadValidationException || $e instanceof MediaPathException) {
        http_response_code($e->getStatusCode());
        $message = $e->getMessage();
    } else {
        http_response_code(500);
        $message = 'เกิดข้อผิดพลาดในการอัปเดตไฟล์เสียง';
        error_log($e->getMessage());
    }
    echo json_encode(array('result' => false, 'message' => $message));
}

$conn->close();
