<?php
require_once __DIR__ . '/admin_auth.php';
require_admin_auth();
require_once __DIR__ . '/upload_validation.php';

header('Content-Type: application/json; charset=utf-8');

include('../server_mysql.php');

$storedImage = null;
$transactionStarted = false;
try {
    $songNumber = validate_music_number(isset($_POST['songNumber']) ? $_POST['songNumber'] : '');
    $musicName = isset($_POST['music_name']) ? trim($_POST['music_name']) : '';
    $musicAudio = isset($_POST['music_audio']) ? $_POST['music_audio'] : '';
    $musicId = isset($_POST['music_id']) ? filter_var($_POST['music_id'], FILTER_VALIDATE_INT) : false;
    if ($musicName === '' || $musicAudio === '' || $musicId === false || $musicId < 1) {
        throw new UploadValidationException('ข้อมูลไม่ครบถ้วน');
    }
    $imageUpload = validate_image_upload(isset($_FILES['songImage']) ? $_FILES['songImage'] : null);

    $conn->begin_transaction();
    $transactionStarted = true;
    $stmt = $conn->prepare('SELECT music_img, music_audio FROM music WHERE music_id = ? AND music_number = ? FOR UPDATE');
    $stmt->bind_param('ii', $musicId, $songNumber);
    $stmt->execute();
    $music = $stmt->get_result()->fetch_assoc();
    $stmt->close();
    if (!$music) {
        throw new MediaPathException('ไม่พบข้อมูลเพลง', 404);
    }
    if ($music['music_audio'] !== $musicAudio) {
        throw new MediaPathException('ข้อมูลไฟล์เสียงมีการเปลี่ยนแปลง กรุณาลองใหม่', 409);
    }
    media_file_path('music', $songNumber, $musicAudio, true);

    $storedImage = store_validated_upload($imageUpload, 'images', $songNumber);
    $stmt = $conn->prepare('UPDATE music SET music_name = ?, music_img = ?, music_audio = ? WHERE music_id = ?');
    $stmt->bind_param('sssi', $musicName, $storedImage, $musicAudio, $musicId);
    $stmt->execute();
    $stmt->close();
    $conn->commit();
    $transactionStarted = false;

    if ($music['music_img'] !== $storedImage) {
        try {
            delete_media_file('images', $songNumber, $music['music_img']);
        } catch (MediaPathException $cleanupError) {
            error_log('ไม่สามารถลบไฟล์รูปภาพเดิมได้: ' . $cleanupError->getMessage());
        }
    }

    echo json_encode(array('result' => true, 'message' => 'อัพเดตไฟล์และข้อมูลสำเร็จ'));
} catch (Throwable $e) {
    if ($transactionStarted) {
        $conn->rollback();
    }
    if ($storedImage !== null) {
        remove_stored_upload('images', $songNumber, $storedImage);
    }

    if ($e instanceof UploadValidationException || $e instanceof MediaPathException) {
        http_response_code($e->getStatusCode());
        $message = $e->getMessage();
    } else {
        http_response_code(500);
        $message = 'เกิดข้อผิดพลาดในการอัปเดตข้อมูล';
        error_log($e->getMessage());
    }
    echo json_encode(array('result' => false, 'message' => $message));
}

$conn->close();
