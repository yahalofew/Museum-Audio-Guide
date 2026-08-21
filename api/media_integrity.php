<?php
require_once __DIR__ . '/media_path.php';

function add_media_integrity_status($record)
{
    $missingMedia = [];
    $musicNumber = isset($record['music_number']) ? $record['music_number'] : '';

    try {
        media_file_path('music', $musicNumber, isset($record['music_audio']) ? $record['music_audio'] : '', true);
    } catch (MediaPathException $e) {
        $missingMedia[] = 'audio';
    }

    try {
        media_file_path('images', $musicNumber, isset($record['music_img']) ? $record['music_img'] : '', true);
    } catch (MediaPathException $e) {
        $missingMedia[] = 'image';
    }

    if (count($missingMedia) > 0) {
        $record['media_status'] = 'missing';
        $record['missing_media'] = $missingMedia;
    }

    return $record;
}
