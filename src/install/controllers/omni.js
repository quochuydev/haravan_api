const path = require('path');
const request = require('request');
const jwt = require('jsonwebtoken');
const _ = require('lodash');
const OAuth2 = require('oauth').OAuth2;
const omniBus = require(path.resolve('./src/core/businesses/token'));
const config = require(path.resolve('./src/core/config/default'));

exports.get = (req, res) => {
  let url = omniBus.buildUrlInstall();
  res.send({ url })
}

exports.grandservice = async (req, res) => {
  let code = req.body.code;
  try {
		if (!code) return res.send('Code not found in request');
		let param_token = await getToken(code, config.install_callback_url);
		if (!param_token) return res.send('Something went wrong!').status(400);
		let userHR = getUserFromDecodeJwt(param_token);
		if (userHR.is_error) return res.send(userHR.message).status(400);
		if (!userHR.id || !userHR.orgname) return res.send('Can not find user or org');
		let authorizeInfo = {
			access_token: param_token.access_token,
			refresh_token: param_token.refresh_token,
			expires_in: param_token.expires_in
		};

		// authorizeInfo can save to database shop for reuse later

		//test request shop.json
		let shopData = await getShop(authorizeInfo.access_token);
		res.send(shopData);

		//if have use webhook, you need subscribe webhook with org token to use
		// await subscribe(authorizeInfo.access_token);
	} catch (err) {
		return res.send(err);
	}
}

function getShop(access_token) {
	return new Promise(resolve => {
		let options = {
			method: 'GET',
			url: 'https://apis.hara.vn/com/shop.json',
			headers:
			{
				authorization: `Bearer ${access_token}`,
				'Content-Type': 'application/json'
			},
			json: true
		};

		request(options, function (error, response, body) {
			if (error) throw new Error(error);
			console.log(body);
			resolve(body)
		});
	})
}
function getUserFromDecodeJwt(params) {
	try {
		let userHR = jwt.decode(params.id_token);
		if (!_.isObjectLike(userHR)) {
			return {
				is_error: true,
				message: 'Get User Info Failed'
			};
		}
		if (!userHR.id) {
			userHR.id = userHR.sub;
		}
		return userHR;
	} catch (e) {
		return {
			is_error: true,
			message: `Get User Info Failed ${e.message}`
		};
	}
}

function getToken(code, callback_url) {
	return new Promise((resolve => {
		try {
			let params = {};
			params.grant_type = config.grant_type;
			params.redirect_uri = callback_url;

			let _oauth2 = new OAuth2(
				config.app_id,
				config.app_secret,
				'',
				config.url_authorize,
				config.url_connect_token,
				''
			);

			_oauth2.getOAuthAccessToken(code, params, (err, accessToken, refreshToken, param_token) => {
				if (err) {
					console.log('error', err);
					resolve();
				} else {
					console.log('param_token', param_token);
					resolve(param_token)
				}
			});
		} catch (error) {
			console.log('error', error);
			return resolve();
		}
	}))
}

// let test = () => {
//   let url = omniBus.buildUrlInstall();
//   console.log(url)
// }
// test()