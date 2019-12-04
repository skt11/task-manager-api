const express = require('express');
const Task = require('../models/task');
const mongoose = require('mongoose');
const auth = require('../middleware/auth');

const router = express.Router();

//Set up post endpoint for create task
router.post('/tasks', auth, async ({ user, body }, res) => {

    const task = new Task({
        ...body,
        owner: user._id
    });

    try {
        await task.save();
        res.status(201).send(task);
    } catch (e) {
        res.status(400).send(e);
    }
})

//Set up get endpoint for getting all tasks
router.get('/tasks', auth, async ({ user, query }, res) => {
    const match = (!query.completed) ? {} : { completed: query.completed };
    const sort = {};

    if (query.sortBy) {
        const sortOptions = query.sortBy.split(':');
        sort[sortOptions[0]] = (sortOptions[1] === 'asc') ? 1 : -1;
    }
    try {

        await user.populate({
            path: 'tasks',
            match,
            options: {
                limit: parseInt(query.limit),
                skip: parseInt(query.skip),
                sort
            }
        }).execPopulate();

        if (!user.tasks) return res.sendStatus(404);
        res.send(user.tasks);
    } catch (e) {
        res.status(500).send(e);
    }
})

//Set up get endpoint for finding task by id
router.get('/tasks/:id', auth, async ({ params, user }, res) => {

    if (!mongoose.Types.ObjectId.isValid(params.id)) {
        return res.status(400).send({ error: 'Invalid ID' });
    }
    const _id = params.id;

    try {
        const task = await Task.findOne({ _id, owner: user._id });
        if (!task) return res.sendStatus(404);
        res.send(task);
    } catch (e) {
        console.log(e.stack)
        res.status(500).send(e);
    }
})

//Endpoint for task update
router.patch('/tasks/:id', auth, async ({ body, params, user }, res) => {

    const updates = Object.keys(body);
    const taskProperties = ['description', 'completed'];
    const isValidUpdate = updates.every(update => taskProperties.includes(update));

    if (!isValidUpdate) return res.status(400).send({ error: 'Invalid Update' });

    if (!mongoose.Types.ObjectId.isValid(params.id)) {
        return res.status(400).send({ error: 'Invalid ID' });
    }
    const _id = params.id;

    try {
        const task = await Task.findOne({ _id, owner: user._id });

        if (!task) return res.sendStatus(404);

        updates.forEach(update => task[update] = body[update]);

        await task.save();

        res.send(task);
    } catch (e) {
        res.status(400).send(e);
    }
})

//Delete task
router.delete('/tasks/:id', auth, async ({ params, user }, res) => {

    if (!mongoose.Types.ObjectId.isValid(params.id)) {
        return res.status(400).send({ error: 'Invalid ID' });
    }
    const _id = params.id;

    try {
        const task = await Task.findOneAndDelete({ _id, owner: user._id });
        if (!task) return res.sendStatus(404);
        res.send(task);
    } catch (e) {
        res.sendStatus(400);
    }
})

module.exports = router;
