const express = require('express');
const router = express.Router();
const config = require('config');
const mongoose = require('mongoose');
const request = require('request');
const fs = require('fs');

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
    let stepstone = new StepstoneParser();
    let result = new StepstoneResult();
    result.generteUID();
    result.platform = "stepstoneAT";
    result
        .save()
        .then( stepResult => {
            stepstone.generteUID();
            stepstone.results.push(stepResult);
            stepstone.markModified('content');
            stepstone.save(function (err, parser) {
                if (err) {
                    return next(err);
                }
                console.log(parser);
                return res.status(200).json({"message":"yeah"});
            });
        })
        .catch( err => {
            return next(err);
        })


});

module.exports = router;



function requestStepstoneData() {
    return new Promise(function (res) {
        request({
            url: url,
            method: "GET"
        }, function (error, response, body) {
            if (!error && response.statusCode === 200) {
                var ast = HTML.parse(body);
                try{
                    if(ast["0"]){
                        let baseDOM = ast["0"].children["0"].children["0"].children;
                        for (let i = 0; i < baseDOM.length; i++) {
                            if (baseDOM[i].attrs.property === "og:url") {
                                url = baseDOM[i].attrs.content;
                                break;
                            }
                        }
                    }
                }catch (e) {
                    console.log("Coudln't get correct URL, use permalink");
                }

            }
            res({
                url:url,
                language:language
            });
        });

    });
}