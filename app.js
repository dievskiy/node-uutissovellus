const express = require('express'),
    session = require('express-session'),
    bodyParser = require('body-parser'),
    passport = require('passport'),
    errorhandler = require('errorhandler'),
    cors = require('cors'),
    mongoose = require('mongoose')
require('dotenv').config()

const isProd = process.env.NODE_ENV === 'production'

const app = express()

app.use(cors())
app.options('*', cors())

app.use(require('morgan')('dev'))
app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())


app.use(session({secret: 'secret', cookie: {maxAge: 60000}, resave: false, saveUninitialized: false}))

if (!isProd) {
    app.use(errorhandler())
}

mongoose.connect(process.env.MONGODB_URI)
    .then(res => {
        console.log("Successfully connected to db...")
    })
    .catch(err => {
        // crash if no db available
        console.log("No db available")
        process.exit(1)
    })


require('./models/User')
require('./models/Article')
require('./config/passport')

app.use(require('./routes'))

const server = app.listen(process.env.PORT || 3000, function () {
    console.log('Listening on port ' + server.address().port)
})
