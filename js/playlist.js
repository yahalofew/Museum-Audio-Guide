
function fetchData(callback) {

    $.ajax({
        url: 'api/read_data.php',
        type: 'GET',
        dataType: 'json',
        success: function (data) {
            callback(null, data);
        },
        error: function (error) {
            callback(error, null);
        }
    });
}
