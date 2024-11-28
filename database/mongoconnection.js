const mongoose = require('mongoose');

mongoose.connect('mongodb+srv://anmolrajputzixisoft:sIOPPDA3POqvfhq8@cluster0.a7mtijw.mongodb.net/CCS')
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('Error connecting to MongoDB', err));

module.exports = mongoose.connection;
