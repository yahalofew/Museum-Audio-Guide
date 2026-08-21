<?php
require_once __DIR__ . '/admin_auth.php';
require_admin_auth();

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

include('../server_mysql.php');

// session_start();

$music_number = isset($_POST['songNumber']) ? $_POST['songNumber'] : '';

if ($music_number !== null) {
    try {
        // deleteFolderRecursive("../images/{$music_number}");
        // deleteFolderRecursive("../music/{$music_number}");
        // ลบรูป
        $success = deleteFolderRecursive("../images/{$music_number}");
        if ($success) {
            // ลบเสียง
            $successAudio = deleteFolderRecursive("../music/{$music_number}");
            if ($successAudio) {
                //ข้อมูล
                $stmt = $conn->prepare("DELETE FROM music WHERE music_number = ?");
                $stmt->bind_param("i", $music_number);

                if ($stmt->execute()) {
                    echo json_encode(array("result" => true, "message" => "ลบข้อมูลสำเร็จ"));
                } else {
                    echo json_encode(array("result" => false, "message" => "เกิดข้อผิดพลาดในการลบข้อมูล: " . $stmt->error));
                }

                $stmt->close();
            }
        }
        //ถ้าไม่สำเร็จ
        if (!$success) {
            echo json_encode(array("result" => false, "message" => "ไม่สามารถลบทั้งหมดได้"));
        }
        //error
    } catch (PDOException $e) {
        echo json_encode(array("result" => false, "message" => "เกิดข้อผิดพลาด: " . $e->getMessage()));
    }
    // ไม่มีหมายเลขส่งมา
} else {
    echo json_encode(array("result" => false, "message" => "ไม่ได้รับข้อมูล music_number"));
}

$conn->close();

function deleteFolderRecursive($path)
{
    // ตรวจสอบว่าโฟลเดอร์หรือไฟล์ที่ต้องการลบมีอยู่หรือไม่.
    if (file_exists($path)) {
        // ลบ . .. ออก
        $files = array_diff(scandir($path), array('.', '..'));
        // ลูปเพื่อลบไฟล์ข้างในออกให้หมดเพื่อจะได้ลบโฟลหลักได้
        foreach ($files as $file) {
            // เอาpath กับ file มาต่อกัน
            $filePath = "$path/$file";
            // ตรวจสอบว่าเป็นโฟลเดอร์ไม่ใช้ไฟล์ที่ซ้อนอยู่
            if (is_dir($filePath)) {
                // เรียกฟังก์ชันลบโฟลเดอร์ซ้อน
                if (!deleteFolderRecursive($filePath)) {
                    // ไม่สามารถลบโฟลเดอร์ได้
                    return false;
                }
            } else {
                //ถ้าเป็นไฟล์จะสั่งลบไฟล์
                if (!unlink($filePath)) {
                    // ไม่สามารถลบไฟล์ได้
                    return false;
                }
            }
        }
        // ลบโฟลเดอร์ ต้องไม่ไฟล์เหลือ
        return rmdir($path);
    }
    // ไฟล์หรือโฟลเดอร์ไม่มีอยู่
    return false;
}
