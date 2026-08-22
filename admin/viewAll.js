(function () {
'use strict';

$(document).ready(function () {
    const listState = document.getElementById('listState');
    const stateTitle = listState.querySelector('.state-title');
    const stateMessage = listState.querySelector('.state-message');
    const retryButton = document.getElementById('retryList');
    const tableRegion = document.querySelector('.table-region');
    const recordCount = document.getElementById('recordCount');
    const labels = ['หมายเลขเสียง', 'ชื่อเสียง', 'รูปภาพประกอบ', 'เสียงบรรยาย', 'สถานะ Media', 'จัดการ'];

    function setListState(state, title, message) {
        listState.className = `list-state is-${state}`;
        tableRegion.className = `table-region is-${state}`;
        tableRegion.setAttribute('aria-busy', state === 'loading' ? 'true' : 'false');
        stateTitle.textContent = title || '';
        stateMessage.textContent = message || '';
        retryButton.hidden = state !== 'error';
    }

    function escapeAttribute(value) {
        return String(value == null ? '' : value).replace(/[&<>"']/g, function (character) {
            return {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            }[character];
        });
    }

    function mediaPath(root, number, filename) {
        return `../${root}/${encodeURIComponent(number)}/${encodeURIComponent(filename)}`;
    }

    function missingTypes(row) {
        return row.media_status === 'missing' && Array.isArray(row.missing_media)
            ? row.missing_media
            : [];
    }

    function missingPlaceholder(type) {
        const label = type === 'audio' ? 'ไม่พบไฟล์เสียง' : 'ไม่พบรูปภาพ';
        const icon = type === 'audio' ? 'fa-volume-xmark' : 'fa-image';
        return `<span class="media-placeholder"><i class="fa-solid ${icon}" aria-hidden="true"></i>${label}</span>`;
    }

    function mediaStatus(row) {
        const missing = missingTypes(row);
        if (missing.length === 0) {
            return '<span class="media-status"><i class="fa-solid fa-circle-check" aria-hidden="true"></i>พร้อมใช้งาน</span>';
        }

        let label = 'Media ไม่ครบ';
        if (missing.includes('audio') && missing.includes('image')) label = 'ไม่พบเสียงและรูปภาพ';
        else if (missing.includes('audio')) label = 'ไม่พบไฟล์เสียง';
        else if (missing.includes('image')) label = 'ไม่พบรูปภาพ';
        return `<span class="media-status is-missing"><i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>${label}</span>`;
    }

    const table = $('#myTable').DataTable({
        language: {
            search: 'ค้นหา',
            lengthMenu: 'แสดง _MENU_ รายการ',
            info: 'แสดงรายการ _START_ ถึง _END_ จากทั้งหมด _TOTAL_ รายการ',
            infoEmpty: 'ไม่มีรายการเสียงบรรยาย',
            zeroRecords: 'ไม่พบรายการที่ตรงกับการค้นหา',
            paginate: {
                first: 'หน้าแรก',
                last: 'หน้าสุดท้าย',
                next: 'ถัดไป',
                previous: 'ก่อนหน้า'
            }
        },
        ajax: function (_request, callback) {
            setListState('loading', 'กำลังโหลดรายการ', 'กรุณารอสักครู่');
            recordCount.textContent = 'กำลังโหลดข้อมูล...';

            fetch('../api/read_data.php')
                .then(async function (response) {
                    const text = await response.text();
                    let data;
                    try {
                        data = text ? JSON.parse(text) : [];
                    } catch (error) {
                        throw new Error('เซิร์ฟเวอร์ตอบกลับในรูปแบบที่ไม่ถูกต้อง');
                    }
                    if (!response.ok || !Array.isArray(data)) {
                        throw new Error(data && data.message ? data.message : 'ไม่สามารถโหลดรายการเสียงบรรยายได้');
                    }
                    return data;
                })
                .then(function (data) {
                    recordCount.textContent = `ทั้งหมด ${data.length} รายการ`;
                    if (data.length === 0) {
                        setListState('empty', 'ยังไม่มีรายการเสียงบรรยาย', 'เพิ่มเสียงบรรยายใหม่เพื่อเริ่มต้นใช้งาน');
                    } else {
                        setListState('ready', '', '');
                    }
                    callback({ data: data });
                })
                .catch(function (error) {
                    console.error('Audio list load error:', error);
                    recordCount.textContent = 'ไม่สามารถแสดงจำนวนรายการได้';
                    setListState('error', 'โหลดรายการไม่สำเร็จ', error.message || 'กรุณาลองใหม่อีกครั้ง');
                    callback({ data: [] });
                });
        },
        columns: [
            { data: 'music_number', render: $.fn.dataTable.render.text() },
            { data: 'music_name', render: $.fn.dataTable.render.text() },
            {
                data: 'music_img',
                orderable: false,
                render: function (data, type, row) {
                    if (type !== 'display') return data;
                    if (missingTypes(row).includes('image')) return missingPlaceholder('image');
                    const source = mediaPath('images', row.music_number, row.music_img);
                    return `<img class="media-thumbnail" src="${source}" alt="ภาพประกอบ ${escapeAttribute(row.music_name)}" loading="lazy">`;
                }
            },
            {
                data: 'music_audio',
                orderable: false,
                render: function (data, type, row) {
                    if (type !== 'display') return data;
                    if (missingTypes(row).includes('audio')) return missingPlaceholder('audio');
                    const source = mediaPath('music', row.music_number, row.music_audio);
                    return `<audio class="table-audio" controls preload="none"><source src="${source}">เบราว์เซอร์นี้ไม่รองรับไฟล์เสียง</audio>`;
                }
            },
            {
                data: null,
                orderable: false,
                searchable: false,
                render: function (_data, type, row) {
                    return type === 'display' ? mediaStatus(row) : missingTypes(row).join(' ');
                }
            },
            {
                data: null,
                orderable: false,
                searchable: false,
                render: function (_data, type, row) {
                    if (type !== 'display') return row.music_number;
                    const number = escapeAttribute(row.music_number);
                    return `<div class="row-actions">
                        <button type="button" class="action-button is-edit btn-edit" data-id="${number}" aria-label="แก้ไขเสียงหมายเลข ${number}">
                            <i class="fa-solid fa-pen" aria-hidden="true"></i>แก้ไข
                        </button>
                        <button type="button" class="action-button is-delete btn-delete" data-id="${number}" aria-label="ลบเสียงหมายเลข ${number}">
                            <i class="fa-solid fa-trash" aria-hidden="true"></i>ลบ
                        </button>
                    </div>`;
                }
            }
        ],
        createdRow: function (row) {
            $(row).find('td').each(function (index) {
                this.dataset.label = labels[index];
            });
        }
    });

    retryButton.addEventListener('click', function () {
        table.ajax.reload();
    });

    $('#myTable').on('click', '.btn-edit', function () {
        const musicNumber = $(this).data('id');
        window.location.href = `./dashboard_edit.html?musicNumer=${encodeURIComponent(musicNumber)}`;
    });

    $('#myTable').on('click', '.btn-delete', async function () {
        const button = this;
        const musicNumber = $(button).data('id');
        const result = await Swal.fire({
            title: 'ยืนยันการลบเสียงบรรยาย?',
            text: `หมายเลข ${musicNumber} จะถูกลบพร้อมไฟล์เสียงและรูปภาพ`,
            showCancelButton: true,
            confirmButtonText: 'ลบรายการ',
            cancelButtonText: 'ยกเลิก',
            confirmButtonColor: '#c62828',
            icon: 'warning'
        });

        if (!result.isConfirmed) return;

        const defaultContent = button.innerHTML;
        button.disabled = true;
        button.innerHTML = '<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i>กำลังลบ';
        const response = await deleteSound(musicNumber);
        button.disabled = false;
        button.innerHTML = defaultContent;

        if (!response.success) {
            await Swal.fire('ลบไม่สำเร็จ!', response.message, 'error');
            return;
        }

        await Swal.fire('สำเร็จ!', response.message || 'ลบรายการเรียบร้อยแล้ว', 'success');
        table.ajax.reload(null, false);
    });

    document.getElementById('myTable').addEventListener('error', function (event) {
        const media = event.target;
        if (media.matches('.media-thumbnail')) {
            const row = media.closest('tr');
            media.replaceWith(createPlaceholder('image'));
            markRuntimeMediaError(row, 'ไม่พบรูปภาพ');
        } else if (media.matches('.table-audio, .table-audio source')) {
            const audio = media.closest('audio') || media;
            const row = audio.closest('tr');
            audio.replaceWith(createPlaceholder('audio'));
            markRuntimeMediaError(row, 'ไม่พบไฟล์เสียง');
        }
    }, true);

    function createPlaceholder(type) {
        const wrapper = document.createElement('span');
        wrapper.className = 'media-placeholder';
        wrapper.innerHTML = missingPlaceholder(type);
        const nested = wrapper.querySelector('.media-placeholder');
        return nested || wrapper;
    }

    function markRuntimeMediaError(row, label) {
        if (!row) return;
        const badge = row.querySelector('.media-status');
        if (!badge) return;
        badge.className = 'media-status is-missing';
        badge.innerHTML = `<i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>${label}`;
    }
});

async function deleteSound(songNumber) {
    try {
        const formData = new FormData();
        formData.append('songNumber', songNumber);
        const response = await fetch('../api/delete_sound.php', { method: 'POST', body: formData });
        const text = await response.text();
        let data;
        try {
            data = text ? JSON.parse(text) : {};
        } catch (error) {
            return { success: false, message: 'เซิร์ฟเวอร์ตอบกลับในรูปแบบที่ไม่ถูกต้อง' };
        }
        return {
            success: response.ok && data.result === true,
            message: data.message || 'เกิดข้อผิดพลาดในการลบรายการ'
        };
    } catch (error) {
        console.error('Delete audio error:', error);
        return { success: false, message: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาลองใหม่' };
    }
}

}());
