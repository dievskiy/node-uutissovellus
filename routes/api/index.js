const router = require('express').Router()

router.use('/', require('./users'))
router.use('/articles', require('./articles'))
router.use('/tags', require('./tags'))

module.exports = router