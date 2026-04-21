const content = document.querySelector(".content"),
  Playimage = content.querySelector(".music-image img"),
  musicName = content.querySelector(".music-titles .name"),
  musicArtist = content.querySelector(".music-titles .artist"),

  Audio = document.querySelector(".main-song"),
  playBtn = content.querySelector(".play-pause"),
  playBtnIcon = content.querySelector(".play-pause span"),
  // ID ปุ่มถัดไปและก่อนหน้า
  prevBtn = content.querySelector("#prev"),
  // ID ปุ่มถัดไป
  nextBtn = content.querySelector("#next"),

  progressBar = content.querySelector(".progress-bar"),
  progressDetails = content.querySelector(".progress-details");

let loadSongs;
let index = 1;

// เหมือนหน้าเว็บโหลดเสร็จแล้วจะทำทำงาน
window.addEventListener("load", () => {
  loadData();
});

//เมื่อหน้าเว็บโหลดเสร็จ จะทำฟังก์ชันนี้ จะทำการโหลดนำเพลงเข้า songslist เอาเพลงแรกมาใส่
//เป็นส่วน โหลดเพลงเมื่อหน้าเว็บที่ใช้ 
async function loadData() {
  fetchData(function (error, data) {
    if (error) {
      console.log('เกิดข้อผิดพลาด', error);
    } else {
      var dataNumber = 1;
      var maxValue = Math.max(...data.map(item => parseInt(item.music_number)));
      while (dataNumber <= maxValue) {
        let found = false;
        data.forEach((number, indexNext) => {
          if (dataNumber == number.music_number) {
            musicName.innerHTML = " - " + number.music_name;
            musicArtist.innerHTML = number.music_number;
            Playimage.src = "images/" + number.music_number + "/" + number.music_img;
            Audio.src = "music/" + number.music_number + "/" + number.music_audio;
            found = true;
            index = indexNext + 1;
            return;
          }
        });
        if (found) {
          break;
        }
        dataNumber++;
      };
    }
  });
}

//ฟังก์ชั้นไปข้างหน้า
async function loadDatatoNext(indexValue) {
  fetchData(function (error, data) {
    if (error) {
      console.log('เกิดข้อผิดพลาด', error);
    } else {
      var dataNumber = parseInt(data[indexValue - 1].music_number);
      var maxValue = Math.max(...data.map(item => parseInt(item.music_number)));
      // ตัวเลขน้อบกว่าเลขมากกสุด
      while (dataNumber <= maxValue) {
        dataNumber++;
        let found = false;
        data.forEach((number, indexNext) => {
          // 2 == 1, 2, 3, 4, 5 จนกว่าจะเจอ ถ้าไม่เจอออกลูปมาเพิ่มค่าแล้วมาลูปใหม่
          // 2=1, 2=2 -> ture
          if (dataNumber == number.music_number) {
            musicName.innerHTML = " - " + number.music_name;
            musicArtist.innerHTML = number.music_number;
            Playimage.src = "images/" + number.music_number + "/" + number.music_img;
            Audio.src = "music/" + number.music_number + "/" + number.music_audio;
            playSong();
            found = true;
            // index -> 0,1,2,3,4,5,6,7, จะต้อง+1 เพราะเราตั้งเริ่มแรกที่1 
            index = indexNext + 1;
            return;

          }
        });
        // 
        if (dataNumber > maxValue) {
          // ถ้าตัวเลขมากกว่าตัวเลขทั้งหมดให้เริ่มใหม่
          loadData();
          playSong();
          return;
        }
        if (found) {
          break;
        }
      };
    }
  });
};

