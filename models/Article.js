const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
// const slug = require('slug');
const User = mongoose.model('User');

const ArticleSchema = new mongoose.Schema({
    // slug: {type: String, lowercase: true, unique: true},
    title: String,
    imageUrl: String,
    body: String,
    comments: [{type: mongoose.Schema.Types.ObjectId, ref: 'Comment'}],
    tagList: [{type: String}],
    author: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true}
}, {timestamps: true});

ArticleSchema.plugin(uniqueValidator);

// ArticleSchema.pre('validate', function(next){
//     if(!this.slug)  {
//         this.slugify();
//     }
//
//     next();
// });
//
// ArticleSchema.methods.slugify = function() {
//     this.slug = slug(this.title) + '-' + (Math.random() * Math.pow(36, 6) | 0).toString(36);
// };

ArticleSchema.methods.jsonWith = function (user) {
    return {
        _id: this._id,
        title: this.title,
        body: this.body,
        imageUrl: this.imageUrl,
        createdAt: this.createdAt,
        tagList: this.tagList,
        author: {
            username: user.username,
            _id: user._id
        }
    };
};

mongoose.model('Article', ArticleSchema);