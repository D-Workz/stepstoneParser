var url;
var allParserRuns = [];

$(document).ready(function() {
    var $parseBtn = $("#parseBtn");
    $parseBtn.click(function () {
        $('#loader').css("display","block");
        con_invokeParser(function (response) {
            allParserRuns.unshift(response)
            let $content = $('#content');
            $content.html('');
            $content.append('<h4>Runs:</h4>');
            $content.append(generateDateBoxes());
            $('#loader').css("display","none");
        })
    });

    con_getParserInfo(function (response) {
        for(var i=response.result.length-1;i>=0;i--){
            allParserRuns.push(response.result[i]);
        }
        let $content = $('#content');
        $content.html('');
        $content.append('<h4>Runs:</h4>');
        $content.append(generateDateBoxes());
    })
});

function generateDateBoxes() {
    let code = "";
    for(let i=0;i<allParserRuns.length;i++){
        code = code.concat('<a href="javascript:parserRunToggle(\'' + allParserRuns[i]._id + '\')" class="btn-fab btn-fab-mini my-fab-info" title="Show/Hide annotations of this website">')
        code = code.concat('<div id="'+ allParserRuns[i]._id+'" class="date-Header text-center" title="Show/Hide annotations of this website">');
        code = code.concat(formatDateForOutput(allParserRuns[i].createdAt));
        code = code.concat('<i class="visIcon material-icons my-fab-icon iconSmall" id="visibility_icon_' + allParserRuns[i]._id + '">visibility_on</i>');
        code = code.concat('</div></a>');
        code = code.concat('<div style="display: none" id="parserRun-' + allParserRuns[i]._id + '" class="text-center col-md-12 parserBoxContent">');
        code = code.concat('<div id="loader-'+allParserRuns[i]._id +'" hidden>');
        code = code.concat('<img src="img/loader.gif">');
        code = code.concat('</div></div>');
    }
    return code;
}

function generateResultBox(stepstoneResult) {
    var code = "";
    for(let i=0;i<stepstoneResult.results.length;i++){
        code = code.concat('<div class="col-md-5 frameResult">')
        code = code.concat('<h4 class="col-md-6">'+stepstoneResult.results[i].platform+'</h4>');
        code = code.concat('<h4 class="col-md-6">'+stepstoneResult.results[i].job+'</h4>');
        code = code.concat('<div class="col-md-12">Number of Results: <strong>'+stepstoneResult.results[i].totalCount+'</strong></div>');
        code = code.concat('<div class="col-md-12 attributeResults">')
        for(let attribute in stepstoneResult.results[i]){
            if(attribute !== "_id" && attribute !== "platform" && attribute !== "job" && attribute !=="totalCount" && attribute !== "UID" && attribute !=='__v'){
                code = code.concat('<div class="attributeBox col-md-4">');
                code = code.concat('<div >');
                code = code.concat('<h5 class="col-md-12">'+stepstoneResult.results[i][attribute].attributeName+'</h5>');
                code = code.concat('</div>');
                code = code.concat('<div >');
                code = code.concat('<table class="col-md-12 TFtable">');
                let attributeFeatures = stepstoneResult.results[i][attribute].attributes
                for(let x=0;x<attributeFeatures.length;x++){
                    code = code.concat('<tr>');
                    code = code.concat('<td class="col-md-6">'+ attributeFeatures[x].name+'</td>');
                    code = code.concat('<td class="col-md-6">'+ attributeFeatures[x].count+'</td>');
                    code = code.concat('</tr>')
                }
                code = code.concat('</table>');
                code = code.concat('</div>');
                code = code.concat('</div>');
            }
        }
        code = code.concat('</div>');
        code = code.concat('</div>');
    }
    return code;
}

function getParserRunAndAppendToElement($element, parseId) {
    let $loader = $('#loader-'+parseId);
    con_getParserRunById(parseId,function (parserRun) {
        $loader.css("display","none");
        let results = generateResultBox(parserRun.result);
        $element.html('');
        $element.append(results);
    })
}

function parserRunToggle(parseId) {
    var $parserContent = $('#parserRun-'+parseId);
    var visibility_icon = $('#visibility_icon_' + parseId);
    let $loader = $('#loader-'+parseId);
    if ($parserContent.css('display') === "none") {
        $parserContent.slideDown(250);
        visibility_icon.html('visibility_off');
        $loader.css("display","block");
        getParserRunAndAppendToElement($parserContent, parseId);
    }else{
        $parserContent.slideUp(250);
        visibility_icon.html('visibility');
    }
    console.log(parseId);

}

function formatDateForOutput(date) {
    let formatedDate;
    formatedDate = date.replace("T"," ");
    formatedDate = formatedDate.substring(0, formatedDate.length - 5);
    return formatedDate;
}

function con_getParserRunById(parserRunId, callback) {
    url = "http://localhost:8082/parser/get/"+parserRunId;
    $.ajax({
        url: url,
        type: "get",
        success: function (data){
            callback(data);
        }
    });
}

function con_getParserInfo(callback) {
    url = "http://localhost:8082/parser/info";
    $.ajax({
        url: url,
        type: "get",
        success: function (data){
            callback(data);
        }
    });
}
function con_invokeParser(callback) {
    url = "http://localhost:8082/parser/start";
    $.ajax({
        url: url,
        type: "get",
        success: function (data){
            callback(data);
        }
    });
}
