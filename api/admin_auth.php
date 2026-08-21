<?php

require_once __DIR__ . '/admin_session.php';

function require_admin_auth()
{
    start_admin_session();

    if (!isset($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
        header('Content-Type: application/json; charset=utf-8');
        http_response_code(401);
        echo json_encode(["success" => false, "message" => "Unauthorized access"]);
        exit;
    }
}
