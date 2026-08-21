<?php

require_once __DIR__ . '/admin_session.php';
require_once __DIR__ . '/api_response.php';

function require_admin_auth()
{
    start_admin_session();

    if (!isset($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
        json_response_and_exit(["success" => false, "message" => "Unauthorized access"], 401);
    }
}
