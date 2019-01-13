const express = require('express');
const router = express.Router();
const config = require('config');
const mongoose = require('mongoose');
const request = require('request');
const HTMLParser = require('node-html-parser');
const cors = require('cors');

mongoose.connect(config.DBUrl, {useNewUrlParser: true}, function (err) {
    if (err) {
        console.error(err);
        process.exit(1);
    }
});

const Promise = require('bluebird');
mongoose.Promise = Promise;
const StepstoneParser = mongoose.model('StepstoneParser');
const StepstoneResult = mongoose.model('StepstoneResult');
/* GET users listing. */
router.get('/start', function(req, res, next) {
    let allJobSearches = [];
    allJobSearches.push(requestStepstoneData("de", 'data-scientist'));
    allJobSearches.push(requestStepstoneData("at", 'data-scientist'));
    allJobSearches.push(requestStepstoneData("at", 'business-analyst'));
    allJobSearches.push(requestStepstoneData("de", 'business-analyst'));
    return Promise
        .all(allJobSearches)
        .then(result => {
            saveParseResultToDB(result)
                .then(parseResult => {
                    res.status(200).json(parseResult);
                })
                .catch(err=>{
                    res.status(400).json({message:"Something went wrong"});
                })
        })
        .catch(err => {
            console.log(err);
        })
});

router.get('/get/:parserRunId', cors(), function (req, res, next) {
    let id = req.params.parserRunId;
    if(!id){
        res.status(400).json({message:"please provide an id"})
    }
    StepstoneParser
        .findById(id)
        .populate('results')
        .then( parseResult =>{
            res.status(200).json({message:"ok", result:parseResult})
        })
        .catch(err =>{
            res.status(400).json({message:"something went wrong"})
        })

});

function checkIfDateParsed(date, dates){
    let dateParsed = false;
    for(let i=0; i<dates.length; i++){
        if(dates[i]===date){
            dateParsed = true;
            break;
        }
    }
    return dateParsed;
}

function getParserDay(date){
    let parserDay = new Date(date);
    let day = parserDay.getDate();
    let month = parserDay.getMonth()+1;
    let year = parserDay.getFullYear();
    parserDay = day+'.'+month+'.'+year;
    return parserDay;
}

router.get('/attribute/:attribute/job/:job', cors(), function (req, res, next) {
    let attribute = req.params.attribute;
    let job = req.params.job;
    let resultObj = {
        job: job,
        attribute:attribute,
        scores:{
            stepstoneAt:{

            },
            stepstoneDe:{

            }
        }
    };
    let dates = [];
    let promises = [];
    return StepstoneParser
        .find()
        .then(parserResults => {
            for(let i=0; i<parserResults.length;i++){
                let parserDay = getParserDay(parserResults[i].createdAt);
                if(!checkIfDateParsed(parserDay, dates)){
                    let results = parserResults[i].results;
                    for(let x=0;x<results.length;x++){
                        let onePromise = new Promise(function (resolve, reject) {
                            StepstoneResult
                                .findById(results[x])
                                .then(stepResult => {
                                    resolve(stepResult);
                                })
                                .catch(err =>{
                                    console.log('Couldnt get result: '+results[x]);
                                    reject(err);
                                })
                        });
                        promises.push(onePromise);
                    }
                    dates.push(parserDay);
                }
            }
            return Promise
                .all(promises)
                .then( results => {
                    for(let q=0;q<results.length;q++){
                        let stepResult = results[q];
                        if(stepResult.job === job){
                            let jobAttribute = stepResult[attribute];
                            if(jobAttribute){
                                let rank = 1;
                                let rankAtributeCount;
                                sortAttributes(jobAttribute.attributes);
                                for(let y=0; y<jobAttribute.attributes.length; y++){
                                    let intCount = parseInt(jobAttribute.attributes[y].count);
                                    if(!rankAtributeCount){
                                        rankAtributeCount = intCount;
                                    }else{
                                        if(rankAtributeCount > intCount){
                                            rankAtributeCount = intCount;
                                            rank++;
                                        }
                                    }
                                    let attributeName = jobAttribute.attributes[y].name;
                                    if(stepResult.platform === 'stepstone.de'){
                                        if(resultObj.scores.stepstoneDe[attributeName]){
                                            resultObj.scores.stepstoneDe[attributeName].push(rank);
                                        }else{
                                            resultObj.scores.stepstoneDe[attributeName] = [rank]
                                        }
                                    }else{
                                        if(resultObj.scores.stepstoneAt[attributeName]){
                                            resultObj.scores.stepstoneAt[attributeName].push(rank);
                                        }else{
                                            resultObj.scores.stepstoneAt[attributeName] = [rank]
                                        }
                                    }
                                }
                            }
                        }
                    }
                    res.status(200).json({message:"ok", result:resultObj})
                })
                .catch(err => {

                })
        })
        .catch(err =>{
            res.status(400).json({message:"something went wrong"});
        })
});











router.get('/info', function(req, res, next) {
    StepstoneParser
        .find({})
        .populate({
            path: 'results',
            select: 'totalCount platform job'
        })
        .then(allRuns => {

            res.status(200).json({message:"ok", result:allRuns});
        })
        .catch(err => {
            console.log(err);
            res.status(400).json({message:"something went wrong."});
        })


});

module.exports = router;

