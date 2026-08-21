document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('addAdminForm');
    const feedback = window.AdminFormFeedback;
    if (!form) {
        console.error("addAdminForm not found");
        return;
    }

    form.addEventListener('submit', async function (event) {
        event.preventDefault();
        if (form.dataset.submitting === 'true') return;

        feedback.clear(form);
        const usernameInput = document.getElementById('username');
        const passwordInput = document.getElementById('password');
        const confirmPasswordInput = document.getElementById('confirmPassword');
        const username = usernameInput.value.trim();
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;

        if (!/^[a-zA-Z0-9_]{4,32}$/.test(username)) feedback.field(usernameInput, 'ชื่อผู้ใช้ต้องมี 4-32 ตัวอักษร และใช้เฉพาะ a-z, A-Z, 0-9, _');
        if (password.length < 6) feedback.field(passwordInput, 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
        if (!confirmPassword) feedback.field(confirmPasswordInput, 'กรุณายืนยันรหัสผ่าน');
        else if (password !== confirmPassword) feedback.field(confirmPasswordInput, 'รหัสผ่านไม่ตรงกัน');
        if (form.querySelector('[aria-invalid="true"]')) {
            feedback.focusFirstError(form);
            return;
        }

        const formData = new FormData();
        formData.append('username', username);
        formData.append('password', password);
        feedback.setSubmitting(form, true, 'กำลังเพิ่ม...');
        try {
            const response = await fetch("../api/add_users-admin.php", {
                method: "POST",
                body: formData
            });

            const data = await feedback.readJson(response);

            if (response.ok && data.success) {
                await feedback.success(data.message || 'เพิ่มผู้ดูแลระบบสำเร็จ');
                form.reset();
                feedback.clear(form);
            } else {
                if (response.status === 409) {
                    feedback.field(usernameInput, data.message || 'ชื่อผู้ใช้นี้มีอยู่แล้ว');
                    feedback.focusFirstError(form);
                }
                await feedback.error(data.message || 'ไม่สามารถเพิ่มผู้ดูแลระบบได้');
            }
        } catch (error) {
            console.error('Add admin error:', error);
            await feedback.error(error.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
        } finally {
            feedback.setSubmitting(form, false, 'กำลังเพิ่ม...');
        }
    });
});
