document.querySelectorAll('input[type="file"][data-preview-target]').forEach((input) => {
    const preview = document.getElementById(input.dataset.previewTarget);
    if (!preview) return;

    let objectUrl;

    input.addEventListener('change', () => {
        if (objectUrl) URL.revokeObjectURL(objectUrl);

        const file = input.files[0];
        if (!file) {
            preview.removeAttribute('src');
            preview.hidden = true;
            objectUrl = undefined;
            return;
        }

        objectUrl = URL.createObjectURL(file);
        preview.src = objectUrl;
        preview.hidden = false;

        if (preview.tagName === 'IMG') {
            preview.alt = `ตัวอย่างรูปภาพ ${file.name}`;
        }
    });

    window.addEventListener('pagehide', () => {
        if (objectUrl) URL.revokeObjectURL(objectUrl);
    });
});
