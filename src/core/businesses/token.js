const express = require('express');
const app = express();
const OAuth2 = require('oauth').OAuth2;
const querystring = require('querystring');
const path = require('path');
const jwt = require('jsonwebtoken');
const _ = require('lodash');
const request = require("request");
const config = require(path.resolve('./src/core/config/default'));

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