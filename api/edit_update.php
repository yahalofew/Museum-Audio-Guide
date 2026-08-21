<?php
require_once __DIR__ . '/admin_auth.php';
require_admin_auth();
require_once __DIR__ . '/media_path.php';

header('Content-Type: application/json; charset=utf-8');

include('../server_mysql.php');

$transactionStarted = false;
try {
    $songNumber = validate_media_number(isset($_POST['songNumber']) ? $_POST['songNumber'] : '');
    $musicName = isset($_POST['music_name']) ? trim($_POST['music_name']) : '';
    $musicImage = isset($_POST['music_img']) ? $_POST['music_img'] : '';
    $musicAudio = isset($_POST['music_audio']) ? $_POST['music_audio'] : '';
    $musicId = isset($_POST['music_id']) ? filter_var($_POST['music_id'], FILTER_VALIDATE_INT) : false;
    if ($musicName === '' || $musicImage === '' || $musicAudio === '' || $musicId === false || $musicId < 1) {
        throw new MediaPathException('ข้อมูลไม่ครบถ้วน');
    }

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
    if ($music['music_img'] !== $musicImage || $music['music_audio'] !== $musicAudio) {
        throw new MediaPathException('ข้อมูลไฟล์สื่อมีการเปลี่ยนแปลง กรุณาลองใหม่', 409);
    }
    media_file_path('images', $songNumber, $musicImage, true);
    media_file_path('music', $songNumber, $musicAudio, true);

    $stmt = $conn->prepare('UPDATE music SET music_name = ?, music_img = ?, music_audio = ? WHERE music_id = ?');
    $stmt->bind_param('sssi', $musicName, $musicImage, $musicAudio, $musicId);
    $stmt->execute();
    $stmt->close();
    $conn->commit();
    $transactionStarted = false;

    echo json_encode(array('result' => true, 'message' => 'สำเร็จ'));
} catch (Throwable $e) {
    if ($transactionStarted) {
        $conn->rollback();
    }
    if ($e instanceof MediaPathException) {
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
