const img = document.querySelector(".music-image img");
// const audio = document.querySelector(".control-btn audio");

let id;
let oldNumber;
document.addEventListener("DOMContentLoaded", async (event) => {
    event.preventDefault();

    try {
        const queryString = window.location.search;
        const urlParams = new URLSearchParams(queryString);
        const musicNumber = urlParams.get("musicNumer"); // นำค่า musicNumber จาก URL

        if (musicNumber) {
            console.log("ค่า musicNumber ที่ได้จาก URL:", musicNumber);

            // const response = await fetch(`http://localhost:3000/music/${songNumber}`);
            const response = await fetch('../api/read_one-data.php?music_number=' + musicNumber);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const musicData = await response.json();
            console.log(musicData.result);
            console.log('ID', musicData.results[0].music_id);
            id = musicData.results[0].music_id;

            if (musicData.result && musicData.results.length > 0) {
                const songTitle = musicData.results[0].music_name;
                const songNumber = musicData.results[0].music_number;
                const songImage = musicData.results[0].music_img;
                const songAudio = musicData.results[0].music_audio;
                // ตั้งค่าข้อมูลลงใน input field SongTitle
                document.getElementById("SongTitle").value = songTitle;
                document.getElementById("songNumber").value = songNumber;
                img.src = "../images/" + songNumber + "/" + songImage;
                // กำหนดค่า src ให้กับแท็ก audio
                document.getElementById('myAudio').querySelector('source').src = "../music/" + songNumber + "/" + songAudio;
                // โหลดเสียงใหม่
                document.getElementById('myAudio').load();
                // oldNumber = songNumber;
                console.log("ข้อมูลเพลงถูกโหลดและแสดงแล้ว");
            } else {
                console.log("ไม่พบข้อมูลเพลงสำหรับหมายเลขที่ระบุ");
            }
        } else {
            musicNumber;
            return console.log("ไม่พบค่า musicNumber ใน URL");
        }
    } catch (error) {
        console.error("เกิดข้อผิดพลาดในการเรียกข้อมูล:", error);
    }
});

const EditMusicForm = document.getElementById("editMusicForm");

EditMusicForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const songFileInput = document.getElementById("songFile");
    const songImageInput = document.getElementById("songImage");
    const music_name = document.getElementById("SongTitle").value;
    //ค่าใหม่ music_number ใหม่
    const songNumber = document.getElementById("songNumber").value;

    //เก็บไว้สำหรับส่งapi
    const formData = new FormData();
    formData.append('songNumber', songNumber);
    formData.append('music_name', music_name);

    try {
        console.log('idที่จะส่งไป: ', id);
        const response = await fetch('../api/read_data-id.php?music_id=' + id);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const musics = await response.json();
        // ดักหมายเลขที่ซ้ำกับตัวอื่นยกเว้นตัวเลขเดิม
        // ถ้าส่งเปลี่ยนหมายเลขก็จะไม่มีidให้ดึง
        const check = await checkNumber(songNumber, musics);

        console.log("ตรวจสอบข้อมูลว่ามีซ้ำไหม: ", check);

        if (check) {
            console.log("หมายเลขซ้ำ");
            return Swal.fire('หมายเลขซ้ำ - มีหมายเลขนี้อยู่!', 'กรุณาเปลี่ยนหมายเลขอื่น', 'error').then(() => {
                // โหลดหน้าซ้ำ ใหม่         
                // location.reload();
                console.log("สมบูรณ์เรียบร้อย");
            });
        }

        console.log('musicsที่เรียกมา: ', musics);
        console.log('number จากtext:' + songNumber);
        console.log('number จากการดึง:' + musics.data[0].music_number);
        console.log('id เก่า' + id);
        console.log('id จากการดึง:' + musics.data[0].music_id);

        //มีเลขแล้ว
        if (songNumber == musics.data[0].music_number) {

            console.log('ไม่เปลี่ยนหมายเลข');

            const music_id = musics.data[0].music_id;
            formData.append('music_id', music_id);

            const responseAudio = await updateAudio(songNumber, musics, songFileInput);
            console.log("ได้รับผลลัพธ์: ", responseAudio);
            formData.append('music_audio', responseAudio);


            const res = await updateImg(formData, musics, songImageInput);
            if (res) {
                console.log("แก้ไขข้อมูลสำเร็จ");
                Swal.fire('สำเร็จ!', 'แก้ไขข้อมูลสำเร็จ', 'success').then(() => {
                    window.location = "./viewall.html";
                });
            } else {
                console.log("อัพเดตข้อมูลในฐานข้อมูลไม่สำเร็จ");
                Swal.fire('ไม่สำเร็จ!', 'อัพเดตข้อมูลในฐานข้อมูลไม่สำเร็จ', 'error').then(() => {
                    window.location = "./viewall.html";
                });
            }

        }
        // เปลี่ยนเลข
        if (songNumber != musics.data[0].music_number) {
            console.log('เปลี่ยนหมายเลข');

            const oldNumber = musics.data[0].music_number;
            const newNumber = songNumber;
            const formData2 = new FormData();
            formData2.append('oldNumber', oldNumber);
            formData2.append('newNumber', newNumber);
            console.log(newNumber);
            console.log(oldNumber);

            const response_Renumber = await fetch("../api/edit_folder.php", {
                method: 'POST',
                body: formData2,
            });

            if (response_Renumber.ok) {
                const succeed_Renumber = await response_Renumber.json();

                if (succeed_Renumber.result) {
                    console.log("สำเร็จในการเปลี่ยนเลข");
                } else {
                    console.error("เกิดข้อผิดพลาดในการอัปเดตรูปภาพ:", succeed_Renumber.message);
                    return false;
                }
            } else {
                console.error("เซิร์ฟเวอร์ส่งคืนข้อผิดพลาด:", response_Renumber.status, response_Renumber.statusText);
                return false;
            }

            const music_id = musics.data[0].music_id;
            formData.append('music_id', music_id);

            const responseAudio = await updateAudio(songNumber, musics, songFileInput);
            console.log("ได้รับผลลัพธ์: ", responseAudio);

            formData.append('music_audio', responseAudio);

            const res = await updateImg(formData, musics, songImageInput);

            if (res) {
                console.log("แก้ไขข้อมูลสำเร็จ");
                Swal.fire('สำเร็จ!', 'แก้ไขข้อมูลสำเร็จ', 'success').then(() => {
                    window.location = "./viewall.html";
                });
            } else {
                console.log("อัพเดตข้อมูลในฐานข้อมูลไม่สำเร็จ");
                Swal.fire('ไม่สำเร็จ!', 'อัพเดตข้อมูลในฐานข้อมูลไม่สำเร็จ', 'error').then(() => {
                    window.location = "./viewall.html";
                });
            }
        }
    } catch (error) {
        console.error("Error:" + error);
        Swal.fire('error!', 'ข้อผิดพลาด', 'error').then(() => {
            window.location = "./viewall.html";
        });
    }
});

