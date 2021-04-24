const express = require('express'),
    session = require('express-session'),
    bodyParser = require('body-parser'),
    passport = require('passport'),
    errorhandler = require('errorhandler'),
    cors = require('cors'),
    mongoose = require('mongoose')

const isProd = process.env.NODE_ENV === 'production';

const app = express();

app.use(cors());

app.use(require('morgan')('dev'));
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

app.use(express.static(__dirname + '/public'));

app.use(session({secret: 'conduit', cookie: {maxAge: 60000}, resave: false, saveUninitialized: false}));

if (!isProd) {
    app.use(errorhandler());
}

if (isProd) {
    mongoose.connect(process.env.MONGODB_URI);
} else {
    mongoose.connect('mongodb://localhost/testmongo');
    mongoose.set('debug', true);
}

require('./models/User');
require('./models/Comment');
require('./models/Article');
require('./config/passport');

app.use(require('./routes'));

const server = app.listen(process.env.PORT || 3000, function () {
    console.log('Listening on port ' + server.address().port);
});