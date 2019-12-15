const express = require('express');
const app = express();
const path = require('path');
const Routes = require(path.resolve('./src/core/routes/routes'))
const Express = require('./express');
const Mongoose = require('./mongoose');
const config = require('../config/default');

const App = {
  init: () => {
    Mongoose.connect()
    .then(db => {
      console.log('connect mongo success');
    })
    .catch(err => {
      console.log(err)
      console.log('connect mongo fail');
    })
    Express(app);
    Routes(app);
  },

  start: () => {
    App.init();
    app.listen(config.port, () => {
      console.log('running port 3000');
    })
  }
}

module.exports = App;