const path = require('path');
const request = require('request');
const omniBus = require(path.resolve('./src/core/businesses/token'));
const config = require(path.resolve('./src/core/config/default'));
const mongoose = require('mongoose');
const ShopMD = mongoose.model('Shop');

exports.get = (req, res) => {
	let url = omniBus.buildUrlInstall();
	res.send({ url })
}

exports.grandservice = async (req, res) => {
	let code = req.body.code;
	try {
		if (!code) return res.send('Code not found in request');
		let param_token = await omniBus.getToken(code, config.install_callback_url);
		if (!param_token) return res.send('Something went wrong!').status(400);
		let userHR = omniBus.getUserFromDecodeJwt(param_token);
		if (userHR.is_error) return res.send(userHR.message).status(400);
		if (!userHR.id || !userHR.orgname) return res.send('Can not find user or org');
		let authorizeInfo = {
			access_token: param_token.access_token,
			refresh_token: param_token.refresh_token,
			expires_in: param_token.expires_in
		};

		// authorizeInfo can save to database shop for reuse later

		// https://quochuydev.sku.vn/
		//test request shop.json
		let shopData = await omniBus.getShop(authorizeInfo.access_token);
		let shop = shopData.shop.myharavan_domain.replace('http://', '');
		shop = shopData.shop.myharavan_domain.replace('https://', '');
		let shop_id = shopData.shop.id;
		let updateData = {
			shop: shop,
			shop_id: shop_id,
			authorize: authorizeInfo
		}

		let found = await ShopMD.findOne({ shop_id }).lean(true);
		if (!found) {
			let shopNew = new ShopMD(updateData);
			let shopSaved = await shopNew.save();
		} else {
			let customerUpdate = await ShopMD.findOneAndUpdate({ shop_id }, { $set: updateData }, { lean: true, new: true });
		}
		req.session.shop = shop;
		req.session.shop_id = shop_id;
		req.session.access_token = authorizeInfo.access_token;
		req.session.save();
		res.send({ error: false, data: req.session });

		//if have use webhook, you need subscribe webhook with org token to use
		// await subscribe(authorizeInfo.access_token);
	} catch (err) {
		return res.send(err);
	}
}