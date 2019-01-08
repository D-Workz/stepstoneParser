var url;
var allParserRuns = [];
let viewFiles = [
    "modals.html"
];
let results = {};
let mapData = [];
let local = false;

$(document).ready(function() {
    process_insertHTMLViews();
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

        appendResultHistoryChart();
        let $content = $('#content');
        $content.html('');
        $content.append('<h4>Runs:</h4>');
        $content.append(generateDateBoxes());
    })
});

function appendResultHistoryChart() {
    let $resHistory = $('#result-history');
    let code = "";
    code = code.concat('<div class="col-md-12" id="history-dataScientist">');
    // code = code.concat('<div class="col-md-6" >');
    // code = code.concat('<canvas id="history-dataScientist-at"></canvas>');
    // code = code.concat('</div>');
    code = code.concat('<h4>Search result history for data-scientist</h4>');
    code = code.concat('<canvas id="history-dataScientist-de"></canvas>');
    // code = code.concat('</div>');
    code = code.concat('</div>');
    code = code.concat('<div class="col-md-12" id="history-businessAnalyst">');
    // code = code.concat('<div class="col-md-6" >');
    // code = code.concat('<canvas id="history-businessAnalyst-at"></canvas>');
    // code = code.concat('</div>');
    // code = code.concat('<div class="col-md-6" >');
    code = code.concat('<h4>Search result history for business-analyst</h4>');
    code = code.concat('<canvas id="history-businessAnalyst-de"></canvas>');
    // code = code.concat('</div>');
    code = code.concat('</div>');
    $resHistory.append(code);

    let historyData = {
        buisAnal:{
            labels:[],
            at:{
                label:'stepstone.at',
                data:[]
            },
            de:{
                label:'stepstone.de',
                data:[]
            },
        },
        dataScien:{
            labels:[],
            at:{
                label:'stepstone.at',
                data:[]
            },
            de:{
                label:'stepstone.de',
                data:[]
            }
        }
    };
    let dataLabels = [];
    let addedDate = {dataScien:false,buisAnal: false};
    for(let i=0;i<allParserRuns.length;i++){
        dataLabels.push(allParserRuns[i].createdAt);
        addedDate.dataScien = false;
        addedDate.buisAnal = false;
        for(let x=0;x<allParserRuns[i].results.length;x++){
            if(allParserRuns[i].results[x].job === 'data-scientist'){
                if(!addedDate.dataScien){
                    historyData.dataScien.labels.push(
                        allParserRuns[i].createdAt,
                    );
                    addedDate.dataScien = true;
                }
                if(allParserRuns[i].results[x].platform === 'stepstone.at'){
                    historyData.dataScien.at.data.push(
                        allParserRuns[i].results[x].totalCount
                    );
                }else{
                    historyData.dataScien.de.data.push(
                        allParserRuns[i].results[x].totalCount
                    );
                }
            }else{
                if(!addedDate.buisAnal){
                    historyData.buisAnal.labels.push(
                        allParserRuns[i].createdAt,
                    );
                    addedDate.buisAnal = true;
                }

                if(allParserRuns[i].results[x].platform === 'stepstone.at'){
                    historyData.buisAnal.at.data.push(
                        allParserRuns[i].results[x].totalCount
                    );
                }else{
                    historyData.buisAnal.de.data.push(
                        allParserRuns[i].results[x].totalCount
                    );
                }
            }
        }
    }
    // let ctxHisBuisAnalAt = $("#history-businessAnalyst-at")[0].getContext('2d');
    let ctxHisBuisAnalDe = $("#history-businessAnalyst-de")[0].getContext('2d');
    // let ctxHisDataScienAt = $("#history-dataScientist-at")[0].getContext('2d');
    let ctxHisDataScienDe = $("#history-dataScientist-de")[0].getContext('2d');
    // generateNewHistoryChart(ctxHisBuisAnalAt,historyData.buisAnalAt);
    generateNewHistoryChart(ctxHisBuisAnalDe,historyData.buisAnal);
    // generateNewHistoryChart(ctxHisDataScienAt,historyData.dataScienAt);
    generateNewHistoryChart(ctxHisDataScienDe,historyData.dataScien);
}

function generateNewHistoryChart(chart, jobData) {
    new Chart(chart, {
        type: 'line',
        data: {
            labels: jobData.labels,
            datasets:[{
                label:jobData.de.label,
                fill:false,
                borderColor: 'rgb(73, 144, 226)',
                data:jobData.de.data,
                // pointBackgroundColor:'rgb(14, 38, 117)',
            },{
                label:jobData.at.label,
                fill:false,
                borderColor: 'rgb(85, 255, 127)',
                data:jobData.at.data,
                // pointBackgroundColor:'rgb(14, 38, 117)',
            }]
        },
        options: {
            // scales: {
            //     xAxes: [{
            //         type: 'linear',
            //         position: 'bottom'
            //     }]
            // }
        }
    });
}


