const express = require('express');
const router = express.Router();
const config = require('config');
const mongoose = require('mongoose');
const request = require('request');
const HTMLParser = require('node-html-parser');

mongoose.connect(config.get("DBUrl"), function (err) {
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
router.get('/', function(req, res, next) {
    let allJobSearches = [];
    allJobSearches.push(requestStepstoneData("de", 'data-scientist'));
    allJobSearches.push(requestStepstoneData("at", 'data-scientist'));
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
                let domAttributes = [];
                for(let i=0;i<attributes.length;i++){
                    domAttributes.push(HTMLParser.parse(attributes[i]));
                }
                const root = HTMLParser.parse(body);
                let mappingResult = mapParsingResultToObject(root, platform, job, domAttributes);
                resolve(mappingResult);
            }else {
                reject(error)
            }
        });
    });
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