<?php
require_once __DIR__ . '/admin_auth.php';
require_admin_auth();

header('Content-Type: application/json; charset=utf-8');

include('../server_mysql.php');

$songNumber = isset($_POST['songNumber']) ? $_POST['songNumber'] : '';
$music_name = isset($_POST['music_name']) ? $_POST['music_name'] : '';
$music_img = isset($_POST['music_img']) ? $_POST['music_img'] : null;
$music_audio = isset($_POST['music_audio']) ? $_POST['music_audio'] : null;
$music_id = isset($_POST['music_id']) ? $_POST['music_id'] : null;

if (empty($songNumber) || empty($music_name) || empty($music_audio) || empty($music_id)) {
    echo json_encode(array("result" => false, "message" => "ข้อมูลไม่ครบถ้วน"));
    exit();
}

try {
    if ($music_img !== null) {

        $stmt = $conn->prepare("UPDATE music SET music_name = ?, music_img = ?, music_audio = ? WHERE music_id = ?");
        $stmt->bind_param("sssi", $music_name, $music_img, $music_audio, $music_id);


        if ($stmt->execute()) {
            echo json_encode(array("result" => true, "message" => "สำเร็จ"));
        } else {
            echo json_encode(array("result" => false, "message" => "อัพเดตข้อมูลไม่สำเร็จ:" . $stmt->errno));
        }
        $stmt->close();
        // exit();     

    } else {
        echo json_encode(array("result" => false, "message" => "ไม่ได้รับข้อมูล file Img"));
        exit();
    }
} catch (PDOException $e) {
    echo json_encode(array("result" => false, "message" => "เกิดข้อผิดพลาด: " . $e->getMessage()));
    exit();
}

$conn->close();

?>
