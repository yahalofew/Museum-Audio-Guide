// Ajex คืออส่งข้อมูลไปยังเซิร์ฟเวอร์และดึงข้อมูลกลับมาโดยไม่ต้องรีเฟรชหน้าเว็บทั้งหมด
//แบบปกติถ้าข้อมูลเยอะจะทำให้การโหลดลงตารางนานและเป็นแบบอะซิงโคนนัส

$(document).ready(function () {
    // document.title='View List'
    //กำหนดให้  Plug-in dataTable ทำงาน ใน ตาราง Html ที่มี id เท่ากับ example
    $('#myTable').DataTable(
        {
            'language': {
                'search': "ค้นหา",
                'lengthMenu': 'แสดง _MENU_ รายการ',
                "info": "แสดงรายการ _START_ ถึง _END_ จากทั้งหมด _TOTAL_ รายการ",
                "infoEmpty": "แสดงรายการ 0 ถึง 0 จากทั้งหมด 0 รายการ",
                'paginate': {
                    'first': 'หน้าแรก',
                    'last': 'หน้าสุดท้าย',
                    'next': 'ถัดไป',
                    'previous': 'ก่อนหน้า'
                },
                'show': 'แสดง'
            },
            // "dom": '<"dt-buttons"Bf><"clear">lirtp',
            // "paging": true,
            // "autoWidth": true
            // 'processing': true,
            // 'serverSide': true,
            'ajax': {
                'url': "../api/read_data.php", // URL ของ API ที่ให้ข้อมูล
                'type': 'GET', // หรือ 'POST' ตามการเรียกข้อมูล
                'dataSrc': '',
                // ถ้าข้อมูลอยู่ใน property 'data' ของ JSON
            },
            'columns': [

                {
                    'data': 'music_number',
                    'render': $.fn.dataTable.render.text()
                }, // ชื่อ column และ key ของข้อมูลใน JSON
                {
                    'data': 'music_name',
                    'render': $.fn.dataTable.render.text()
                },
                {
                    'data': 'music_img',
                    'render': function (data, type, row) {
                        // return `<img src="/PROJECT/images/${row.music_number}/${row.music_img}" alt="Music Image" width="80" height="80">`;
                        // เข้ารหัสตัวแปร row.music_number และ img เพื่อป้องกันไม่ให้ทำลายแท็ก <img>
                        //  html() ดึกเอาเฉพาะเนื้อหา div ไม่เอาแท็ก div ออกมา
                        //  div คำสั่งของ jQuery ที่ใช้สร้างองค์ประกอบ HTML ชั่วคราวเพื่อเข้ารหัสข้อมูลที่อาจเป็นอันตรายได้
                        var safeNumber = $('<div>').text(row.music_number).html();
                        var safeImg = $('<div>').text(row.music_img).html();
                        return `<img src="/PROJECT/images/${safeNumber}/${safeImg}" alt="Music Image" width="80" height="80">`;
                    }
                },
                // { 'data': 'music_audio' },
                {
                    'data': null,
                    'render': function (data, type, row) {
                        return `<audio controls playbackRate="1.0">
                        <source src="../music/${row.music_number}/${row.music_audio}">
                            เบราว์เซอร์นี้ไม่รองรับองค์ประกอบไฟล์เสียง
                        </audio>`;
                    }
                },
                {
                    // สร้างปุ่ม "แก้ไข"
                    'data': null,
                    'render': function (data, type, row) {
                        return '<button class="btn-edit" data-id="' + row.music_number + '" > <i class="fa-solid fa-pen"></i> แก้ไข </button>';
                    }
                },
                {
                    // สร้างปุ่ม "ลบ"
                    'data': null,
                    'render': function (data, type, row) {
                        return '<button class="btn-delete" data-id="' + row.music_number + '" > <i class="fa-solid fa-trash"></i> ลบ </button>';
                    }
                }
            ]
        }
    );

    $('#myTable').on('click', '.btn-edit', function () {
        var musicnumber = $(this).data('id');
        // ต้องการทำอะไรต่อเขียนต่อตรงส่วนนี้
        console.log('คลิกปุ่มแก้ไขหมายเลขเพลง: ' + musicnumber);
        window.location.href = './dashboard_edit.html?musicNumer=' + musicnumber;
    });

    $('#myTable').on('click', '.btn-delete', function () {
        var musicnumber = $(this).data('id');
        Swal.fire({
            title: 'คุณต้องการทำรายการนี้หรือไม่?',
            showCancelButton: true,
            confirmButtonText: 'ยืนยัน',
            cancelButtonText: 'ยกเลิก',
            icon: 'warning'

        }).then(async (result) => {
            // ถ้าผู้ใช้คลิก "ยืนยัน"
            if (result.isConfirmed) {
                console.log('คลิกปุ่มลบหมายเลขเพลง: ' + musicnumber);

                const succeed = await btnDelete(musicnumber);
                console.log(succeed);
                if (!succeed) {
                    Swal.fire('มีข้อผิดพลาดในการเชื่อมต่อ', 'โปรดลองอีกครั้ง', 'error');
                } else {
                    Swal.fire('ทำรายการเรียบร้อย!', '', 'success').then(() => {
                        // โหลดหน้าซ้ำ ใหม่
                        location.reload();
                    });
                }
            } else if (result.dismiss === Swal.DismissReason.cancel) {
                // ถ้าผู้ใช้คลิก "ยกเลิก"
                Swal.fire('ยกเลิกรายการ', '', 'error');
            }
        });
    });
});

const btnDelete = async (songNumber) => {
    try {
        console.log("กำลังส่ง:", songNumber);
        const formData = new FormData();
        formData.append('songNumber', songNumber);

        const response = await fetch('../api/delete_sound.php', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        console.log(data);

        if (response.ok) {
            if ('result' in data) {
                return data.result;
            } else {
                console.error('Invalid JSON response:', data);
                return false;
            }
        } else {
            console.error('เซิร์ฟเวอร์ตอบกลับโดยมีข้อผิดพลาด:', response.status, response.statusText);
            return false;
        }
    } catch (error) {
        console.error('ข้อผิดพลาดในการดึงข้อมูล:' + error);
        return false;
    }


}

// function logout() {
//     // ส่งคำร้องขอไปยังเซิร์ฟเวอร์เพื่อลบเซสชัน
//     // สามารถใช้ fetch() หรือ XMLHttpRequest สำหรับการส่งคำร้องขอไปยังไฟล์ PHP หรือ URL ที่ทำหน้าที่ในการลบเซสชันได้

//     // ตัวอย่างโค้ด fetch():
//     fetch('../api/logout.php')
//         .then(response => {
//             if (response.ok) {
//                 // ลบข้อมูลการเข้าสู่ระบบในเบราว์เซอร์ (เช่น cookie, session storage, local storage)
//                 // และเปลี่ยนเส้นทางไปยังหน้าล็อกอิน
//                 window.location.href = '../login.html';
//             } else {
//                 console.error('ไม่สามารถออกจากระบบได้');
//             }
//         })
//         .catch(error => {
//             console.error('เกิดข้อผิดพลาดในการออกจากระบบ:', error);
//         });
// }


