const express = require('express');
const app = express();
const path = require('path');
const Mongoose = require('./mongoose');
const Express = require('./express');
const config = require('../config/default');

const App = {
  init: () => {
    Mongoose.load();
    Mongoose.connect()
    .then(db => {
      Express(app, db);
      const Routes = require(path.resolve('./src/core/routes/routes'))
      Routes(app);
      console.log('connect mongo success');
    })
    .catch(err => {
      console.log(err)
      console.log('connect mongo fail');
    })
  },

  start: () => {
    App.init();
    app.listen(config.port, () => {
      console.log('running port 3000');
    })
  }
}

module.exports = App;