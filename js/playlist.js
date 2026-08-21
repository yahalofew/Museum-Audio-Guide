
function fetchData(callback) {
    $.ajax({
        url: 'api/read_data.php',
        type: 'GET',
        dataType: 'json',
        success: function (data) {
            if (!Array.isArray(data)) {
                callback(new Error('Invalid music data response'), null);
                return;
            }

            const validData = data.filter(function (item) {
                if (!item || typeof item !== 'object') {
                    return false;
                }

                const musicNumber = Number(item.music_number);
                return Number.isInteger(musicNumber)
                    && musicNumber >= 0
                    && item.media_status !== 'missing'
                    && typeof item.music_name === 'string'
                    && typeof item.music_audio === 'string'
                    && item.music_audio.trim() !== ''
                    && typeof item.music_img === 'string'
                    && item.music_img.trim() !== '';
            });

            if (validData.length === 0) {
                callback(new Error('No valid music data available'), null);
                return;
            }

            callback(null, validData);
        },
        error: function (error) {
            callback(error, null);
        }
    });
}
