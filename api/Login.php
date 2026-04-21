<?php
session_start();

// Security Headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=utf-8");
header("X-Content-Type-Options: nosniff");
header("X-Frame-Options: DENY");

// Handle preflight OPTIONS request
if ($_SERVER["REQUEST_METHOD"] == "OPTIONS") {
    http_response_code(200);
    exit;
}

// เชื่อมต่อกับฐานข้อมูม MySQL
include('../server_mysql.php');

// Helper function for JSON response
function send_json_response($data, $http_code = 200)
{
    ob_end_clean();
    http_response_code($http_code);
    echo json_encode($data);
    exit;
}

if ($_SERVER["REQUEST_METHOD"] == 'POST') {
    // ตรวจสอบว่ามีข้อมูล username และ password ที่ส่งมาหรือไม่
    if (isset($_POST['username']) && isset($_POST['password'])) {

        $username = trim($_POST['username']);
        $password = $_POST['password'];

        // Validate input
        if (empty($username) || empty($password)) {
            send_json_response([
                "success" => false,
                "message" => "กรุณากรอกชื่อผู้ใช้และรหัสผ่าน"
            ], 400);
        }

        // เตรียมคำสั่ง SQL สำหรับการค้นหาข้อมูลผู้ใช้
        $sql = "SELECT * FROM users_admin WHERE username = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("s", $username);
        $stmt->execute();
        $result = $stmt->get_result();

        // กำหนดข้อความ Error ให้เป็นมาตรฐานเดียวกัน เพื่อป้องกันการเดาชื่อผู้ใช้
        $auth_failed_message = "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง";

        // ตรวจสอบว่ามีผู้ใช้งานในฐานข้อมูลหรือไม่
        if ($result->num_rows == 1) {
            // ดึงข้อมูลผู้ใช้งานจากฐานข้อมูล
            $user = $result->fetch_assoc();
            // ตรวจสอบรหัสผ่านที่ส่งมาเทียบกับรหัสผ่านที่เก็บในฐานข้อมูล (ซึ่งควรจะถูกแฮชไว้)
            if (password_verify($password, $user["password"])) {
                // รหัสผ่านถูกต้อง ให้สร้างเซสชันสำหรับผู้ดูแลระบบ
                $_SESSION['admin_logged_in'] = true;
                $_SESSION['admin_id'] = $user['id'] ?? null;
                $_SESSION['admin_username'] = $user['username'] ?? '';

                // Regenerate session ID for security
                session_regenerate_id(true);

                $stmt->close();
                $conn->close();

                send_json_response([
                    "success" => true,
                    "message" => "เข้าสู่ระบบสำเร็จ"
                ], 200);
            } else {
                // รหัสผ่านผิด
                $stmt->close();
                $conn->close();
                send_json_response([
                    "success" => false,
                    "message" => $auth_failed_message
                ], 401);
            }
        } else {
            $stmt->close();
            $conn->close();
            send_json_response([
                "success" => false,
                "message" => $auth_failed_message
            ], 401);
        }
    } else {
        // ไม่มีข้อมูล username หรือ password ส่งมา
        send_json_response([
            "success" => false,
            "message" => "กรุณากรอกชื่อผู้ใช้และรหัสผ่าน"
        ], 400);
    }
} else {
    // ไม่มีการเรียกใช้งานผ่านเมธอด POST
    send_json_response([
        "success" => false,
        "message" => "วิธีการไม่ได้รับอนุญาต"
    ], 405);
}
