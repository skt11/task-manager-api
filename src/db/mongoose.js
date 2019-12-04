const mongoose = require('mongoose');

const connectionURL = process.env.DB_URL;

mongoose.connect(`${connectionURL}`, {
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false
})

module.exports = mongoose;