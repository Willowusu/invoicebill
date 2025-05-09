const mongoose = require('mongoose');
const invoiceSchema = new mongoose.Schema({
  accountId: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },

  invoiceNumber: { type: String, required: true, unique: true },
  issueDate: { type: Date, default: Date.now },
  dueDate: { type: Date, required: true },

  items: [
    {
      description: String,
      quantity: Number,
      rate: Number,
      amount: Number, // quantity * rate (for quick retrieval)
    }
  ],

  subtotal: Number,
  taxRate: Number, // percent
  taxAmount: Number,
  total: Number,

  status: { type: String, enum: ['draft', 'sent', 'paid', 'overdue', 'invalid'], default: 'draft' },

  notes: String,
  paymentDate: Date,
  paidAmount: Number,

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Invoice', invoiceSchema);
