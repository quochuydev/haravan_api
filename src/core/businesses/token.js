const express = require('express');
const app = express();
const OAuth2 = require('oauth').OAuth2;
const querystring = require('querystring');
const jwt = require('jsonwebtoken');
const _ = require('lodash');
const request = require("request");
const bodyParser = require('body-parser');

const config = {
	response_mode: 'form_post',
	url_authorize: 'https://accounts.hara.vn/connect/authorize',
	url_connect_token: 'https://accounts.hara.vn/connect/token',
	grant_type: 'authorization_code',
	nonce: 'asdfasdgd',
	response_type: 'code id_token',
	app_id: '4c5022e7863adb4af30ba766c3211e2b',
	app_secret: 'bf6a3b119ac3ef53b05d775e9969de3839eae82ae5f804f428bf5ab877fc669f',
	scope_login: 'openid profile email org userinfo',
	scope: 'openid profile email org userinfo com.write_products com.write_orders com.write_customers com.write_shippings com.write_inventories com.write_discounts grant_service offline_access wh_api',
	login_callback_url: 'http://localhost:3000/install/login',
	install_callback_url: 'http://localhost:3000/install/grandservice',
	// login_callback_url: 'https://quochuydev-app.herokuapp.com/install/login',
	// install_callback_url: 'https://quochuydev-app.herokuapp.com/install/grandservice',
	webhook: {
		hrVerifyToken: 'bOL3XFfZabhKe6dnJfCJuTAfi37dFchQ',  //https://randomkeygen.com/ (CodeIgniter Encryption Keys)
		subscribe: 'https://webhook.hara.vn/api/subscribe'
	},
};

module.exports = { buildUrlLogin, buildUrlInstall, getToken, getUserFromDecodeJwt, getShop, subscribe, webhookValidate }

function buildUrlLogin() {
	let objQuery = {
		response_mode: config.response_mode,
		response_type: config.response_type,
		scope: config.scope_login,
		client_id: config.app_id,
		redirect_uri: config.login_callback_url,
		nonce: config.nonce
	};
	let query = querystring.stringify(objQuery);
	return `${config.url_authorize}?${query}`;
}

function buildUrlInstall() {
	let objQuery = {
		response_mode: config.response_mode,
		response_type: config.response_type,
		scope: config.scope,
		client_id: config.app_id,
		redirect_uri: config.install_callback_url,
		nonce: config.nonce
	};
	let query = querystring.stringify(objQuery);
	return `${config.url_authorize}?${query}`;
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
					// console.log('param_token', param_token);
					resolve(param_token)
				}
			});
		} catch (error) {
			console.log('error', error);
			return resolve();
		}
	}))
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
			// console.log(body);
			resolve(body)
		});
	})
}

//--------------------------------------Webhook-----------------------------------//
var crypto = require('crypto');
async function subscribe(access_token) {
	return new Promise(resolve => {
		try {
			let options = {
				method: 'POST',
				url: config.webhook.subscribe,
				headers: {
					authorization: `Bearer ${access_token}`,
					'Content-Type': 'application/json'
				}
			};

			request(options, function (error, response, body) {
				if (error) {
					console.log(error);
				}
				console.log(body);
				resolve();
			});
		} catch (e) {
			console.log(e);
			resolve();
		}
	})
}

function webhookValidate(req, res, next) {
	let shop = req.headers['x-haravan-org-id'] || '';
	let signature = req.headers['x-haravan-hmac-sha256'] || '';
	let topic = req.headers['x-haravan-topic'] || '';
	let haravanBody = req.body.toString() || '';
	if (!shop || !signature || !topic) {
		return res.sendStatus(401);
	}

	var header = req.get('x-haravan-hmac-sha256');
	var token_secret = config.app_secret;

	var sh = crypto
		.createHmac('sha1', token_secret)
		.update(new Buffer(haravanBody, 'utf8'))
		.digest('hex');

	if (sh !== header) {
		return res.status(401).send();
	}

	next();
};