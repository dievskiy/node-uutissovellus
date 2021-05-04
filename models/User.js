const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const secret = require('../config').secret;

const UserSchema = new mongoose.Schema({
    username: {type: String, lowercase: true, unique: true, required: true, index: true},
    email: {type: String, lowercase: true, unique: true, required: true, index: true},
    hash: String,
    salt: String,
    avatar: String
}, {timestamps: true});

UserSchema.plugin(uniqueValidator);

UserSchema.methods.validPassword = function (password) {
    const hash = crypto.pbkdf2Sync(password, this.salt, 10000, 512, 'sha512').toString('hex');
    return this.hash === hash;
};

UserSchema.methods.setPassword = function (password) {
    this.salt = crypto.randomBytes(16).toString('hex');
    this.hash = crypto.pbkdf2Sync(password, this.salt, 10000, 512, 'sha512').toString('hex');
};

UserSchema.methods.generateJWT = function () {
    const today = new Date();
    const exp = new Date(today);
    exp.setDate(today.getDate() + 60);

    return jwt.sign({
        id: this._id,
        username: this.username,
        exp: parseInt(exp.getTime() / 1000),
    }, secret);
};

UserSchema.methods.toAuth = function () {
    return {
        username: this.username,
        email: this.email,
        accessToken: this.generateJWT()
    }
}

UserSchema.methods.toJSON = function () {
    return {
        username: this.username,
        email: this.email,
        _id: this._id,
        createdAt: this.createdAt,
        avatar: this.avatar
    }
}
mongoose.model('User', UserSchema);
