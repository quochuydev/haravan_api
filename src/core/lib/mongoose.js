const mongoose = require('mongoose');
const config = require('../config/default');

const Mongoose = {
  connect: async () => {
    mongoose.Promise = global.Promise;
    await mongoose.connect(config.db.uri, config.db.options);
    mongoose.set('debug', config.db.debug);
    return mongoose;
  }
}

module.exports = Mongoose;