//ฟังก์ชั้นย้อนหลัง
async function loadDatatoPrev(indexValue) {
  fetchData(function (error, data) {
    if (error) {
      console.log('เกิดข้อผิดพลาด', error);
    } else {
      var dataNumber = parseInt(data[indexValue - 1].music_number);
      var minValue = Math.min(...data.map(item => parseInt(item.music_number)));
      var maxValue = Math.max(...data.map(item => parseInt(item.music_number)));

      console.log("เลขต่ำสุด", minValue);
      // 3 >= 1 ture
      // 1 >= 1 ture
      // 0 >= 1 false
      // เลขมากกว่า เลขต่ำสุด
      while (dataNumber >= minValue) {
        // ลบจาก3 > =2
        // 2 > = 1
        // 1 > 0 แล้วออก แต่ยังไม่ออกก่อนมาอีกรอบ
        dataNumber--;
        let found = false;
        data.forEach((number, indexPrev) => {
          // 2 == 1, 2, 3, 4, 5 จนกว่าจะเจอ ถ้าไม่เจอออกลูปมาเพิ่มค่าแล้วมาลูปใหม่
          // 2 == 2 หา
          if (dataNumber == number.music_number) {
            musicName.innerHTML = " - " + number.music_name;
            musicArtist.innerHTML = number.music_number;
            Playimage.src = "images/" + number.music_number + "/" + number.music_img;
            Audio.src = "music/" + number.music_number + "/" + number.music_audio;
            playSong();
            found = true;
            // index -> 0,1,2,3,4,5,6,7, จะต้อง+1 เพราะเราตั้งเริ่มแรกที่1 
            index = indexPrev + 1;
            return;
          }
        });
        // น้อยกว่า 0
        if (dataNumber < minValue) {
          data.forEach((number, indexPrev) => {
            if (maxValue == number.music_number) {
              musicName.innerHTML = " - " + number.music_name;
              musicArtist.innerHTML = number.music_number;
              Playimage.src = "images/" + number.music_number + "/" + number.music_img;
              Audio.src = "music/" + number.music_number + "/" + number.music_audio;
              playSong();
              found = true;
              // index -> 0,1,2,3,4,5,6,7, จะต้อง+1 เพราะเราตั้งเริ่มแรกที่1 
              index = indexPrev + 1;
              return;
            }
          });
        }
        // 0 <= 1 น้อยกว่านั้นเริ่มจากมากสุดแทน
        if (found) {
          break;
        }
      };
    }
  });
}

//ตัวหยุดและเล่น
playBtn.addEventListener("click", () => {
  //ตรวจสอบว่ามี paused อยู่ไหม classList.contains ไม่add แล้วจะใส่ turn/false 
  const isMusicPaused = content.classList.contains("paused");
  if (isMusicPaused) {
    pauseSong();
  }
  else {
    playSong();
  }
});


//เล่นเสียง play -> paused
function playSong() {

  content.classList.add("paused");
  playBtnIcon.innerHTML = "pause";
  Audio.play();
  // playBtn.innerHTML = '<i class="fa fa-pause-circle fa-5x">'
  // playBtn.innerHTML = '<i class="fa-solid fa-play"></i>'

}
//หยุด จาก paused -> play
function pauseSong() {

  content.classList.remove("paused");
  playBtnIcon.innerHTML = "play_arrow";
  Audio.pause();

}
nextBtn.addEventListener("click", () => {
  console.log(index);
  loadDatatoNext(index);
});

prevBtn.addEventListener("click", () => {
  console.log(index);
  loadDatatoPrev(index);
});

let isDragging = false;

progressDetails.addEventListener("mousedown", (e) => {
  isDragging = true;
  updateProgress(e);
});

progressDetails.addEventListener("mousemove", (e) => {
  if (isDragging) {
    updateProgress(e);
  }
});

document.addEventListener("mouseup", () => {
  isDragging = false;
});

progressDetails.addEventListener("touchstart", (e) => {
  isDragging = true;
  updateProgress(e.touches[0]); // เพียงแก้ไขตำแหน่งแรกเท่านั้น
});

progressDetails.addEventListener("touchmove", (e) => {
  if (isDragging) {
    updateProgress(e.touches[0]); // เพียงแก้ไขตำแหน่งแรกเท่านั้น
  }
});

document.addEventListener("touchend", () => {
  isDragging = false;
});

function updateProgress(e) {
  const progressValue = progressDetails.clientWidth; // ความกว้างของแถบหลอดเสียง
  const clickedOffsetX = e.clientX - progressDetails.getBoundingClientRect().left; // ค่าตำแหน่ง X ของเมาส์เมื่อคลิกบนแถบหลอดเสียง
  const musicDuration = Audio.duration; // ระยะเวลาทั้งหมดของเพลง

  const newTime = (clickedOffsetX / progressValue) * musicDuration;
  Audio.currentTime = newTime;
}

Audio.addEventListener("timeupdate", function (e) {
  const initialTime = e.target.currentTime;
  const finalTime = e.target.duration;
  let barWidth = (initialTime / finalTime) * 100;
  progressBar.style.width = barWidth + "%";

  // แสดงเวลาปัจจุบันในแถบเวลา
  let currentTimeData = progressDetails.querySelector(".current");
  let currentMinutes = Math.floor(initialTime / 60);
  let currentSeconds = Math.floor(initialTime % 60);
  if (currentSeconds < 10) {
    currentSeconds = "0" + currentSeconds;
  }
  currentTimeData.innerText = currentMinutes + ":" + currentSeconds;
});

