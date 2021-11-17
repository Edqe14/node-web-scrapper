const mongoose = require('mongoose');

module.exports = mongoose.connect.bind(null, process.env.DB_URL);