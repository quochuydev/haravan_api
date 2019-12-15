const mongoose = require('mongoose');
const { Schema } = mongoose;

const ShopSchema = new Schema({
  shop: { type: String, default: null},
  shop_id: { type: Number, default: null},
  authorize: {
    access_token: { type: String, default: null}
  }
})

mongoose.model('Shop', ShopSchema);