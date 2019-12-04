const mongoose = require('mongoose');

const connectionURL = process.env.DB_URL;
const databaseName = 'task-manager-api';

mongoose.connect(`${connectionURL}/${databaseName}`, {
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false
})

module.exports = mongoose;