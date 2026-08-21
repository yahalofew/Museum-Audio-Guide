<?php

class UploadValidationException extends RuntimeException
{
    private $statusCode;

    public function __construct($message, $statusCode = 400)
    {
        parent::__construct($message);
        $this->statusCode = $statusCode;
    }

    public function getStatusCode()
    {
        return $this->statusCode;
    }
}

function validate_music_number($value)
{
    $musicNumber = is_scalar($value) ? (string) $value : '';
    if (!preg_match('/^[1-9][0-9]*$/D', $musicNumber)) {
        throw new UploadValidationException('หมายเลขเสียงไม่ถูกต้อง');
    }

    return $musicNumber;
}

function validate_audio_upload($file)
{
    return validate_uploaded_file($file, [
        'mp3' => ['audio/mpeg', 'audio/mp3'],
        'wav' => ['audio/wav', 'audio/x-wav', 'audio/vnd.wave'],
        'ogg' => ['audio/ogg', 'application/ogg'],
        'm4a' => ['audio/mp4', 'audio/x-m4a', 'video/mp4'],
        'aac' => ['audio/aac', 'audio/x-aac'],
        'flac' => ['audio/flac', 'audio/x-flac'],
    ], 30 * 1024 * 1024, 'ไฟล์เสียง');
}

function validate_image_upload($file)
{
    return validate_uploaded_file($file, [
        'jpg' => ['image/jpeg'],
        'jpeg' => ['image/jpeg'],
        'png' => ['image/png'],
        'gif' => ['image/gif'],
        'webp' => ['image/webp'],
    ], 10 * 1024 * 1024, 'ไฟล์รูปภาพ');
}

function validate_uploaded_file($file, $allowedTypes, $maxSize, $label)
{
    if (!is_array($file) || !isset($file['error'])) {
        throw new UploadValidationException("ไม่ได้รับ{$label}");
    }

    $error = (int) $file['error'];
    if ($error !== UPLOAD_ERR_OK) {
        if ($error === UPLOAD_ERR_INI_SIZE || $error === UPLOAD_ERR_FORM_SIZE) {
            throw new UploadValidationException("{$label}มีขนาดใหญ่เกินกำหนด", 413);
        }
        if ($error === UPLOAD_ERR_NO_FILE) {
            throw new UploadValidationException("ไม่ได้รับ{$label}");
        }

        throw new UploadValidationException("เกิดข้อผิดพลาดในการอัปโหลด{$label}");
    }

    $size = isset($file['size']) ? (int) $file['size'] : 0;
    if ($size <= 0) {
        throw new UploadValidationException("{$label}ไม่มีข้อมูล");
    }
    if ($size > $maxSize) {
        throw new UploadValidationException("{$label}มีขนาดใหญ่เกินกำหนด", 413);
    }

    $tmpName = isset($file['tmp_name']) ? $file['tmp_name'] : '';
    if (!is_string($tmpName) || !is_uploaded_file($tmpName)) {
        throw new UploadValidationException("{$label}อัปโหลดไม่ถูกต้อง");
    }

    $originalName = isset($file['name']) ? basename((string) $file['name']) : '';
    $extension = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
    if (!isset($allowedTypes[$extension])) {
        throw new UploadValidationException("ไม่อนุญาตนามสกุลของ{$label}", 415);
    }

    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mimeType = $finfo->file($tmpName);
    if ($mimeType === false || !in_array($mimeType, $allowedTypes[$extension], true)) {
        throw new UploadValidationException("ประเภท{$label}ไม่ถูกต้อง", 415);
    }

    $baseName = pathinfo($originalName, PATHINFO_FILENAME);
    $safeBaseName = preg_replace('/[^A-Za-z0-9_-]+/', '-', $baseName);
    $safeBaseName = trim($safeBaseName, '-_');
    if ($safeBaseName === '') {
        $safeBaseName = 'upload';
    }
    $safeBaseName = substr($safeBaseName, 0, 80);

    return [
        'tmp_name' => $tmpName,
        'filename' => $safeBaseName . '-' . bin2hex(random_bytes(8)) . '.' . $extension,
        'mime_type' => $mimeType,
        'size' => $size,
    ];
}

function store_validated_upload($upload, $directory)
{
    if (!is_dir($directory) && !mkdir($directory, 0755, true)) {
        throw new UploadValidationException('ไม่สามารถสร้างโฟลเดอร์อัปโหลดได้', 500);
    }

    $targetPath = rtrim($directory, '/\\') . DIRECTORY_SEPARATOR . $upload['filename'];
    if (!move_uploaded_file($upload['tmp_name'], $targetPath)) {
        throw new UploadValidationException('ไม่สามารถบันทึกไฟล์อัปโหลดได้', 500);
    }

    return $upload['filename'];
}
