const express = require('express');
const User = require('../models/user');
const auth = require('../middleware/auth');
const multer = require('multer');
const sharp = require('sharp');

const router = express.Router();
const upload = multer({
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/i)) {
            return cb(new Error('Invalid file type'));
        }
        cb(undefined, true);
    }
})

//Set up post endpoint for create user
router.post('/users', async ({ body }, res) => {

    const user = new User(body);

    try {
        //getAuthenticationToken method generates token and saves the user to the db
        const token = await user.getAuthenticationToken();
        res.status(201).send({ user, token });
    } catch (e) {
        res.status(400).send(e);
    }
})

//Set up endpoint for user login
router.post('/users/login', async ({ body }, res) => {
    try {
        const user = await User.findByCredentials(body.email, body.password);
        const token = await user.getAuthenticationToken();
        if (!user) return res.sendStatus(404);
        res.send({ user, token });
    } catch (e) {
        res.status(400).send(e.message);
    }
})

//Set up endpoint for log out
router.post('/users/logout', auth, async ({ user, token }, res) => {
    try {
        user.tokens = user.tokens.filter(tkn => token !== tkn.token);
        await user.save();
        res.sendStatus(200);
    } catch (e) {
        res.send(500).send(e);
    }
})

//Set up endpoint for log out
router.post('/users/logoutAll', auth, async ({ user, token }, res) => {
    try {
        user.tokens = [];
        await user.save();
        res.sendStatus(200);
    } catch (e) {
        res.send(500).send(e);
    }
})

//Set up get endpoint for getting user
router.get('/users/me', auth, async ({ user }, res) => {
    res.send(user);
})

//Endpoint for user update
router.patch('/users/me', auth, async ({ body, user }, res) => {

    const updates = Object.keys(body);
    const userProperties = ['name', 'age', 'email', 'password'];
    const isValidUpdate = updates.every(update => userProperties.includes(update));

    if (!isValidUpdate) return res.status(400).send({ error: 'Invalid Update' });

    try {

        updates.forEach(update => user[update] = body[update]);

        await user.save();

        res.send(user);
    } catch (e) {
        res.status(400).send(e);
    }
})

//Delete user
router.delete('/users/me', auth, async ({ user }, res) => {

    try {
        const deletedUser = await user.remove();
        if (!deletedUser) return res.sendStatus(404);
        res.send(deletedUser);
    } catch (e) {
        res.sendStatus(400);
    }
})

//Endpoint for avatar upload
router.post('/users/me/avatar', auth, upload.single('avatar'), async ({ user, file }, res) => {
    try {
        const avatarBinary = await sharp(file.buffer).png().resize({ width: 250, height: 250 }).toBuffer();
        user.avatar = avatarBinary;
        await user.save();
        res.send();
    } catch (e) {
        res.sendStatus(500);
    }
}, (err, req, res, next) => {
    res.status(400).send({ error: err.message });
})

//Endpoint for avatar delete
router.delete('/users/me/avatar', auth, async ({ user }, res) => {
    try {
        user.avatar = undefined;
        await user.save();
        res.send();
    } catch (e) {
        res.send(404).send({ error: e.message });
    }
}, (err, req, res, next) => {
    res.status(400).send({ error: err.message });
})

//Serving up the picture
router.get('/users/:id/avatar', async ({ params }, res) => {
    const user = await User.findById(params.id);
    try {
        if (!user.avatar) {
            throw new Error('Avatar not found!');
        }
        res.header('Content-Type', 'image/png');
        res.send(user.avatar);
    } catch (e) {
        res.sendStatus(404);
    }
})
module.exports = router;