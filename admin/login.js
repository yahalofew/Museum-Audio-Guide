document.addEventListener('DOMContentLoaded', function () {
    const loginForm = document.getElementById('loginForm');
    if (!loginForm) {
        console.error('loginForm not found');
        return;
    }

    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;

        if (!username || !password) {
            Swal.fire({
                title: 'กรุณากรอกข้อมูล',
                text: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน',
                icon: 'warning'
            });
            return;
        }

        try {
            const success = await login(username, password);
            if (success) {
                Swal.fire({
                    title: 'เข้าสู่ระบบสำเร็จ',
                    icon: 'success',
                    showConfirmButton: true,
                    confirmButtonText: 'ยืนยัน',
                    timer: 1500
                }).then(() => {
                    window.location.href = 'viewall.html';
                });
            } else {
                Swal.fire({
                    title: 'เข้าสู่ระบบล้มเหลว!',
                    text: 'บัญชีผู้ใช้หรือรหัสผ่านไม่ถูกต้อง',
                    icon: 'error'
                });
            }
        } catch (error) {
            console.error('Error:', error);
            Swal.fire({
                title: 'ข้อผิดพลาด',
                text: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ',
                icon: 'error'
            });
        }
    });
});

const login = async (username, password) => {
    try {
        const formData = new FormData();
        formData.append('username', username);
        formData.append('password', password);

        const response = await fetch('../api/Login.php', {
            method: 'POST',
            body: formData
        });

        const text = await response.text();
        console.log("Raw response:", text);
        const data = JSON.parse(text);

        if (response.ok && data.success) {
            console.log(data.message);
            return true;
        } else {
            console.error('Login Failed:', data.message);
            return false;
        }
    } catch (error) {
        console.error('เกิดปัญหากับการเชื่อมต่อ:', error);
        throw error;
    }
};


