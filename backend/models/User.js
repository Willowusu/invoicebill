const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  accountId: { type: mongoose.Schema.Types.ObjectId, ref: "Account", required: true },
  name: String,
  email: { type: String, unique: true },
  address: String,
  passwordHash: String,
  phone: String,
  role: { type: String, enum: ["admin", "staff"], default: "admin" }
});

module.exports = mongoose.model("User", userSchema);