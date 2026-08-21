-- Verify this query returns no rows before applying the constraint:
-- SELECT music_number, COUNT(*) FROM music GROUP BY music_number HAVING COUNT(*) > 1;

ALTER TABLE `music`
  ADD UNIQUE KEY `uq_music_music_number` (`music_number`);
