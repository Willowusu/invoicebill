const mongoose = require("mongoose");

const accountSchema = new mongoose.Schema({
  name: String,
  type: { type: String, enum: ["individual", "company"], required: true },
  address: String,
  phone: String,
  logo: String
});

module.exports = mongoose.model("Account", accountSchema);
