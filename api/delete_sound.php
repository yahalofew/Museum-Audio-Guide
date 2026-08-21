<?php
require_once __DIR__ . '/admin_auth.php';
require_admin_auth();
require_once __DIR__ . '/media_path.php';

header('Content-Type: application/json; charset=utf-8');

include('../server_mysql.php');

$stagedDirectories = [];
$transactionStarted = false;
try {
    $musicNumber = validate_media_number(isset($_POST['songNumber']) ? $_POST['songNumber'] : '');
    $token = bin2hex(random_bytes(8));

    $conn->begin_transaction();
    $transactionStarted = true;
    $stmt = $conn->prepare('SELECT music_id FROM music WHERE music_number = ? FOR UPDATE');
    $stmt->bind_param('i', $musicNumber);
    $stmt->execute();
    $music = $stmt->get_result()->fetch_assoc();
    $stmt->close();
    if (!$music) {
        throw new MediaPathException('ไม่พบข้อมูลเพลง', 404);
    }

    // Validate both directories before moving either one.
    media_directory_path('images', $musicNumber, true);
    media_directory_path('music', $musicNumber, true);
    $stagedDirectories[] = stage_media_directory_for_deletion('images', $musicNumber, $token);
    $stagedDirectories[] = stage_media_directory_for_deletion('music', $musicNumber, $token);

    $stmt = $conn->prepare('DELETE FROM music WHERE music_id = ?');
    $musicId = (int) $music['music_id'];
    $stmt->bind_param('i', $musicId);
    $stmt->execute();
    if ($stmt->affected_rows !== 1) {
        throw new RuntimeException('ลบข้อมูลไม่สำเร็จ');
    }
    $stmt->close();
    $conn->commit();
    $transactionStarted = false;

    foreach ($stagedDirectories as $stagedDirectory) {
        try {
            delete_staged_media_directory($stagedDirectory);
        } catch (MediaPathException $cleanupError) {
            error_log('ไม่สามารถล้างโฟลเดอร์สื่อที่ลบแล้วได้: ' . $cleanupError->getMessage());
        }
    }

    echo json_encode(array('result' => true, 'message' => 'ลบข้อมูลสำเร็จ'));
} catch (Throwable $e) {
    if ($transactionStarted) {
        $conn->rollback();
    }
    foreach (array_reverse($stagedDirectories) as $stagedDirectory) {
        try {
            restore_staged_media_directory($stagedDirectory);
        } catch (MediaPathException $restoreError) {
            error_log('ไม่สามารถคืนโฟลเดอร์สื่อหลังลบล้มเหลวได้: ' . $restoreError->getMessage());
        }
    }

    if ($e instanceof MediaPathException) {
        http_response_code($e->getStatusCode());
        $message = $e->getMessage();
    } else {
        http_response_code(500);
        $message = 'เกิดข้อผิดพลาดในการลบข้อมูล';
        error_log($e->getMessage());
    }
    echo json_encode(array('result' => false, 'message' => $message));
}

$conn->close();
