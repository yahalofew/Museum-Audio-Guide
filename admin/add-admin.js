document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("addAdminForm");
    if (!form) {
        console.error("addAdminForm not found");
        return;
    }

    form.addEventListener("submit", async function (event) {
        event.preventDefault();

        const username = document.getElementById("username").value.trim();
        const password = document.getElementById("password").value;
        const confirmPassword = document.getElementById("confirmPassword")?.value;

        // Validation
        if (!username || !password) {
            Swal.fire('Error!', 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน', 'error');
            return;
        }

        if (username.length < 4) {
            Swal.fire('Error!', 'ชื่อผู้ใช้ต้องมีอย่างน้อย 4 ตัวอักษร', 'error');
            return;
        }

        if (password.length < 6) {
            Swal.fire('Error!', 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร', 'error');
            return;
        }

        if (confirmPassword !== undefined && password !== confirmPassword) {
            Swal.fire('Error!', 'รหัสผ่านไม่ตรงกัน', 'error');
            return;
        }

        const formData = new FormData();
        formData.append('username', username);
        formData.append('password', password);
        try {
            const response = await fetch("../api/add_users-admin.php", {
                method: "POST",
                body: formData
            });

            const text = await response.text();
            console.log("Response text:", text);

            const data = await response.json();

            if (response.ok && data.success) {
                Swal.fire({
                    title: 'สำเร็จ!',
                    text: data.message || 'เพิ่มผู้ดูแลระบบสำเร็จ',
                    icon: 'success',
                    confirmButtonText: 'ตกลง'
                }).then(() => {
                    form.reset();
                    // Optional: redirect to admin list or dashboard
                    // window.location.href = 'viewall.html';
                });
            } else {
                Swal.fire({
                    title: 'Error!',
                    text: data.message || 'ไม่สามารถเพิ่มผู้ดูแลระบบได้',
                    icon: 'error'
                });
            }
        } catch (error) {
            console.error('Error:', error);
            Swal.fire({
                title: 'Error!',
                text: 'เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์',
                icon: 'error'
            });
        }
    });
});