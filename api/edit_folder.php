<?php
session_start();
if (!isset($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
    header('Content-Type: application/json; charset=utf-8');
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "Unauthorized access"]);
    exit;
}

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

include('../server_mysql.php');


$oldNumber = isset($_POST['oldNumber']) ? $_POST['oldNumber'] : '';
$newNumber = isset($_POST['newNumber']) ? $_POST['newNumber'] : '';

if (empty($oldNumber) || empty($newNumber)) {
    echo json_encode(array("result" => false, "message" => "ข้อมูลไม่ครบถ้วน"));
    exit();
}

try {
    renameFolderMusic($oldNumber, $newNumber);

    $stmt = $conn->prepare("UPDATE music SET music_number = ? WHERE music_number = ?");
    $stmt->bind_param("ii", $newNumber, $oldNumber);

    if ($stmt->execute()) {
        echo json_encode(array("result" => true, "message" => "อัพเดตไฟล์และข้อมูลสำเร็จ"));
    } else {
        echo json_encode(array("result" => false, "message" => "อัพเดตข้อมูลไม่สำเร็จ:" . $stmt->errno . " - " . $stmt->error));
    }
} catch (PDOException $e) {
    echo json_encode(array("result" => false, "message" => "เกิดข้อผิดพลาด: " . $e->getMessage()));
    exit();
}

// $conn->close();
function renameFolderMusic($oldFolder, $newFolder)
{
    $oldFolderPathMusic = '../music/' . $oldFolder;
    $newFolderPathMusic = '../music/' . $newFolder;

    if (!file_exists($newFolderPathMusic)) {
        if (rename($oldFolderPathMusic, $newFolderPathMusic)) {
            error_log('เกิดข้อผิดพลาดในการเปลี่ยนชื่อโฟลเดอร์');
        } else {
            error_log('เกิดข้อผิดพลาดในการเปลี่ยนชื่อโฟลเดอร์');
        }
    } else {
        error_log('มีโฟลเดอร์ปลายทางอยู่แล้ว');
    }

    $oldFolderPathImg = '../images/' . $oldFolder;
    $newFolderPathImg = '../images/' . $newFolder;

    if (!file_exists($newFolderPathImg)) {
        if (rename($oldFolderPathImg, $newFolderPathImg)) {
            error_log('เกิดข้อผิดพลาดในการเปลี่ยนชื่อโฟลเดอร์');
        } else {
            error_log('เกิดข้อผิดพลาดในการเปลี่ยนชื่อโฟลเดอร์');
        }
    } else {
        error_log('มีโฟลเดอร์ปลายทางอยู่แล้ว');
    }
}
