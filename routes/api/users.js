const mongoose = require('mongoose')
const router = require('express').Router()
const passport = require('passport')
const User = mongoose.model('User')
const auth = require('../auth')

const {body, validationResult} = require('express-validator')

router.get('/users/:user',
    auth.optional,
    async function (req, res) {

        let username = req.params['user']
        let user = await User.findOne({username: username}).exec()

        if (!user) {
            return res.status(404).send({message: "user not found"})
        }

        return res.json({user: user.toJSON()})
    })

router.post('/users/login',
    body('user.email').isEmail(),
    body('user.password').isLength({min: 3}),
    async function (req, res) {

        passport.authenticate('local', {session: false}, function (error, user, info) {
            if (error) {
                return res.status(400).json({message: 'Error occurred'})
            }
            if (user) {
                user.token = user.generateJWT()
                const result = {user: user.toAuth()}
                return res.status(200).json(result)
            } else {
                return res.status(400).json(info)
            }
        })(req, res)
    })

router.post('/users',
    body('user.email').isEmail(),
    body('user.password').isLength({min: 3}),
    body('user.username').isLength({min: 3}),
    async function (req, res) {
        // validate data
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            console.log(errors)
            return res.status(400).json({errors: errors.array()})
        }

        const user = new User(req.body.user)
        user.setPassword(req.body.user.password)

        let userExists = await User.find({$or: [{username: user.username}, {email: user.email}]})
        if (userExists.length > 0) {
            return res.status(400).json({message: "User with this email or username already exists"})
        }

        await user.save()
        return res.status(200).json(user.toAuth())
    })

module.exports = router
