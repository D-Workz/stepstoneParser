var url;
var uploadedImage;

$(document).ready(function() {
    var confirmBtn = $('#uploadBtn');
    var $upload = $("#uploadBtn");
    $("#fileInput").change(function () {
        readImageFile(this);
    });
    confirmBtn.attr('disabled', true);
    $upload.click(function () {
        $('#loader').css("display","block");
        uploadImage(function (response) {
            $('#loader').css("display","none");
            var $loginBox = $("#uploadBox");
            console.log(response);
            $loginBox.css("display","none");
            $('#error').css("display","none");
            $('#content').css("display","block");


        })
    })
});


//reads the input file from an input element and shows a preview
function readImageFile(input) {
    if (input.files && input.files[0]) {

        var fileSize = input.files[0].size;

        var errorDiv = $('#error');
        var errorText = $('#errorText');
        var confirmBtn = $('#uploadBtn');

        var $preview = $('#userimage-Preview');
        // 500 kb limit
        if (fileSize > 500e3) {
            errorDiv.slideDown(100);
            errorText.html("The image file size must be below 500 kB");
            confirmBtn.attr('disabled', true);
        } else {
            var reader = new FileReader();
            reader.readAsDataURL(input.files[0]);
            reader.onload = function (e) {
                errorDiv.slideUp(100);
                uploadedImage = e.target.result;
                $('#content').css("display","block");
                $preview.css("display","block");
                $preview.attr('src', uploadedImage);
                confirmBtn.attr('disabled', false);
            };
        }

    }
}


function uploadImage(callback) {
    console.log("trying to upload.");
    url = "http://localhost:8082/users/";
    $.ajax({
        url: url,
        type: "get",
        success: function (data){
            callback(data);
        }
    });
    
}