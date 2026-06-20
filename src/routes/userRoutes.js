const express = require('express');
const userController = require('../controllers/userController');
const validate = require('../middlewares/validate');
const { createUserSchema } = require('../validators/userValidator');

const router = express.Router();

router.post('/', validate(createUserSchema, 'body'), userController.createUser);
router.get('/:userId', userController.getUser);

module.exports = router;