function showModal(id, name) {
    let modal = $("#myModal");
    let modalBody = modal.find('.modal-body');
    let modalHeader = modal.find('.modal-header');
    modalHeader.html('');
    modalHeader.html(name);
    let dataValues = results[id].data;
    let dataLabels = results[id].label;
    let sortedData = [];
    for(let i=0;i<dataValues.length;i++){
        sortedData.push([dataLabels[i],dataValues[i]])
    }
    sortedData.sort(function(a, b) {
        return b[1] - a[1];
    });
    dataValues = [];
    dataLabels = [];
    for(let x=0;x<sortedData.length;x++){
        dataLabels.push(sortedData[x][0]);
        dataValues.push(sortedData[x][1]);
    }
    modalBody.html('');
    modalBody.append('<canvas id="m-'+id+'"></canvas>')
    let ctx = $("#m-"+id)[0].getContext('2d');

    let dataset = {
        data: dataValues
    };
    let data = {
        labels: dataLabels,
        datasets:[dataset]
    };

    new Chart(ctx, {
        type: 'horizontalBar',
        data: data,
        options: {
            legend: {
                display: false
            },
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero:true
                    }
                }]
            },
            plugins: {
                datalabels: {
                    formatter: function (value, context) {
                        return context.chart.data.datasets[0].data[context.dataIndex];
                    }
                }
            }
        }
    });
    modal.modal();
}


//inserts Views (HTML Files) to the contentContainer DIV of the index.html
function process_insertHTMLViews() {
    if (viewFiles.length > 0) {
        var actualView = viewFiles.shift();
        $.get("/views/" + actualView, function (data) {
            $('#container').append(data);
            process_insertHTMLViews();
        });
    }
}


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

function generateResultBox($element, stepstoneResult) {
    var code = "";
    let attrId = 0;
    let label = [];
    let data = [];
    for(let i=0;i<stepstoneResult.results.length;i++){
        attrId = 0;
        code = code.concat('<div class="col-md-5 frameResult">')
        code = code.concat('<h4 class="col-md-6">'+stepstoneResult.results[i].platform+'</h4>');
        code = code.concat('<h4 class="col-md-6">'+stepstoneResult.results[i].job+'</h4>');
        code = code.concat('<div class="col-md-12">Number of Results: <strong>'+stepstoneResult.results[i].totalCount+'</strong></div>');

        code = code.concat('<div class="col-md-12">');
        let canvasIdMap = 'step-'+ stepstoneResult.results[i].platform +'-map-'+stepstoneResult.results[i].job;
        code = code.concat('<div onclick="showModal(\''+canvasIdMap+'\',\'map\')"><div id="'+canvasIdMap+'"></div></div>');

        code = code.concat('</div>')

        code = code.concat('<div class="col-md-12 attributeResults">');
        for(let attribute in stepstoneResult.results[i]){
            if(attribute !== "_id" && attribute !== "platform" && attribute !== "job" && attribute !=="totalCount" && attribute !== "UID" && attribute !=='__v'){
                label = [];
                data = [];
                let canvasId = 'step-'+i+'-attr-'+attrId;
                code = code.concat('<div class="attributeBox col-md-4">');
                code = code.concat('<div >');
                code = code.concat('<h5 class="col-md-12">'+stepstoneResult.results[i][attribute].attributeName+'</h5>');
                code = code.concat('</div>');
                code = code.concat('<div >');
                code = code.concat('<table class="col-md-12 TFtable">');
                let attributeFeatures = stepstoneResult.results[i][attribute].attributes
                for(let x=0;x<attributeFeatures.length;x++){
                    label.push(attributeFeatures[x].name);
                    data.push(attributeFeatures[x].count);
                    code = code.concat('<tr>');
                    code = code.concat('<td class="col-md-6">'+ attributeFeatures[x].name+'</td>');
                    code = code.concat('<td class="col-md-6">'+ attributeFeatures[x].count+'</td>');
                    code = code.concat('</tr>')
                }
                code = code.concat('</table>');
                code = code.concat('</div>');
                code = code.concat('<div onclick="showModal(\''+canvasId+'\',\''+ stepstoneResult.results[i][attribute].attributeName +'\')"><canvas id="'+canvasId+'"></canvas></div>');
                code = code.concat('</div>');
                attrId++;
                results[canvasId] = {
                    label:label,
                    data:data
                };

            }
        }
        code = code.concat('</div>');
        code = code.concat('</div>');
    }
    $element.html('');
    $element.append(code);

    for(let x=0;x<stepstoneResult.results.length;x++){
        if(stepstoneResult.results[x].platform==="stepstone.at"){
            let canvasIdMap = 'step-'+ stepstoneResult.results[x].platform +'-map-'+stepstoneResult.results[x].job;
            let geoRegion = stepstoneResult.results[x].geoRegion;
            let data = generateMapDataForAustria(geoRegion);
            let max = data.max;
            data = data.data;
            Highcharts.mapChart(canvasIdMap, {
                chart: {
                    map: 'countries/at/at-all'
                },

                title: {
                    text: stepstoneResult.results[x].job + ' Offer Distribution within Austria'
                },

                subtitle: {
                    text: 'Source map: <a href="http://code.highcharts.com/mapdata/countries/at/at-all.js">Austria</a>'
                },

                mapNavigation: {
                    enabled: true,
                    buttonOptions: {
                        verticalAlign: 'bottom'
                    }
                },

                colorAxis: {
                    min: 0,
                    max: max
                },

                series: [{
                    data: data,
                    name: 'Stepstone Job Offers',
                    states: {
                        hover: {
                            color: '#BADA55'
                        }
                    },
                    dataLabels: {
                        enabled: true,
                        format: '{point.name}'
                    }
                }]
            });
        }


    }


    for(let attr in results){

        var ctx = $("#"+attr)[0].getContext('2d');

        let dataset = {
            data: results[attr].data
        };
        let data = {
            labels: results[attr].label,
            datasets:[dataset]
        };

        new Chart(ctx, {
            type: 'horizontalBar',
            data: data,
            options: {
                legend: {
                    display: false
                },
                scales: {
                    yAxes: [{
                        ticks: {
                            beginAtZero:true
                        }
                    }]
                }
            }
        });
    }


}

