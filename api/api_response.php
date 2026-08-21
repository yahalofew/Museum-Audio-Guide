<?php

function initialize_json_response()
{
    header('Content-Type: application/json; charset=utf-8');
}

function json_response_and_exit($payload, $statusCode = 200)
{
    initialize_json_response();
    http_response_code($statusCode);
    echo json_encode($payload);
    exit;
}

function require_request_method($expectedMethod, $errorPayload, $statusCode = 405)
{
    if ($_SERVER['REQUEST_METHOD'] !== $expectedMethod) {
        json_response_and_exit($errorPayload, $statusCode);
    }
}