function saveParseResultToDB(parseResult){
    return new Promise(function (res, rej) {
    let stepstone = new StepstoneParser();
    stepstone.generteUID();
    let allResults = [];
    for(let i=0;i<parseResult.length;i++){
        let promise = new Promise(function (resolve, reject) {
            let result = new StepstoneResult();
            let currentResult = parseResult[i];
            result.generteUID();
            result.platform = currentResult.platform;
            result.branch = currentResult.branch;
            result.categories = currentResult.categories;
            result.competences = currentResult.competences;
            result.employmentType = currentResult.employmentType;
            result.geoCity = currentResult.geoCity;
            result.geoRegion = currentResult.geoRegion;
            result.job = currentResult.job;
            result.jobDescription = currentResult.jobDescription;
            result.releaseDate = currentResult.releaseDate;
            result.totalCount = currentResult.totalCount;
            result.workExperience = currentResult.workExperience;
            result.workingHours = currentResult.workingHours;
            if(currentResult.companies) result.companies = currentResult.companies;
            result
                .save()
                .then( stepResult => {
                    resolve(stepResult);
                })
                .catch( err => {
                    reject(err);
                })

        });
        allResults.push(promise);
    }
    Promise
        .all(allResults)
        .then(parseResults => {
            stepstone.results = parseResults;
            stepstone
                .save()
                .then( stepstone => {
                    console.log("successfully saved parsing result.");
                    res(stepstone);
                })
                .catch( err => {
                    console.log(err);
                    rej(err);
                })
        })

    })

}

function requestStepstoneData(platform, job) {
    let url = "https://www.stepstone."+platform+"/jobs/"+job+".html";
    return new Promise(function (resolve, reject) {
        request({
            url: url,
            method: "GET"
        }, function (error, response, body) {
            if (!error && response.statusCode === 200) {


                let attributes = getAttributes(body);
                let companies = getCompanies(body);
                let domAttributes = [];
                for(let i=0;i<attributes.length;i++){
                    domAttributes.push(HTMLParser.parse(attributes[i]));
                }
                domAttributes.push(HTMLParser.parse(companies[0]));
                const root = HTMLParser.parse(body);
                let mappingResult = mapParsingResultToObject(root, platform, job, domAttributes);
                resolve(mappingResult);
            }else {
                reject(error)
            }
        });
    });
}

function getCompanies(body) {
    let regexAttributes = /<span class="panel-facets-heading open js-open">.(Companies|Firmen)(.*)<!-- Careers content -->/sg;
    let match = body.match(regexAttributes)
    return match;
}

function getAttributes(body) {
    let regexAttributes = /(<span class="panel-facets-heading open js-open">.*?<div class="panel panel-facets">)/gs;
    let match = body.match(regexAttributes)
    return match;
}

function mapParsingResultToObject(root, platform, job, attributes) {

    let mappingObj = {};
    platform = "stepstone."+platform;

    mappingObj.totalCount = getTotalCount(root);
    mappingObj.job = job;
    mappingObj.platform = platform;
    mappingObj.releaseDate = getJobAttribute(attributes, "Erscheinungsdatum");
    mappingObj.competences = getJobAttribute(attributes, "Kompetenzen");
    mappingObj.categories = getJobAttribute(attributes, "Berufsfeld");
    mappingObj.branch = getJobAttribute(attributes, "Branche");
    mappingObj.geoRegion = getJobAttribute(attributes, "Region");
    mappingObj.geoCity = getJobAttribute(attributes, "Städte");
    mappingObj.workingHours = getJobAttribute(attributes, "Arbeitszeit");
    mappingObj.workExperience = getJobAttribute(attributes, "Berufserfahrung");
    mappingObj.employmentType = getJobAttribute(attributes, "Anstellungsart");
    mappingObj.jobDescription = getJobAttribute(attributes, "Arbeitsbeschreibung");
    mappingObj.companies = getJobAttribute(attributes, "Companies");
    return mappingObj;
}

function sortAttributes(attributes) {
    let sortedAttributes = [];


    return attributes.sort(compare);
}

function compare(a,b) {
    if (parseInt(a.count) > parseInt(b.count))
        return -1;
    if (parseInt(a.count) < parseInt(b.count))
        return 1;
    return 0;
}

function getJobAttribute(domAttributes, attributeName) {
    let returnObj = {};
    try{
        for(let i=0;i<domAttributes.length;i++){
            let htmlAttribute = domAttributes[i].childNodes["0"].rawText.replace(/\n/g,"");
            if(htmlAttribute === attributeName){
                returnObj.attributes = [];
                returnObj.attributeName = attributeName;
                let attributeRoot = domAttributes[i];
                let foundAttributes = attributeRoot.querySelectorAll('.unlinkify');
                for(let x=0;x<foundAttributes.length;x++){
                    let attribute = {};
                    attribute.name = foundAttributes[x].childNodes["0"].rawText;
                    attribute.count = foundAttributes[x].childNodes["1"].childNodes["0"].rawText;
                    returnObj.attributes.push(attribute);
                }
                break;
            }
        }
    }catch (e) {
        console.log(e);
    }
    return returnObj;
}

function getTotalCount(root) {
    let totalCount = "";
    try{
        totalCount = root.querySelectorAll('.facets-header-title')[0].childNodes["1"].childNodes["1"].childNodes["0"].childNodes["0"].rawText
    }catch (e) {

    }
    return totalCount;
}