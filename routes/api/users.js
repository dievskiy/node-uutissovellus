const mongoose = require('mongoose')
const router = require('express').Router()
const passport = require('passport')
const User = mongoose.model('User')
const auth = require('../auth')

const {body, validationResult} = require('express-validator')

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: The article ID
 *           example: 60918e1c74b75e1ddda90e02
 *         username:
 *           type: string
 *         email:
 *           type: string
 *         avatar:
 *           type: string
 *           description: Url for an avatar
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: creation date
 *     NewUserResponse:
 *       type: object
 *       properties:
 *         user:
 *           type: object
 *           properties:
 *             username:
 *               type: string
 *             email:
 *               type: string
 *             accessToken:
 *               type: string
 *     NewUser:
 *       type: object
 *       properties:
 *         user:
 *           type: object
 *           properties:
 *             username:
 *               type: string
 *             email:
 *               type: string
 *             password:
 *               type: string
 *
 *     UserLogin:
 *       type: object
 *       properties:
 *         user:
 *           type: object
 *           properties:
 *             email:
 *               type: string
 *             password:
 *               type: string
 */

/**
 * @swagger
 * /users/{username}:
 *   get:
 *     tags:
 *       - Users
 *     summary: Retrieve a user by username
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         description: username to search by
 *         schema:
 *           type: string
 *     responses:
 *       404:
 *         description: User not found
 *       200:
 *         description: user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 */
router.get('/users/:user',
    auth.optional,
    async function (req, res) {

        let username = req.params['user']
        let user = await User.findOne({username: username}).exec()

        if (!user) {
            return res.status(404).send({message: "user not found"})
        }

        return res.status(200).json({user: user.toJSON()})
    })


/**
 * @swagger
 * /users/login:
 *   post:
 *     tags:
 *       - Users
 *     summary: Login
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserLogin'
 *     responses:
 *       200:
 *         description: Successful login
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NewUserResponse'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
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

/**
 * @swagger
 * /users:
 *   post:
 *     tags:
 *       - Users
 *     summary: Register a user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NewUser'
 *     responses:
 *       200:
 *         description: User has been registered
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NewUserResponse'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
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
        // standard avatar
        user.avatar = "https://shif-bucket.s3.eu-central-1.amazonaws.com/avatar.png"

        let userExists = await User.find({$or: [{username: user.username}, {email: user.email}]})
        if (userExists.length > 0) {
            return res.status(400).json({message: "User with this email or username already exists"})
        }

        await user.save()
        return res.status(200).json(user.toAuth())
    })

module.exports = router
