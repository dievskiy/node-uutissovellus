const router = require('express').Router()
const mongoose = require('mongoose')
const Article = mongoose.model('Article')
const Comment = mongoose.model('Comment')
const User = mongoose.model('User')
const auth = require('../auth')
const {body, validationResult} = require('express-validator')

const upload = require('../../services/upload-image')
const singleUpload = upload.single('image')

// get all articles
router.get('/feed', auth.optional, async function (req, res) {
    try {
        let articles = await Article.find()
        let mapped = []
        for await (let a of articles) {
            let result = JSON.parse(JSON.stringify(a))
            let user = await User.findOne({_id: a.author}).exec()
            result.author = {_id: user._id, username: user.username}
            mapped.push(result)
        }
        return res.status(200).send(mapped)
    } catch (e) {
        console.log("Error " + e)
        res.status(400).send({message: "error"})
    }
})

// create a new comment
router.post('/:article/comments',
    body('comment.body').isLength({min: 3}),
    auth.required,
    async function (req, res) {
        try {
            let articleId = req.params['article']

            let user = await User.findById(req.payload.id)
            if (!user) return res.status(401).send({})

            let article = await Article.findOne({_id: articleId}).exec()
            if (!article) return res.status(404).send({message: "article not found"})


            let comment = new Comment(req.body.comment)
            comment.article = articleId
            comment.author = user

            await comment.save()
            await Article.findOneAndUpdate({_id: comment.article}, {$push: {comments: comment}})

            return res.status(200).send({})
        } catch (err) {
            console.log('Error:' + err)
            return res.status(400).send(err)
        }
    })

// create a new article
router.post('/',
    body('article.title').exists(),
    body('article.body').isLength({min: 3}),
    // allow only uploaded images
    body('article.imageUrl').matches(/^https:\/\/shif-bucket.s3.amazonaws.com\/\w+$/),
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
            article.author = user
            await article.save()
            return res.status(200).send(article.jsonWith(user))
        } catch (err) {
            console.log('Error:' + err)
            res.status(400).send(err)
        }
    })


// return an article's comments
router.get('/:article/comments', auth.optional, async function (req, res) {
    try {
        let articleId = req.params['article']
        let comments = await Comment.find({article: articleId})
        return res.status(200).send(comments)
    } catch (err) {
        console.log('Error:' + err)
        return res.status(400).send(err)
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
