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
        appendAttributeAnalysis();
        appendResultHistoryChart();
        let $content = $('#content');
        $content.html('');
        $content.append('<h4>Runs:</h4>');
        $content.append(generateDateBoxes());
    })
});


let attributes = {
    type:'attributes',
    content:{
        competences: 'Kompetenzen',
        categories: 'Berufsfeld',
        branch: 'Branche',
        geoRegion: 'Region',
        geoCity: 'Städte',
        workExperience: 'Berufserfahrung',
        workingHours:'Arbeitszeit',
        employmentType: 'Anstellungsart',
        jobDescription: 'Arbeitsbeschreibung',
        companies: 'Unternehmen'
    }
};

let jobPositions = {
    'type':'jobpositions',
    content:{
        'business-analyst':'Business Analyst',
        'data-scientist':'Data Scientist'
    }
};

function appendAttributeAnalysis() {
    let $element = $('#attribute-analysis');
    let code = "";
    code = code.concat('<div style="color: #337ab7" onclick="toggleContainer(\'analysis-container\')" class="date-Header text-center" id="analysis-header">');
    code = code.concat('Show attribute analysis');
    code = code.concat('<i class="visIcon material-icons my-fab-icon iconSmall" id="visibility_icon_analysis">visibility_on</i>');
    code = code.concat('</div>');
    code = code.concat('<div id="analysis-container" class="container col-md-12" hidden>');
    code = code.concat('<div>Filters</div>');
    code = code.concat('<div class="analysis-options col-md-12">');
    code = code.concat(generateDropdownInput(jobPositions));
    code = code.concat(generateDropdownInput(attributes));
    code = code.concat('<button class="md-col-2 btn btn-success" onclick="requestStatistics()">Request statistics</button>');
    code = code.concat('</div>');
    code = code.concat('<div>Results</div>');
    code = code.concat('<div id="analys-res" class="analysis-result col-md-12">');
    code = code.concat('</div>');
    code = code.concat('</div>');
    $element.append(code);
}

function generateTableData(attributeDistribution) {
    let tableData = [];
    for(let key in attributeDistribution){
        let sum = 0;
        for(let i=0;i<attributeDistribution[key].length;i++){
            sum = sum + attributeDistribution[key][i];
        }
        tableData.push({
            name:key,
            days:attributeDistribution[key].length,
            allRankings:attributeDistribution[key],
            averageRanking: (sum / attributeDistribution[key].length).toFixed(2)
        })
    }
    tableData.sort(compare);
    let rank = 1;
    let currentAvgRank;
    for(let q=0;q<tableData.length;q++){
        if(!currentAvgRank){
            currentAvgRank = tableData[q].averageRanking;
            tableData[q].rank = rank;
        }else {
            if(currentAvgRank < tableData[q].averageRanking){
                rank++;
                currentAvgRank = tableData[q].averageRanking;
            }
            tableData[q].rank = rank;
        }
    }
    let rankedData = [];
    let currentRank;
    let position = 0;
    for(let k=0;k<tableData.length;k++){
        if(!currentRank){
            currentRank = tableData[k].rank;
            rankedData[position] = [tableData[k]];
        }else{
            if(currentRank === tableData[k].rank){
                rankedData[position].push(tableData[k])
            }else{
                position++;
                rankedData[position] = [tableData[k]];
                currentRank = tableData[k].rank
            }
        }
    }
    return rankedData;
}

function generateStatistcsResultCode(response) {
    let $resultBox = $('#analys-res');
    $resultBox.html('');
    let code = "";
    let tabData = {};
    code = code.concat('<h4 style="  float: left; margin-left: 10px">'+response.job+'</h4>');
    code = code.concat('<h4 style="  float: left; margin-left: 10px">'+response.attribute+'</h4>');
    code = code.concat('<div style="clear: both"></div>')
    for(let key in response.scores){
        code = code.concat('<div class="res col-md-12">');
        code = code.concat('<h5>'+key+'</h5>');
        let tableData = generateTableData(response.scores[key]);
        tabData[key] = tableData;
        code = code.concat(generateCodeForStatisticsTable(tableData));
        code = code.concat(generateCodeForStatisticsChart(tableData, key));
        code = code.concat('</div>');
    }
    $resultBox.append(code);
    appendStatisticCharts(tabData);
}

