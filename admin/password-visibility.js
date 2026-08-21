document.querySelectorAll('[data-password-target]').forEach((button) => {
    const input = document.getElementById(button.dataset.passwordTarget);
    if (!input) return;

    button.setAttribute('aria-label', `แสดง${input.labels[0]?.textContent || 'รหัสผ่าน'}`);

    const setVisibility = (showPassword) => {
        input.type = showPassword ? 'text' : 'password';
        button.textContent = showPassword ? 'ซ่อน' : 'แสดง';
        button.setAttribute('aria-pressed', String(showPassword));
        button.setAttribute('aria-label', `${showPassword ? 'ซ่อน' : 'แสดง'}${input.labels[0]?.textContent || 'รหัสผ่าน'}`);
    };

    button.addEventListener('click', () => {
        setVisibility(input.type === 'password');
        input.focus();
    });

    input.form?.addEventListener('reset', () => {
        setTimeout(() => setVisibility(false), 0);
    });
});
