const mongoose = require('mongoose');

const request = require('request');

const shortId = require('shortid');
shortId.characters('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_-');


let StepstoneResult = new mongoose.Schema(
    {
        UID: {type: String, unique: true},
        job: {type: String},
        platform: {type: String},
        totalCount: {type: Number},
        releaseDate: {type: Object},
        competences: {type: Object},
        categories: {type: Object},
        branch: {type: Object},
        geoRegion: {type: Object},
        geoCity: {type: Object},
        workExperience: {type: Object},
        workingHours:{type: Object},
        employmentType: {type: Object},
        jobDescription: {type: Object},
        companies: {type: Object}
    },
);

StepstoneResult.methods.generteUID = function () {
    this.UID = shortId.generate();
};

mongoose.model('StepstoneResult', StepstoneResult);

