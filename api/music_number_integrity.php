<?php

class MusicNumberConflictException extends RuntimeException
{
}

function music_number_exists($conn, $musicNumber, $excludeMusicId = null, $lock = false)
{
    $sql = 'SELECT music_id FROM music WHERE music_number = ?';
    if ($excludeMusicId !== null) {
        $sql .= ' AND music_id <> ?';
    }
    if ($lock) {
        $sql .= ' FOR UPDATE';
    }

    $stmt = $conn->prepare($sql);
    if ($excludeMusicId !== null) {
        $stmt->bind_param('ii', $musicNumber, $excludeMusicId);
    } else {
        $stmt->bind_param('i', $musicNumber);
    }
    $stmt->execute();
    $exists = $stmt->get_result()->num_rows > 0;
    $stmt->close();

    return $exists;
}

function assert_music_number_available($conn, $musicNumber, $excludeMusicId = null, $lock = false)
{
    if (music_number_exists($conn, $musicNumber, $excludeMusicId, $lock)) {
        throw new MusicNumberConflictException('มีหมายเลขนี้อยู่แล้ว กรุณาเปลี่ยนเป็นหมายเลขอื่น');
    }
}

function is_duplicate_music_number_error($error)
{
    return $error instanceof mysqli_sql_exception && (int) $error->getCode() === 1062;
}
