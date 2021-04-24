const mongoose = require('mongoose');
const router = require('express').Router();
const passport = require('passport');
const User = mongoose.model('User');

const {body, validationResult} = require('express-validator');
//
// router.get('/users/:',
//     auth.optional,
//     async function (req, res) {
//     let user = await User.findById(req.payload.id)
//
//     if (!user) {
//         return res.sendStatus(401);
//     }
//
//     return res.json({user: user.toAuthJSON()});
// })

router.post('/users/login',
    body('user.email').isEmail(),
    body('user.password').isLength({min: 3}),
    async function (req, res) {

        passport.authenticate('local', {session: false}, function (error, user, info) {
            if (error) {
                return res.status(400).json(error)
            }
            if (user) {
                user.token = user.generateJWT();
                return res.json({user: user.toAuthJSON()})
            } else {
                return res.status(422).json(info)
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
            return res.status(400).json({errors: errors.array()})
        }

        const user = new User(req.body.user)
        user.setPassword(req.body.user.password)

        try {
            await user.save()
            return res.status(200).json(user.toAuthJSON())
        } catch (e) {
            return res.status(400).json({message: "User with this email or username already exists"})
        }
    })

module.exports = router;