async function checkNumber(songNumber, musics) {
    // ส่งเลขเดิม
    const checkNumber_response = await fetch('../api/read_data-check.php?music_number=' + musics.data[0].music_number);
    if (!checkNumber_response.ok) {
        throw new Error(`HTTP error! Status: ${checkNumber_response.status}`);
    }
    const number_check = await checkNumber_response.json();
    console.log("เลขใหม่ที่มา", songNumber);
    console.log("เลขเก่าเรียกข้อมูลมา", musics.data[0].music_number);
    // console.log(number_check.result)
    console.log("ข้อมูล: ", number_check);
    console.log("ข้อมูล: ", number_check.results[0]);
    let foundDuplicate = false;

    for (const number of number_check.results) {
        // นำเลขใหม่ตรวจสอบกับตัวเลขที่select มาทั้งหมดยกเว้นตัวเลขเก่าที่ไปดึงมา
        // เมื่อเงื่อนไขตรงก็จะหยุด ตัวเลขที่ดึงมายกเว้นเลขเก่าและนำเลขใหม่ที้ได้มาเทียบทั้งหมด
        console.log("เลขข้อมูลทั้งหมด", number.music_number);
        if (songNumber == number.music_number) {
            console.log("มีเลขซ้ำ หยุดการทำงาน");
            foundDuplicate = true;
            break;
        }
    };
    console.log("ไม่มีเลขซ้ำในข้อมูล ไปต่อ");
    return foundDuplicate;
}

async function updateAudio(songNumber, musics, songFileInput) {

    if (songFileInput.files.length === 0) {
        console.log("ไม่มีข้อมูลไฟล์เพลง");
        const music_audio = musics.data[0].music_audio;

        return music_audio;
    } else {
        const music_audio = songFileInput.files[0];

        const formData1 = new FormData();
        formData1.append('songNumber', songNumber);
        formData1.append("fileAudio", music_audio);

        console.log("มีข้อมูลไฟล์เพลง:", music_audio.name);

        // api อยู่ดีเพราะถ้าไปต่อแล้วไม่ได้ตรงไม่ได้อัพรูปก็จะ
        const response_music = await fetch("../api/edit_update-sound.php", {
            method: 'POST',
            body: formData1,
        });
        const edit_succeed_music = await response_music.json();

        if (edit_succeed_music.result) {
            console.log(edit_succeed_music.message);
            return music_audio.name;
        } else {
            console.log("ผิดพลาดในการแก้ไขข้อมูล" + edit_succeed_music.message);
            throw new Error("เกิดข้อผิดพลาดในการแก้ไขข้อมูล", edit_succeed_music.message);
        }
    }
}

async function updateImg(formData, musics, songImageInput) {
    if (songImageInput.files.length === 0) {
        console.log("ไม่มีข้อมูลไฟล์รูป");

        const music_img = musics.data[0].music_img;
        formData.append('music_img', music_img);

        const responseUpdate = await fetch("../api/edit_update.php", {
            method: 'POST',
            body: formData,
        });

        if (responseUpdate.ok) {
            const edit_succeed = await responseUpdate.json();

            if (edit_succeed.result) {
                return true;
            } else {
                console.error("เกิดข้อผิดพลาดในการอัปเดตรูปภาพ:", edit_succeed.message);
                return false;
            }
        } else {
            console.error("เซิร์ฟเวอร์ส่งคืนข้อผิดพลาด:", responseUpdate.status, responseUpdate.statusText);
            return false;
        }

    }
    //อัพรูป
    else {
        const music_img = songImageInput.files[0];
        console.log("มีข้อมูลไฟล์รูป:", music_img.name);

        formData.append('songImage', music_img);

        const response = await fetch("../api/edit_update-img.php",
            {
                method: 'POST',
                body: formData,
            });

        if (response.ok) {
            const edit_succeed = await response.json();

            if (edit_succeed.result) {
                return true;
            } else {
                console.error("เกิดข้อผิดพลาดในการอัปเดตรูปภาพ:", edit_succeed.message);
                return false;
            }
        } else {
            console.error("เซิร์ฟเวอร์ส่งคืนข้อผิดพลาด:", response.status, response.statusText);
            return false;
        }
    }
}
