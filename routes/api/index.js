const router = require('express').Router()

router.use('/', require('./users'))
router.use('/articles', require('./articles'))

module.exports = router
