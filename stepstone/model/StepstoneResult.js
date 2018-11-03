const mongoose = require('mongoose');

const request = require('request');

const shortId = require('shortid');
shortId.characters('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_-');


let StepstoneResult = new mongoose.Schema(
    {
        UID: {type: String, unique: true},
        platform: {type: String},
        totalResultCount: {type: Number},
        releaseDate: [{type: Object}],
        competences: [{type: Object}],
        categories: [{type: Object}],
        sectors: [{type: Object}],
        geoRegion: [{type: Object}],
        geoCity: [{type: Object}],
        jobExperiences: [{type: Object}],
        workingHours:[{type: Object}],
        employmentType: [{type: Object}],
        content: {type: Array},
    },
);

StepstoneResult.methods.generteUID = function () {
    this.UID = shortId.generate();
};

mongoose.model('StepstoneResult', StepstoneResult);

