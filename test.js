let HaravanAPI = require('./index');
let express = require('express');
let app = express();

let config = {
  app_id: '4c5022e7863adb4af30ba766c3211e2b',
  app_secret: 'bf6a3b119ac3ef53b05d775e9969de3839eae82ae5f804f428bf5ab877fc669f',
  scope: 'openid profile email org userinfo',
  scope_install: 'openid profile email org userinfo com.write_products com.write_orders com.write_customers com.write_shippings com.write_inventories com.write_discounts grant_service offline_access wh_api',
  login_callback_url: 'http://localhost:3000/install/login',
  install_callback_url: 'http://localhost:3000/install/login',
}

const start = ({ app }) => {
  app.get('/buildLinkLogin', async (req, res) => {
    let HrvAPI = new HaravanAPI({
      app_id: config.app_id,
      app_secret: config.app_secret,
      scope: config.scope,
      callback_url: config.login_callback_url
    });
    let urlLogin = HrvAPI.buildLinkLogin();
    res.json(urlLogin)
  })

  app.get('/buildLinkInstall', async (req, res) => {
    let HrvAPI = new HaravanAPI({
      app_id: config.app_id,
      app_secret: config.app_secret,
      scope: config.scope_install,
      callback_url: config.install_callback_url
    });
    let urlInstall = HrvAPI.buildLinkInstall();
    res.json(urlInstall)
  })

  app.post('/install/login', async (req, res) => {
    // let HrvAPI = new HaravanAPI({
    //   app_id: '4c5022e7863adb4af30ba766c3211e2b',
    //   app_secret: 'bf6a3b119ac3ef53b05d775e9969de3839eae82ae5f804f428bf5ab877fc669f',
    // });
    // let token = await HrvAPI.getToken();
    // console.log(token);
    res.send('login')
  })

  app.post('/install/grandservice', async (req, res) => {

  })

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`running on port: ${PORT}`)
  });
}
start({ app });