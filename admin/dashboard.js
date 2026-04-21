
document.getElementById('musicForm').addEventListener('submit', async (event) => {
    event.preventDefault();


    const songTitle = document.getElementById('songTitle').value;
    const songNumber = document.getElementById('songNumber').value;
    const songFile = document.getElementById('songFile').files[0];
    const songImage = document.getElementById('songImage').files[0];

    const formData = new FormData();
    formData.append('songTitle', songTitle);
    formData.append('songNumber', songNumber);
    formData.append('songFile', songFile);
    formData.append('songImage', songImage);

    try {

        // const response = await fetch('http://localhost:3000/music/' + songNumber);
        // const musics = await response.json();
        const response = await fetch('../api/read_one-data.php?music_number=' + songNumber);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const musics = await response.json();

        console.log(songNumber);
        console.log(musics);
        // console.log(musics.results[0].music_number);
        if (musics.result) {
            return Swal.fire({
                title: 'มีหมายเลขนี้อยู่แล้ว กรุณาเปลี่ยนเป็นหมายเลขอื่น!',
                text: 'หมายเลขซ้ำ',
                icon: 'error'
            });
        }
        if (!musics.result) {
            console.log('เพิ่ม');
            const responseAdd = await fetch('../api/add-sound.php', {
                method: 'POST',
                body: formData
            });

            if (!responseAdd.ok) {
                throw new Error(`HTTP error! Status: ${responseAdd.status}`);
            }

            const data = await responseAdd.json();
            if (data.success) {
                Swal.fire('สำเร็จ!', 'เพิ่มข้อมูลสำเร็จ', 'success').then(() => {
                    location.reload();
                });
                // เพิ่มโค้ดสำหรับการดำเนินการหลังบันทึกข้อมูลเพลงเสร็จ
            } else {
                return Swal.fire('มีข้อผิดพลาดในการเชื่อมต่อ', 'โปรดลองอีกครั้ง', 'error');
            }
        }
    } catch (error) {
        Swal.fire('error!', 'ข้อผิดพลาด', 'error').then(() => {
            location.reload();
        });
    }
});




