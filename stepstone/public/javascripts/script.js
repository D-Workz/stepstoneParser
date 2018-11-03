var url;

$(document).ready(function() {
    var $parseBtn = $("#parseBtn");
    $parseBtn.click(function () {
        $('#loader').css("display","block");
        con_invokeParser(function (response) {
            $('#loader').css("display","none");
            console.log(response);
        })
    })
});




function con_invokeParser(callback) {
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