function appendStatisticCharts(tableData) {

    let dataLabels = [], dataValues = [];
    let dataset = {};
    for(let key in tableData){
        let ctx = $("#attribute-chart-"+key)[0].getContext('2d');
        for(let i=0; i<tableData[key].length;i++){
            dataLabels.push('Rank '+ (parseInt(i)+1));
            let currentRank = tableData[key][i];
            for(let q=0;q<currentRank.length;q++){
                dataset = {
                    label: currentRank[q].name,
                    data: currentRank[q].days
                };
                dataValues.push(dataset);
            }
        }
        let data = {
            labels: dataLabels,
            datasets: dataValues
        };
        generateStatisticChart(ctx, data);
    }


}

function generateStatisticChart(chart, data) {
    // new Chart(chart, {
    //     type: 'horizontalBar',
    //     data: data,
    //     options: {
    //         legend: {
    //             display: false
    //         },
    //         scales: {
    //             yAxes: [{
    //                 ticks: {
    //                     beginAtZero:true
    //                 }
    //             }]
    //         },
    //         plugins: {
    //             datalabels: {
    //                 formatter: function (value, context) {
    //                     return context.chart.data.datasets[0].data[context.dataIndex];
    //                 }
    //             }
    //         }
    //     }
    // });
    //

    new Chart(chart, {
        type: 'horizontalBar',
        data: {
            labels: ["Red", "Blue", "Yellow", "Green", "Purple", "Orange"],
            datasets: [
                {
                label: '# of Votes',
                data: [12, 19, 3, 5, 2, 3],
                backgroundColor: [
                    '#B8D1F3',
                    '#B8D1F3',
                    '#B8D1F3',
                    '#B8D1F3',
                    '#B8D1F3',
                ],
                borderColor: [
                    '#4e95f4',
                    '#4e95f4',
                    '#4e95f4',
                    '#4e95f4',
                    '#4e95f4'
                ],
                borderWidth: 1
            },
                {
                    label: '# of Votes 111',
                    data: [16, 0, 0, 0, 0, 0],
                    backgroundColor: [
                        '#B8D1F3',
                        '#B8D1F3',
                        '#B8D1F3',
                        '#B8D1F3',
                        '#B8D1F3',
                    ],
                    borderColor: [
                        '#4e95f4',
                        '#4e95f4',
                        '#4e95f4',
                        '#4e95f4',
                        '#4e95f4'
                    ],
                    borderWidth: 1
                }




            ]
        },
        options: {
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
                        // return context.chart.data.datasets[0].data[context.dataIndex];
                        if(value!== 0){
                            return context.dataset.label;
                        }

                    },
                    display: function(context) {
                        return context.dataset.data[context.dataIndex] !== 0; // or >= 1 or ...
                            }
                }
            }
        }
    });
}

function generateCodeForStatisticsChart(tableData, key) {
    let code = "";
    code = code.concat('<div class="col-md-6">');
    code = code.concat('<canvas id="attribute-chart-'+key+'"></canvas>')
    code = code.concat('</div>');
    return code;
}

function generateCodeForStatisticsTable(tableData) {
    let code = "";
    code = code.concat('<table class="TFtable col-md-5">');
    code = code.concat('<tr><th>Ranking</th>');
    code = code.concat('<th>Name</th>');
    code = code.concat('<th>Days parsed</th>');
    code = code.concat('<th>All rankings</th>');
    code = code.concat('<th>Average ranking*</th></tr>');
    let currentRank;
    for(let i=0;i<tableData.length;i++){
        currentRank = i+1;
        code = code.concat('<tr><td>'+currentRank+'</td>');
        code = code.concat(generateCodeForTableColumn(tableData, i, 'name'));
        code = code.concat(generateCodeForTableColumn(tableData, i, 'days'));
        code = code.concat(generateCodeForTableColumn(tableData, i, 'allRankings'));
        code = code.concat(generateCodeForTableColumn(tableData, i, 'averageRanking'));
        code = code.concat('</tr>');

    }
    code = code.concat('<div style="margin-bottom: 5px">Average ranking = SUM(All rankings)/days parsed</div>');
    code = code.concat('</table>');
    return code;
}

