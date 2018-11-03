var url;

$(document).ready(function() {
    var $parseBtn = $("#parseBtn");
    $parseBtn.click(function () {
        $('#loader').css("display","block");
        con_startParser(function (response) {
            $('#loader').css("display","none");
            console.log(response);
        })
    })
});




function con_startParser(callback) {
    console.log("trying to upload.");
    url = "http://localhost:8082/startParser/";
    $.ajax({
        url: url,
        type: "get",
        success: function (data){
            callback(data);
        }
    });
    
}