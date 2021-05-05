const router = require('express').Router()
const mongoose = require('mongoose')
const Article = mongoose.model('Article')
const User = mongoose.model('User')
const auth = require('../auth')
const {body, validationResult} = require('express-validator')
const upload = require('../../services/upload-image')
const singleUpload = upload.single('image')

/**
 * @swagger
 * components:
 *   schemas:
 *     Article:
 *       type: object
 *       properties:
 *         author:
 *           type: object
 *           properties:
 *             username:
 *               type: string
 *               description: username
 *             _id:
 *               type: string
 *               description: id of the user
 *         _id:
 *           type: string
 *           description: The article ID
 *           example: 60918e1c74b75e1ddda90e02
 *         title:
 *           type: string
 *           description: The article's title
 *         body:
 *           type: string
 *           description: The article's body content
 *         imageUrl:
 *           type: string
 *           description: Url for an image cover
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: creation date of the article
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: last update
 *         comments:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               author:
 *                 type: string
 *                 description: username of the author
 *               body:
 *                 type: string
 *                 description: The comment content
 *               createdAt:
 *                 type: string
 *                 format: date-time
 *                 description: creation date of the comment
 *     NewArticle:
 *       type: object
 *       properties:
 *         article:
 *           type: object
 *           properties:
 *             title:
 *               type: string
 *               description: The article's title
 *             body:
 *               type: string
 *               description: The article's body content
 *             imageUrl:
 *               type: string
 *               description: Url for an image cover
 *
 */

/**
 * @swagger
 * /articles/feed:
 *   get:
 *     tags:
 *       - Articles
 *     summary: Retrieve a list of articles
 *     parameters:
 *       - in: query
 *         name: user
 *         required: false
 *         description: articles' author username
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A list of articles.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NewArticle'
 */
router.get('/feed',
    auth.optional,
    async function (req, res) {
        try {
            // if user is specified, search articles only for this user

            let username = req.query['user']
            let articles

            if (username) {
                articles = await Article.find({'author.username': username}).sort({'createdAt': -1})
            } else {
                // sort in the descending order
                articles = await Article.find().sort({'createdAt': -1})
            }
            return res.status(200).send({articles: articles})
        } catch (e) {
            console.log("Error " + e)
            res.status(400).send({message: "error"})
        }
    })

/**
 * @swagger
 * /articles/{articleId}/comments:
 *   post:
 *     tags:
 *       - Articles
 *     security:
 *       - bearerAuth: []
 *     summary: Create a comment for article
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               comment:
 *                 type: object
 *                 properties:
 *                   body:
 *                     type: string
 *                     description: Comment for an article
 *     parameters:
 *       - in: path
 *         name: articleId
 *         required: true
 *         description: ID of the article
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Comment has been created
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Article not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *
 */
router.post('/:article/comments',
    body('comment.body').isLength({min: 3, max: 1024}),
    auth.required,
    async function (req, res) {
        try {
            let articleId = req.params['article']

            let user = await User.findById(req.payload.id)
            if (!user) return res.status(401).send({})

            let article = await Article.findOne({_id: articleId}).exec()
            if (!article) return res.status(404).send({message: "article not found"})


            let comment = {
                body: req.body.comment.body,
                author: user.username
            }
            console.log(comment)

            await article.update({$push: {comments: comment}})

            return res.status(200).send({})
        } catch (err) {
            console.log('Error:' + err)
            return res.status(400).send({message: 'Error occurred'})
        }
    })

/**
 * @swagger
 * /articles:
 *   post:
 *     tags:
 *       - Articles
 *     security:
 *       - bearerAuth: []
 *     summary: Create an article
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NewArticle'
 *     responses:
 *       200:
 *         description: Article has been created
 *       401:
 *         description: Not authenticated
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errors:
 *                   type: array
 *                   items:
 *                     error:
 *                     type: string
 *
 */
router.post('/',
    body('article.title').exists().isLength({min: 3, max: 256}),
    body('article.body').isLength({min: 3, max: 8192}),
    // allow only uploaded images
    body('article.imageUrl').matches(/^https:\/\/shif-bucket.s3.eu-central-1.amazonaws.com\/\w+$/),
    auth.required,
    async function (req, res) {
        try {
            // validate data
            const errors = validationResult(req)
            if (!errors.isEmpty()) {
                return res.status(400).json({errors: errors.array()})
            }

            let user = await User.findById(req.payload.id)
            if (!user) return res.sendStatus(401)

            let article = new Article(req.body.article)
            article.author = {_id: user, username: user.username}
            await article.save()
            return res.status(200).send(article.jsonWith(user))
        } catch (err) {
            console.log('Error:' + err)
            res.status(400).send({message: 'Error occurred'})
        }
    })


/**
 * @swagger
 * /articles/{articleId}:
 *   get:
 *     tags:
 *       - Articles
 *     summary: Retrieve an article by ID
 *     parameters:
 *       - in: path
 *         name: articleId
 *         required: true
 *         description: article's ID
 *         schema:
 *           type: string
 *     responses:
 *       404:
 *         description: Article Not found
 *       200:
 *         description: An article
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Article'
 */
// get article by id
router.get('/:articleId', auth.optional,
    async function (req, res) {
        try {
            let articleId = req.params['articleId']

            let article = await Article.findOne({_id: articleId})
            if (!article) {
                res.status(404).send({message: 'Article not found'})
            }

            article.comments = article.comments
                .sort((firstItem, secondItem) => firstItem.createdAt - secondItem.createdAt).reverse()

            return res.status(200).send(article)
        } catch (err) {
            console.log('Error:' + err)
            return res.status(400).send({message: 'Error occurred'})
        }
    })


/**
 * @swagger
 * /articles/upload-image:
 *   post:
 *     tags:
 *       - Articles
 *     security:
 *       - bearerAuth: []
 *     summary: Upload an image
 *     requestBody:
 *       required: true
 *       content:
 *         image/*:
 *           schema:
 *             type: string
 *             format: binary
 *     responses:
 *       200:
 *         description: Image has been uploaded
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 imageUrl:
 *                   type: string
 *       401:
 *         description: Not authenticated
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errors:
 *                   type: array
 *                   items:
 *                     error:
 *                     type: string
 *
 */
// upload a photo for article to s3
router.post('/upload-image', auth.required, async function (req, res) {
    singleUpload(req, res, async function (err) {
        if (err) {
            return res.status(400).send({errors: [{title: 'Image Upload Error', detail: err.message}]});
        }

        return res.status(200).json({'imageUrl': req.file.location});
    });
})

module.exports = router
