const mongoose = require('mongoose');

const request = require('request');

const shortId = require('shortid');
shortId.characters('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_-');


let StepstoneParser = new mongoose.Schema(
    {
        UID: {type: String, unique: true},
        results: [{type: mongoose.Schema.Types.ObjectId, ref: 'StepstoneResult'}]

    },
    {
        timestamps: {parsedAt: 'parsedAt'},
    }
);

StepstoneParser.methods.generteUID = function () {
    this.UID = shortId.generate();
};

mongoose.model('StepstoneParser', StepstoneParser);

