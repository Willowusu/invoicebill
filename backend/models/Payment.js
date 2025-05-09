const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', required: true },
  accountId: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true },

  amount: { type: Number, required: true },
  method: { type: String, enum: ['card', 'paypal', 'bank', 'cash'], required: true },
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },

  transactionId: String, // from Stripe or PayPal
  paidAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Payment', paymentSchema);