function generateMapDataForAustria(geoRegion) {
    let dataArr = [];
    let max = 0;
    let retObj = {};
    for(let i=0;i<geoRegion.attributes.length;i++){
        let region = geoRegion.attributes[i].name;
        let countAsInt = parseInt(geoRegion.attributes[i].count);
        switch (region.trim()) {
            case "Wien":
                dataArr.push([
                    'at-wi',
                    countAsInt
                ]);
                if(max<countAsInt) max = countAsInt;
                break;
            case "Vorarlberg":
                dataArr.push([
                    'at-vo',
                    countAsInt
                ]);
                if(max<countAsInt) max = countAsInt;
                break;
            case "Burgenland":
                dataArr.push([
                    'at-bu',
                    countAsInt
                ]);
                if(max<countAsInt) max = countAsInt;
                break;
            case "Steiermark":
                dataArr.push([
                    'at-st',
                    countAsInt
                ]);
                if(max<countAsInt) max = countAsInt;
                break;
            case "Kärnten":
                dataArr.push([
                    'at-ka',
                    countAsInt
                ]);
                if(max<countAsInt) max = countAsInt;
                break;
            case "Ostösterreich":
                dataArr.push([
                    'at-oo',
                    countAsInt
                ]);
                if(max<countAsInt) max = countAsInt;
                break;
            case "Salzburg":
                dataArr.push([
                    'at-sz',
                    countAsInt
                ]);
                if(max<countAsInt) max = countAsInt;
                break;
            case "Tirol":
                dataArr.push([
                    'at-tr',
                    countAsInt
                ]);
                if(max<countAsInt) max = countAsInt;
                break;
            case "Niederösterreich":
                dataArr.push([
                    'at-no',
                    countAsInt
                ]);
                if(max<countAsInt) max = countAsInt;
                break;
        }
    }

    var data = [
        ['at-wi', 0],
        ['at-vo', 1],
        ['at-bu', 2],
        ['at-st', 3],
        ['at-ka', 4],
        ['at-oo', 5],
        ['at-sz', 6],
        ['at-tr', 7],
        ['at-no', 8]
    ];

    retObj.data = dataArr;
    retObj.max = max;
    return retObj;
}

function getParserRunAndAppendToElement($element, parseId) {
    let $loader = $('#loader-'+parseId);
    con_getParserRunById(parseId,function (parserRun) {
        $loader.css("display","none");
        generateResultBox($element, parserRun.result);

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
    if(local){
        url = "http://localhost:8082/parser/get/"+parserRunId;
    }else {
        url = "http://92.42.47.172:8082/parser/get/"+parserRunId;
    }
    $.ajax({
        url: url,
        type: "get",
        success: function (data){
            callback(data);
        }
    });
}

function con_getParserInfo(callback) {
    if(local){
        url = "http://localhost:8082/parser/info";
    }else {
        url = "http://92.42.47.172:8082/parser/info";
    }



    $.ajax({
        url: url,
        type: "get",
        success: function (data){
            callback(data);
        }
    });
}
function con_invokeParser(callback) {
    if(local){
        url = "http://localhost:8082/parser/start";
    }else {
        url = "http://92.42.47.172:8082/parser/start";
    }
    $.ajax({
        url: url,
        type: "get",
        success: function (data){
            callback(data);
        }
    });
}
