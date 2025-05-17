const mongoose = require("mongoose");

const accountSchema = new mongoose.Schema({
  name: String,
  type: { type: String, enum: ["individual", "company"], required: true },
  address: String,
  phone: String,
  logo: String,
  defaultInvoicePrefix: {
    type: String,
    default: "INV-"
  },
  defaultPaymentTerms: {
    type: Number,
    default: 30  // days
  },
  defaultTaxRate: {
    type: Number,
    default: 0    // in percentage
  },
  defaultInvoiceNotes: {
    type: String,
    default: ""
  }

}, { timestamps: true });

module.exports = mongoose.model("Account", accountSchema);
