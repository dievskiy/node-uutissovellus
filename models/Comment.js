const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
    body: String,
    author: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    article: {type: mongoose.Schema.Types.ObjectId, ref: 'Article'}
}, { timestamps: { createdAt: true, updatedAt: false } });

CommentSchema.methods.jsonWith = function (user) {
    return {
        id: this._id,
        body: this.body,
        createdAt: this.createdAt,
        author: {
            username: user.username,
            bio: user.bio
        }
    };
};

mongoose.model('Comment', CommentSchema);
