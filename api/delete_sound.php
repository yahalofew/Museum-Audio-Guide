<?php
require_once __DIR__ . '/admin_auth.php';
require_admin_auth();
require_once __DIR__ . '/media_path.php';

header('Content-Type: application/json; charset=utf-8');

include('../server_mysql.php');

try {
    $music_number = validate_media_number(isset($_POST['songNumber']) ? $_POST['songNumber'] : '');

    // Resolve both paths before deleting either directory.
    media_directory_path('images', $music_number, true);
    media_directory_path('music', $music_number, true);

    delete_media_directory('images', $music_number);
    delete_media_directory('music', $music_number);

    $stmt = $conn->prepare("DELETE FROM music WHERE music_number = ?");
    $stmt->bind_param("i", $music_number);

    if ($stmt->execute()) {
        echo json_encode(array("result" => true, "message" => "ลบข้อมูลสำเร็จ"));
    } else {
        echo json_encode(array("result" => false, "message" => "เกิดข้อผิดพลาดในการลบข้อมูล: " . $stmt->error));
    }
    $stmt->close();
} catch (MediaPathException $e) {
    http_response_code($e->getStatusCode());
    echo json_encode(array("result" => false, "message" => $e->getMessage()));
} catch (PDOException $e) {
    echo json_encode(array("result" => false, "message" => "เกิดข้อผิดพลาด: " . $e->getMessage()));
}

$conn->close();
