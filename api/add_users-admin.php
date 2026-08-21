<?php
require_once __DIR__ . '/admin_auth.php';
require_admin_auth();

initialize_json_response();
// เชื่อมต่อกับฐานข้อมูล MySQL
include('../server_mysql.php');


require_request_method('POST', [
    "success" => false,
    "message" => "วิธีการไม่ได้รับอนุญาต"
]);

// ตรวจสอบว่ามีข้อมูล username และ password ที่ส่งมาหรือไม่
if (!isset($_POST['username']) || !isset($_POST['password'])) {
    json_response_and_exit([
        "success" => false,
        "message" => "กรุณากรอกชื่อผู้ใช้และรหัสผ่าน"
    ], 400);
}

// รับค่า username และ password จากข้อมูลที่ส่งมา
$username = trim($_POST['username']);
$password = $_POST['password'];

// ตรวจสอบความยาวและรูปแบบ username/password
if (strlen($username) < 4 || strlen($username) > 32 || !preg_match('/^[a-zA-Z0-9_]+$/', $username)) {
    json_response_and_exit([
        "success" => false,
        "message" => "ชื่อผู้ใช้ต้องมี 4-32 ตัวอักษรและใช้ได้เฉพาะ a-z, A-Z, 0-9, _"
    ], 400);
}
if (strlen($password) < 6) {
    json_response_and_exit([
        "success" => false,
        "message" => "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร"
    ], 400);
}

// ตรวจสอบว่ามี username นี้อยู่แล้วหรือไม่
$checkSql = "SELECT id FROM users_admin WHERE username = ? LIMIT 1";
$checkStmt = $conn->prepare($checkSql);
$checkStmt->bind_param("s", $username);
$checkStmt->execute();
$checkStmt->store_result();
if ($checkStmt->num_rows > 0) {
    $checkStmt->close();
    $conn->close();
    json_response_and_exit([
        "success" => false,
        "message" => "ชื่อผู้ใช้นี้มีอยู่แล้ว กรุณาเลือกชื่ออื่น"
    ], 409);
}
$checkStmt->close();

// แฮชรหัสผ่าน
$hashedPassword = password_hash($password, PASSWORD_DEFAULT);

// เตรียมคำสั่ง SQL สำหรับการเพิ่มข้อมูลผู้ใช้งาน
$sql = "INSERT INTO users_admin (username, password) VALUES (?, ?)";
$stmt = $conn->prepare($sql);
if (!$stmt) {
    error_log("SQL Error: " . $conn->error);
    $conn->close();
    json_response_and_exit([
        "success" => false,
        "message" => "เกิดข้อผิดพลาดในการเตรียมคำสั่ง SQL"
    ], 500);
}
$stmt->bind_param("ss", $username, $hashedPassword);

if ($stmt->execute()) {
    $response = [
        "success" => true,
        "message" => "บันทึกข้อมูลผู้ใช้งานสำเร็จ"
    ];
    $stmt->close();
    $conn->close();
    json_response_and_exit($response, 200);
} else {
    error_log("SQL Execute Error: " . $stmt->error);
    $stmt->close();
    $conn->close();
    json_response_and_exit([
        "success" => false,
        "message" => "เกิดข้อผิดพลาดในการบันทึกข้อมูลผู้ใช้งาน"
    ], 500);
}
