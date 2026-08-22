(function () {
'use strict';

const musicForm = document.getElementById('musicForm');
const feedback = window.AdminFormFeedback;

musicForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (musicForm.dataset.submitting === 'true') return;

    feedback.clear(musicForm);
    const songTitleInput = document.getElementById('songTitle');
    const songNumberInput = document.getElementById('songNumber');
    const songFileInput = document.getElementById('songFile');
    const songImageInput = document.getElementById('songImage');
    const songTitle = songTitleInput.value.trim();
    const songNumber = songNumberInput.value.trim();

    if (!/^\d+$/.test(songNumber)) feedback.field(songNumberInput, 'กรุณากรอกหมายเลขเสียงเป็นตัวเลข');
    if (!songTitle) feedback.field(songTitleInput, 'กรุณากรอกชื่อเสียง');
    if (!songFileInput.files[0]) feedback.field(songFileInput, 'กรุณาเลือกไฟล์เสียง');
    if (!songImageInput.files[0]) feedback.field(songImageInput, 'กรุณาเลือกรูปภาพประกอบ');
    if (musicForm.querySelector('[aria-invalid="true"]')) {
        feedback.focusFirstError(musicForm);
        return;
    }

    const formData = new FormData();
    formData.append('songTitle', songTitle);
    formData.append('songNumber', songNumber);
    formData.append('songFile', songFileInput.files[0]);
    formData.append('songImage', songImageInput.files[0]);

    feedback.setSubmitting(musicForm, true, 'กำลังบันทึก...');
    try {
        const response = await fetch('../api/read_one-data.php?music_number=' + encodeURIComponent(songNumber));
        const musics = await feedback.readJson(response);
        if (!response.ok) throw new Error(musics.message || 'ไม่สามารถตรวจสอบหมายเลขเสียงได้');

        if (musics.result) {
            feedback.field(songNumberInput, 'หมายเลขเสียงนี้มีอยู่แล้ว กรุณาใช้หมายเลขอื่น');
            feedback.focusFirstError(musicForm);
            await feedback.error('หมายเลขเสียงนี้มีอยู่แล้ว กรุณาใช้หมายเลขอื่น');
            return;
        }

        const responseAdd = await fetch('../api/add-sound.php', { method: 'POST', body: formData });
        const data = await feedback.readJson(responseAdd);
        if (!responseAdd.ok || !data.success) throw new Error(data.message || 'ไม่สามารถเพิ่มข้อมูลได้');

        await feedback.success(data.message || 'เพิ่มข้อมูลสำเร็จ');
        location.reload();
    } catch (error) {
        console.error('Add audio error:', error);
        await feedback.error(error.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
    } finally {
        feedback.setSubmitting(musicForm, false, 'กำลังบันทึก...');
    }
});

}());
