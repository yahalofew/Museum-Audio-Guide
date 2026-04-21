<?php
// setup_admin.php - รันครั้งเดียวแล้วลบทิ้ง
include('server_mysql.php');

$username = 'admin';
$password = 'admin123';
$hashedPassword = password_hash($password, PASSWORD_DEFAULT);

// ลบ admin เก่าถ้ามี
$conn->query("DELETE FROM users_admin WHERE username = 'admin'");

// เพิ่ม admin ใหม่
$stmt = $conn->prepare("INSERT INTO users_admin (username, password) VALUES (?, ?)");
$stmt->bind_param("ss", $username, $hashedPassword);

if ($stmt->execute()) {
    echo "สำเร็จ! สร้าง admin เรียบร้อย<br>";
    echo "Username: admin<br>";
    echo "Password: admin123<br>";
    echo "Hash: " . $hashedPassword . "<br>";
    echo "<br>⚠️ กรุณาลบไฟล์นี้หลังใช้งานเสร็จ!";
} else {
    echo "ผิดพลาด: " . $stmt->error;
}

$stmt->close();
$conn->close();
?>