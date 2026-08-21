<?php
require_once __DIR__ . '/admin_auth.php';
require_admin_auth();
require_once __DIR__ . '/media_path.php';
require_once __DIR__ . '/music_number_integrity.php';
require_once __DIR__ . '/api_response.php';

initialize_json_response();

include('../server_mysql.php');


$musicRenamed = false;
$imagesRenamed = false;
$transactionStarted = false;
try {
    $oldNumber = validate_media_number(isset($_POST['oldNumber']) ? $_POST['oldNumber'] : '');
    $newNumber = validate_media_number(isset($_POST['newNumber']) ? $_POST['newNumber'] : '');

    $conn->begin_transaction();
    $transactionStarted = true;
    $stmt = $conn->prepare('SELECT music_id FROM music WHERE music_number = ? FOR UPDATE');
    $stmt->bind_param('i', $oldNumber);
    $stmt->execute();
    $oldRecord = $stmt->get_result()->fetch_assoc();
    $stmt->close();
    if (!$oldRecord) {
        throw new MediaPathException('ไม่พบข้อมูลหมายเลขเดิม', 404);
    }

    assert_music_number_available($conn, $newNumber, (int) $oldRecord['music_id'], true);

    rename_media_directory('music', $oldNumber, $newNumber);
    $musicRenamed = true;
    rename_media_directory('images', $oldNumber, $newNumber);
    $imagesRenamed = true;

    $stmt = $conn->prepare("UPDATE music SET music_number = ? WHERE music_id = ?");
    $musicId = (int) $oldRecord['music_id'];
    $stmt->bind_param("ii", $newNumber, $musicId);

    if ($stmt->execute()) {
        $stmt->close();
        $conn->commit();
        $transactionStarted = false;
        echo json_encode(array("result" => true, "message" => "อัพเดตไฟล์และข้อมูลสำเร็จ"));
    } else {
        throw new MediaPathException('อัพเดตข้อมูลไม่สำเร็จ', 500);
    }
} catch (Throwable $e) {
    if ($transactionStarted) {
        $conn->rollback();
    }
    if ($imagesRenamed) {
        try {
            rename_media_directory('images', $newNumber, $oldNumber);
        } catch (MediaPathException $rollbackError) {
            error_log('ไม่สามารถคืนชื่อโฟลเดอร์รูปภาพได้: ' . $rollbackError->getMessage());
        }
    }
    if ($musicRenamed) {
        try {
            rename_media_directory('music', $newNumber, $oldNumber);
        } catch (MediaPathException $rollbackError) {
            error_log('ไม่สามารถคืนชื่อโฟลเดอร์เสียงได้: ' . $rollbackError->getMessage());
        }
    }

    if ($e instanceof MusicNumberConflictException || is_duplicate_music_number_error($e)) {
        http_response_code(409);
        $message = 'มีหมายเลขนี้อยู่แล้ว กรุณาเปลี่ยนเป็นหมายเลขอื่น';
    } elseif ($e instanceof MediaPathException) {
        http_response_code($e->getStatusCode());
        $message = $e->getMessage();
    } else {
        http_response_code(500);
        $message = 'เกิดข้อผิดพลาดในการอัปเดตข้อมูล';
        error_log($e->getMessage());
    }
    echo json_encode(array("result" => false, "message" => $message));
}

$conn->close();
