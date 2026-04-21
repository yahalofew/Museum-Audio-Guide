<?php
$servername = "DB_HOST";
$username = "DB_USER";
$password = "DB_PASS";
$dbname = "DB_NAME";

$conn = mysqli_connect($servername, $username, $password, $dbname);

if (!$conn) {
        die("Connection failed: " . mysqli_connect_error());
    }
?>