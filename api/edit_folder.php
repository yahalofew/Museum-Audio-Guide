<?php
require_once __DIR__ . '/admin_auth.php';
require_admin_auth();
require_once __DIR__ . '/media_path.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

include('../server_mysql.php');


$musicRenamed = false;
$imagesRenamed = false;
try {
    $oldNumber = validate_media_number(isset($_POST['oldNumber']) ? $_POST['oldNumber'] : '');
    $newNumber = validate_media_number(isset($_POST['newNumber']) ? $_POST['newNumber'] : '');

    rename_media_directory('music', $oldNumber, $newNumber);
    $musicRenamed = true;
    rename_media_directory('images', $oldNumber, $newNumber);
    $imagesRenamed = true;

    $stmt = $conn->prepare("UPDATE music SET music_number = ? WHERE music_number = ?");
    $stmt->bind_param("ii", $newNumber, $oldNumber);

    if ($stmt->execute()) {
        echo json_encode(array("result" => true, "message" => "อัพเดตไฟล์และข้อมูลสำเร็จ"));
    } else {
        throw new MediaPathException('อัพเดตข้อมูลไม่สำเร็จ', 500);
    }
    $stmt->close();
} catch (MediaPathException $e) {
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

    http_response_code($e->getStatusCode());
    echo json_encode(array("result" => false, "message" => $e->getMessage()));
} catch (PDOException $e) {
    echo json_encode(array("result" => false, "message" => "เกิดข้อผิดพลาด: " . $e->getMessage()));
}

$conn->close();
