
(function () {
'use strict';

function classifyMusicData(data) {
    if (!Array.isArray(data)) {
        return { error: new Error('Invalid music data response'), data: null };
    }

    if (data.length === 0) {
        const error = new Error('No music data available');
        error.code = 'EMPTY';
        return { error: error, data: null };
    }

    const validData = data.filter(function (item) {
        if (!item || typeof item !== 'object') return false;
        const musicNumber = Number(item.music_number);
        return Number.isInteger(musicNumber)
            && musicNumber > 0
            && item.media_status !== 'missing'
            && typeof item.music_name === 'string'
            && typeof item.music_audio === 'string'
            && item.music_audio.trim() !== ''
            && typeof item.music_img === 'string'
            && item.music_img.trim() !== '';
    });

    if (validData.length === 0) {
        const error = new Error('No playable media available');
        error.code = 'NO_PLAYABLE_MEDIA';
        return { error: error, data: null };
    }

    return { error: null, data: validData };
}

function fetchData(callback) {
    $.ajax({
        url: 'api/read_data.php',
        type: 'GET',
        dataType: 'json',
        success: function (data) {
            const result = classifyMusicData(data);
            callback(result.error, result.data);
        },
        error: function (error) {
            callback(error, null);
        }
    });
}

window.MuseumPlaylist = Object.freeze({ fetchData });
}());