progressDetails.addEventListener("click", function (e) {
  let progressValue = progressDetails.clientWidth;
  let clickedOffsetX = e.clientX - progressDetails.getBoundingClientRect().left;
  let musicDuration = Audio.duration;

  // คำนวณเวลาใหม่ที่จะเล่นต่อไป
  Audio.currentTime = (clickedOffsetX / progressValue) * musicDuration;
});

// คำนวณเวลาสุดท้ายและแสดงในแถบเวลา
Audio.addEventListener("loadeddata", function () {
  let finalTimeData = progressDetails.querySelector(".final");
  let audioDuration = Audio.duration;
  let finalMinutes = Math.floor(audioDuration / 60);
  let finalSeconds = Math.floor(audioDuration % 60);
  if (finalSeconds < 10) {
    finalSeconds = "0" + finalSeconds;
  }
  finalTimeData.innerText = finalMinutes + ":" + finalSeconds;
});

//เมื่อเพลงจบลงจะขึ้นเพลงต่อไป
Audio.addEventListener("ended", async () => {

  fetchData(function (error, data) {
    if (error) {
      console.log('เกิดข้อผิดพลาด', error);
    } else {
      loadDatatoNext(index);
      playSong();
    }
  });
});

const displayNumber = document.querySelector('.display-number');
const buttons = document.querySelectorAll('.number-button');
let currentNumber = "";
let timeoutId; // เก็บ ID ของ setTimeout

//ส่วนปุ่มหมายเลข
buttons.forEach(button => {
  button.addEventListener('click', () => {
    const number = button.getAttribute('data-number');
    currentNumber += number;
    displayNumber.textContent = currentNumber;
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      playSongById();
    }, 3000);
  });
});


async function playSongById() {
  fetchData(function (error, data) {
    if (error) {
      console.log('เกิดข้อผิดพลาด', error);
    } else {
      // loadSound = await fetchMusicData();
      const audio = document.querySelector('.main-song');
      const songTitle = document.querySelector('.name');
      // เปลี่ยนชื่อให้ตรง
      const songArtist = document.querySelector('.artist');
      const songImage = document.querySelector('.music-image img');
      // const currentNumber = "";
      // ข้อมูลที่ได้
      console.log("รายการเสียงทั้งหมด", data);
      // หมายเลขที่ผู้ใช้เลือก
      console.log("ค่าที่ผู้ใช้ป้อน", currentNumber);
      // ตรวจสอบถ้าไม่จริงก็แปรว่าไม่มีรหัสนี้แต่เมื่อเปลี่ยนเป็น จริง แปลว่ามี
      let isSoungFound = false;
      //เอาข้อมูลมาลูป และเก็บลงตัวแปร button , x เป็นตัวนับการลูปว่าไปกี่ครั้งแล้ว
      data.forEach(function (button, x) {
        console.log(button.music_number);
        if (button.music_number == currentNumber) {
          const songlists = data[x];
          console.log(songlists);

          audio.src = 'music/' + songlists.music_number + "/" + songlists.music_audio;
          songTitle.textContent = " - " + songlists.music_name;
          songArtist.textContent = songlists.music_number;
          songImage.src = 'images/' + songlists.music_number + "/" + songlists.music_img;
          Audio.play();

          //เก็บเลขindex เพื่อเอาไว้ใช้กับค่าไปข้างหน้า

          index = x + 1;
          console.log("เลขindex ใหม่: ", index);
          // trueระบุว่ามีหมายเลขที่ป้อนมา
          isSoungFound = true;

          content.classList.add("paused");
          //เปลี่ยนไอคอนให้เป็น pause 
          playBtnIcon.innerHTML = "pause";

          currentNumber = currentNumber.slice(0, 0);
          displayNumber.textContent = currentNumber;
          displayNumber.innerHTML = "&nbsp;";
        }
      });

      if (!isSoungFound) {
        currentNumber = currentNumber.slice(0, 0);
        displayNumber.textContent = currentNumber;
        displayNumber.innerHTML = "&nbsp;";
        displayNumber.textContent = "ไม่มีเสียงบรรยายหมายเลขนี้";
      }
    }
  });
};