function generateCodeForTableColumn(tableData, i, type) {
    let code = "";
    code = code.concat('<td>');
    for(let q=0;q<tableData[i].length;q++){
        code = code.concat(tableData[i][q][type]);
        if(q+1<tableData[i].length){
            code = code.concat('<br>');
        }
    }
    code = code.concat('</td>');
    return code;
}

function compare(a,b) {
    if (parseFloat(a.averageRanking) < parseFloat(b.averageRanking))
        return -1;
    if (parseFloat(a.averageRanking) > parseFloat(b.averageRanking))
        return 1;
    return 0;
}

function requestStatistics() {
    let $jobPos = $('#dropdown-jobpositions');
    let $jobAttributes = $('#dropdown-attributes');
    let jobAttrVal = $jobAttributes.val();
    let jobPosVal = $jobPos.val();
    con_getAttributeDistributionForJob(jobAttrVal, jobPosVal ,function (response) {
        generateStatistcsResultCode(response.result);
    });
}

function generateDropdownInput(dropdownType) {
    let code = "";
    let typeString = dropdownType.type;
    code = code.concat('<div class="dropdown-container col-md-3">');
    code = code.concat(typeString);
    code = code.concat('<select id="dropdown-'+typeString+'">');
    for(let key in dropdownType.content){
        code = code.concat('<option value="'+ key +'">'+dropdownType.content[key]+'</option>')
    }
    code = code.concat('</select>');
    code = code.concat('</div>');
    return code;
}

function toggleContainer(container) {
    let $element = $('#'+container);
    let visibility_icon = $('#visibility_icon_history');
    if(container === 'analysis-container'){
        visibility_icon = $('#visibility_icon_analysis');
    }
    if ($element.css('display') === "none") {
        $element.slideDown(250);
        visibility_icon.html('visibility_off');
    }else{
        $element.slideUp(250);
        visibility_icon.html('visibility');
    }
}


function appendResultHistoryChart() {
    let $resHistory = $('#result-history');
    let code = "";
    code = code.concat('<div style="color: #337ab7" onclick="toggleContainer(\'history-container\')" class="date-Header text-center" id="history-header">');
    code = code.concat('Show parser history');
    code = code.concat('<i class="visIcon material-icons my-fab-icon iconSmall" id="visibility_icon_history">visibility_on</i>');
    code = code.concat('</div>');
    code = code.concat('<div id="history-container" class="container col-md-12" hidden>');
    code = code.concat('<div class="" id="history-dataScientist">');
    // code = code.concat('<div class="col-md-6" >');
    // code = code.concat('<canvas id="history-dataScientist-at"></canvas>');
    // code = code.concat('</div>');
    code = code.concat('<h4>Search result history for data-scientist</h4>');
    code = code.concat('<canvas class="canvas-history" id="history-dataScientist-de"></canvas>');
    // code = code.concat('</div>');
    code = code.concat('</div>');
    code = code.concat('<div class="" id="history-businessAnalyst">');
    // code = code.concat('<div class="col-md-6" >');
    // code = code.concat('<canvas id="history-businessAnalyst-at"></canvas>');
    // code = code.concat('</div>');
    // code = code.concat('<div class="col-md-6" >');
    code = code.concat('<h4>Search result history for business-analyst</h4>');
    code = code.concat('<canvas class="canvas-history"  id="history-businessAnalyst-de"></canvas>');
    // code = code.concat('</div>');
    code = code.concat('</div>');
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
    for(let i=allParserRuns.length-1;i>=0;i--){
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

function con_getAttributeDistributionForJob(attribute, job, callback) {
    if(local){
        url = "http://localhost:8082/parser/attribute/"+attribute+'/job/'+job;
    }else {
        url = "http://92.42.47.172:8082/parser/attribute/"+attribute+/job/+job;
    }
    $.ajax({
        url: url,
        type: "get",
        success: function (data){
            callback(data);
        }
    });
}