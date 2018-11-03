const mongoose = require('mongoose');

const request = require('request');

const shortId = require('shortid');
shortId.characters('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_-');


let DatawarehouseJobs = new mongoose.Schema(
    {
        UID: {type: String, unique: true},
        CID: {type: String},
        enc_url: String,

        name: {type: String},
        type: {type: Array},
        language: {type: String, lowercase: true, maxLength: 3},

        count: {type: Object},

        domainSpecification: {type: mongoose.Schema.Types.ObjectId, ref: 'DomainSpecification'},
        website: {type: mongoose.Schema.Types.ObjectId, ref: 'Website'},

        content: {type: Object},
        source: {type: String},

        author: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},

        creationDuration: Number,
    },
    {
        timestamps: {createdAt: 'created', updatedAt: 'updated'},
        toObject: {
            virtuals: true
        },
        toJSON: {
            virtuals: true
        }
    }
);

DatawarehouseJobs.index({
    CID: 1,
    website: 1
}, {
    unique: true,
    partialFilterExpression: {
        CID: {$exists: true}
    }
});


DatawarehouseJobs.methods.updateFromContent = function () {

    this.initCount();
    let self = this;

    let annotationArray = self.content;

    // object to array
    if (typeof annotationArray === "object") {
        annotationArray = [annotationArray];
    }

    for (let annotation of annotationArray) {
        if (annotation.url) {

            // take first found url
            if (Array.isArray(annotation.url)) {
                self.enc_url = self.encodeURL(annotation.url[0]);
            } else {
                self.enc_url = self.encodeURL(annotation.url);
            }
        }
    }

    if (!self.enc_url) {
        self.enc_url = null;
    }

    let numberOfClasses = 0;
    let numberOfProperties = 0;

    for (let annotation of annotationArray) {
        numberOfClasses += uniquifyArray(countClasses(annotation)).length;
        numberOfProperties += countPropertiesByClass(annotation);
    }

    self.count = {
        'class': numberOfClasses,
        'properties': numberOfProperties,
        'statements': -1
    };

};

DatawarehouseJobs.methods.getPublicObject = function () {

    return {
        _id: this._id,
        name: this.name,
        domainSpecification: this.domainSpecification,
        type: this.type,
        language: this.language,
        UID: this.UID,
        CID: this.CID,
        enc_url: this.enc_url,
        updated: this.updated,
        created: this.created,
        content: this.content,
        source: this.source
    };
};


DatawarehouseJobs.methods.generateUID = function () {
};



DatawarehouseJobs.pre('save', function (next) {

});


DatawarehouseJobs.post('save', function recall(annotation) {


});

mongoose.model('Annotation', DatawarehouseJobs);

