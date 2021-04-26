const mongoose = require('mongoose');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User = mongoose.model('User');

passport.use(new LocalStrategy({
    usernameField: 'user[email]',
    passwordField: 'user[password]'
}, async function (email, password, done) {
    let user = await User.findOne({email: email})
    if (!user || !user.validPassword(password)) {
        return done(null, false, {errors: {'email or password': 'is invalid'}})
    }
    return done(null, user);
}))
