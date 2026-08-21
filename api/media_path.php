<?php

class MediaPathException extends RuntimeException
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

function validate_media_number($value)
{
    $musicNumber = is_scalar($value) ? (string) $value : '';
    if (!preg_match('/^[1-9][0-9]*$/D', $musicNumber)) {
        throw new MediaPathException('หมายเลขเสียงไม่ถูกต้อง');
    }
    if (strlen($musicNumber) > 10 || (strlen($musicNumber) === 10 && strcmp($musicNumber, '2147483647') > 0)) {
        throw new MediaPathException('หมายเลขเสียงอยู่นอกช่วงที่อนุญาต');
    }

    return $musicNumber;
}

function media_root_path($mediaType)
{
    $roots = [
        'images' => __DIR__ . '/../images',
        'music' => __DIR__ . '/../music',
    ];

    if (!isset($roots[$mediaType])) {
        throw new MediaPathException('ประเภทโฟลเดอร์สื่อไม่ถูกต้อง');
    }

    $root = realpath($roots[$mediaType]);
    if ($root === false || !is_dir($root)) {
        throw new MediaPathException('ไม่พบโฟลเดอร์สื่อ', 500);
    }

    return $root;
}

function media_directory_path($mediaType, $musicNumber, $mustExist = false)
{
    $musicNumber = validate_media_number($musicNumber);
    $root = media_root_path($mediaType);
    $candidate = $root . DIRECTORY_SEPARATOR . $musicNumber;

    if (is_link($candidate)) {
        throw new MediaPathException('ไม่อนุญาตโฟลเดอร์สื่อที่เป็น symbolic link');
    }

    if (file_exists($candidate)) {
        $resolved = realpath($candidate);
        if ($resolved === false || !path_is_within_root($resolved, $root)) {
            throw new MediaPathException('เส้นทางโฟลเดอร์สื่อไม่ปลอดภัย');
        }

        return $resolved;
    }

    if ($mustExist) {
        throw new MediaPathException('ไม่พบโฟลเดอร์สื่อ');
    }

    if (!path_is_within_root($candidate, $root)) {
        throw new MediaPathException('เส้นทางโฟลเดอร์สื่อไม่ปลอดภัย');
    }

    return $candidate;
}

function path_is_within_root($path, $root)
{
    $normalizedPath = str_replace('\\', '/', rtrim($path, '/\\'));
    $normalizedRoot = str_replace('\\', '/', rtrim($root, '/\\'));

    if (PHP_OS_FAMILY === 'Windows') {
        $normalizedPath = strtolower($normalizedPath);
        $normalizedRoot = strtolower($normalizedRoot);
    }

    return strpos($normalizedPath, $normalizedRoot . '/') === 0;
}

function rename_media_directory($mediaType, $oldNumber, $newNumber)
{
    $oldPath = media_directory_path($mediaType, $oldNumber, true);
    $newPath = media_directory_path($mediaType, $newNumber, false);

    if (file_exists($newPath) || is_link($newPath)) {
        throw new MediaPathException('มีโฟลเดอร์ปลายทางอยู่แล้ว');
    }

    if (!rename($oldPath, $newPath)) {
        throw new MediaPathException('ไม่สามารถเปลี่ยนชื่อโฟลเดอร์สื่อได้', 500);
    }
}

function delete_media_directory($mediaType, $musicNumber)
{
    $root = media_root_path($mediaType);
    $directory = media_directory_path($mediaType, $musicNumber, true);
    delete_directory_within_root($directory, $root);
}

function delete_directory_within_root($directory, $root)
{
    $resolvedDirectory = realpath($directory);
    if ($resolvedDirectory === false || !path_is_within_root($resolvedDirectory, $root)) {
        throw new MediaPathException('เส้นทางลบโฟลเดอร์ไม่ปลอดภัย');
    }

    $files = scandir($resolvedDirectory);
    if ($files === false) {
        throw new MediaPathException('ไม่สามารถอ่านโฟลเดอร์สื่อได้', 500);
    }

    foreach (array_diff($files, ['.', '..']) as $file) {
        $filePath = $resolvedDirectory . DIRECTORY_SEPARATOR . $file;

        if (is_link($filePath)) {
            if (!unlink($filePath)) {
                throw new MediaPathException('ไม่สามารถลบลิงก์ในโฟลเดอร์สื่อได้', 500);
            }
            continue;
        }

        if (is_dir($filePath)) {
            delete_directory_within_root($filePath, $root);
            continue;
        }

        $resolvedFile = realpath($filePath);
        if ($resolvedFile === false || !path_is_within_root($resolvedFile, $root) || !unlink($resolvedFile)) {
            throw new MediaPathException('ไม่สามารถลบไฟล์สื่อได้', 500);
        }
    }

    if (!rmdir($resolvedDirectory)) {
        throw new MediaPathException('ไม่สามารถลบโฟลเดอร์สื่อได้', 500);
    }
}
