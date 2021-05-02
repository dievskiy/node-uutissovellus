const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');


const ArticleSchema = new mongoose.Schema({
    title: String,
    imageUrl: String,
    body: String,
    comments: [{
        author: {type: mongoose.Schema.Types.ObjectId},
        body: {type: String},
        createdAt: {type: Date, default: Date.now},
        _id : {id:false}
    }],
    tagList: [{type: String}],
    author: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true}
}, {timestamps: true});

ArticleSchema.plugin(uniqueValidator);

ArticleSchema.methods.jsonWith = function (user) {
    return {
        _id: this._id,
        title: this.title,
        body: this.body,
        imageUrl: this.imageUrl,
        createdAt: this.createdAt,
        tagList: this.tagList,
        comments: this.comments,
        author: {
            username: user.username,
            _id: user._id
        }
    };
};

mongoose.model('Article', ArticleSchema);
