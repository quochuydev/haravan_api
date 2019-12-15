const mongoose = require('mongoose');
const path = require('path');
const glob = require('glob');
const config = require('../config/default');

const Mongoose = {
  connect: async () => {
    mongoose.Promise = global.Promise;
    await mongoose.connect(config.db.uri, config.db.options);
    mongoose.set('debug', config.db.debug);
    return mongoose;
  },
  load: () => {
    let models = glob.sync('src/*/models/*.js');
    models.forEach(function (model) {
      require(path.resolve(model));
    });
  }
}

module.exports = Mongoose;