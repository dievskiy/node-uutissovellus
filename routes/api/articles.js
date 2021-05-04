const router = require('express').Router()
const mongoose = require('mongoose')
const Article = mongoose.model('Article')
const User = mongoose.model('User')
const auth = require('../auth')
const {body, validationResult} = require('express-validator')

const upload = require('../../services/upload-image')
const singleUpload = upload.single('image')

// get all articles
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
            return res.status(200).send(articles)
        } catch (e) {
            console.log("Error " + e)
            res.status(400).send({message: "error"})
        }
    })

// create a new comment
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

// create a new article
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

// upload a photo for article to s3
router.post('/upload-image', auth.required, async function (req, res) {
    singleUpload(req, res, async function (err) {
        if (err) {
            return res.status(422).send({errors: [{title: 'Image Upload Error', detail: err.message}]});
        }

        return res.json({'imageUrl': req.file.location});
    });
})

module.exports = router
