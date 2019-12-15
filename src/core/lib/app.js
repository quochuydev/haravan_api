const express = require('express');
const app = express();
const path = require('path');
const Routes = require(path.resolve('./src/core/routes/routes'))
const Express = require('./express');
const Mongoose = require('./mongoose');

const App = {
  init: () => {
    Mongoose.connect()
    .then(db => {
      console.log('connect success');
    })
    .catch(err => {
      console.log('connect mongo fail');
    })
    Express(app);
    Routes(app);
  },

  start: () => {
    App.init();
    app.listen(3000, () => {
      console.log('running port 3000');
    })
  }
}

module.exports = App;