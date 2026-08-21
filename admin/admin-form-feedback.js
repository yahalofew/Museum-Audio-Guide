(function () {
    function clear(form) {
        form.querySelectorAll('.field-error').forEach((error) => error.remove());
        form.querySelectorAll('[aria-invalid="true"]').forEach((field) => {
            field.removeAttribute('aria-invalid');
            field.removeAttribute('aria-describedby');
        });
    }

    function field(input, message) {
        document.getElementById(`${input.id}-error`)?.remove();
        const error = document.createElement('small');
        const errorId = `${input.id}-error`;
        error.id = errorId;
        error.className = 'field-error';
        error.textContent = message;
        input.setAttribute('aria-invalid', 'true');
        input.setAttribute('aria-describedby', errorId);
        input.insertAdjacentElement('afterend', error);
    }

    function focusFirstError(form) {
        const input = form.querySelector('[aria-invalid="true"]');
        if (input) input.focus();
    }

    function setSubmitting(form, submitting, submittingText) {
        const button = form.querySelector('button[type="submit"]');
        if (!button) return;
        if (!button.dataset.defaultText) button.dataset.defaultText = button.textContent.trim();
        form.dataset.submitting = submitting ? 'true' : 'false';
        form.setAttribute('aria-busy', submitting ? 'true' : 'false');
        button.disabled = submitting;
        button.textContent = submitting ? submittingText : button.dataset.defaultText;
    }

    function success(message) {
        return Swal.fire({ title: 'สำเร็จ!', text: message, icon: 'success', confirmButtonText: 'ตกลง' });
    }

    function error(message) {
        return Swal.fire({ title: 'ไม่สำเร็จ!', text: message, icon: 'error', confirmButtonText: 'ตกลง' });
    }

    async function readJson(response) {
        const text = await response.text();
        try {
            return text ? JSON.parse(text) : {};
        } catch (parseError) {
            console.error('Invalid JSON response:', text);
            throw new Error('เซิร์ฟเวอร์ตอบกลับในรูปแบบที่ไม่ถูกต้อง');
        }
    }

    window.AdminFormFeedback = { clear, error, field, focusFirstError, readJson, setSubmitting, success };
}());
