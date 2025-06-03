
const Invoice = require('../models/Invoice');
const Client = require('../models/Client');
const Account = require('../models/Account'); // make sure to import it
const Payment = require('../models/Payment'); // make sure to import it
const nodemailer = require('nodemailer'); // assuming already configured
const { response } = require('../utils/response');
const mail = require('../utils/mail');
const jwt = require('jsonwebtoken');

exports.createInvoice = async (req, res) => {

  // Check if user is authenticated
  if (!req.user) {
    return res.status(401).json(response(401, 'error', null, 'Unauthorized'));
  }
  try {
    const user = req.user;

    const account = await Account.findById(user.accountId);
    if (!account) {
      return res.status(404).json(response(404, 'error', null, 'Account not found or does not belong to user'));
    }


    const { clientId, items, dueDate, notes, taxRate = 0 } = req.body;

    // Basic validation
    if (!clientId || !items || !Array.isArray(items) || items.length === 0 || !dueDate) {
      return res.status(400).json(response(400, 'error', null, 'Client ID, items, and due date are required'));
    }

    // Check if client exists and belongs to user
    const client = await Client.findOne({ _id: clientId, accountId: user.accountId });
    if (!client) {
      return res.status(404).json(response(404, 'error', null, 'Client not found or does not belong to user'));
    }

    // Calculate subtotal and item amounts
    let subtotal = 0;
    const enrichedItems = items.map(item => {
      const amount = item.quantity * item.rate;
      subtotal += amount;
      return { ...item, amount };
    });

    const taxAmount = (subtotal * taxRate) / 100;
    const total = subtotal + taxAmount;

    // Generate a simple invoice number (you can make this more robust)
    const invoiceNumber = `${account.defaultInvoicePrefix}${Date.now()}`;

    // Create the invoice
    const newInvoice = new Invoice({
      accountId: user.accountId,
      clientId,
      invoiceNumber,
      items: enrichedItems,
      dueDate,
      notes,
      subtotal,
      taxRate,
      taxAmount,
      total,
      status: 'draft'
    });

    await newInvoice.save();

    return res.status(201).json(response(201, 'success', newInvoice, 'Invoice created successfully'));
  } catch (err) {
    console.error('Error creating invoice:', err);
    res.status(500).json(response(500, 'error', null, 'Server error'));
  }
};

exports.getInvoices = async (req, res) => {
  try {
    const user = req.user;

    // Fetch invoices for the authenticated user
    const invoices = await Invoice.find({ accountId: user.accountId, status: { $ne: 'invalid' } }).populate('clientId', 'name email');

    if (!invoices || invoices.length === 0) {
      return res.status(404).json(response(404, 'error', null, 'No invoices found'));
    }

    return res.status(200).json(response(200, 'success', invoices, 'Invoices fetched successfully'));
  } catch (err) {
    console.error('Error fetching invoices:', err);
    res.status(500).json(response(500, 'error', null, 'Server error'));
  }
};

exports.getInvoiceById = async (req, res) => {
  try {
    const user = req.user;
    const invoiceId = req.params.invoiceId;

    // Fetch invoice by ID for the authenticated user
    const invoice = await Invoice.findOne({ _id: invoiceId, accountId: user.accountId }).populate('clientId').populate('accountId');

    if (!invoice) {
      return res.status(404).json(response(404, 'error', null, 'Invoice not found'));
    }

    return res.status(200).json(response(200, 'success', invoice, 'Invoice fetched successfully'));
  } catch (err) {
    console.error('Error fetching invoice:', err);
    res.status(500).json(response(500, 'error', null, 'Server error'));
  }
};


exports.sendInvoiceByEmail = async (req, res) => {
  try {
    const user = req.user;
    const invoiceId = req.params.invoiceId;

    // 1. Fetch invoice with user check
    const invoice = await Invoice.findOne({ _id: invoiceId, accountId:user.accountId }).populate('clientId');
    if (!invoice) {
      return res.status(404).json(response(404, 'error', null, 'Invoice not found or does not belong to user'));
    }

    const client = invoice.clientId;
    if (!client.email) {
      return res.status(400).json(response(400, 'error', null, 'Client email not found'));
    }

    const token = jwt.sign(
      {
        invoiceId: invoice._id,
        type: 'invoice-view',
        accountId: user.accountId
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' } // or shorter, like '2d'
    );

    // 2. Build email content
    const subject = `Invoice #${invoice.invoiceNumber} from ${req.user.accountName}`; //company name must be modified
    const htmlContent = `
      <h2>Hi ${client.name},</h2>
      <p>Please find your invoice below:</p>
      <p><strong>Invoice Total:</strong> GHS ${invoice.total.toFixed(2)}</p>
      <p><strong>Due Date:</strong> ${new Date(invoice.dueDate).toLocaleDateString()}</p>
      <p><a href="http://localhost:5000/view-invoice?token=${token}">View & Pay Invoice</a></p>
      <br>
      <p>Thank you!</p>
    `;

    // 3. Send the email
    const mailOptions = {
      from: `"${req.user.companyName}" <${req.user.email}>`, // sender address
      to: client.email,//"khorus43@gmail.com",
      subject,
      html: htmlContent
    };

    await mail.sendEmail(mailOptions.from, mailOptions.to, mailOptions.subject, null, mailOptions.html);

    // 4. Mark invoice as sent (if not already)
    invoice.status = 'sent';
    await invoice.save();

    res.status(200).json(response(200, 'success', null, 'Invoice sent successfully'));
  } catch (err) {
    console.error('Error sending invoice email:', err);
    res.status(500).json(response(500, 'error', null, 'Server error'));
  }
};

exports.updateInvoice = async (req, res) => {
  if (!req.user) {
    return res.status(401).json(response(401, 'error', null, 'Unauthorized'));
  }

  try {
    const user = req.user;
    const { invoiceId } = req.params;
    const { items, dueDate, notes, taxRate } = req.body;

    // Find the invoice and check ownership
    const invoice = await Invoice.findOne({ _id: invoiceId, accountId: user.accountId });
    if (!invoice) {
      return res.status(404).json(response(404, 'error', null, 'Invoice not found'));
    }

    // Optional: prevent editing sent/paid invoices
    if (['sent', 'paid'].includes(invoice.status)) {
      return res.status(400).json(response(400, 'error', null, 'Cannot edit a sent or paid invoice'));
    }

    // Update allowed fields
    if (dueDate) invoice.dueDate = dueDate;
    if (notes !== undefined) invoice.notes = notes;
    if (taxRate !== undefined) invoice.taxRate = taxRate;

    // Update items and recalculate totals
    if (items && Array.isArray(items) && items.length > 0) {
      let subtotal = 0;
      const enrichedItems = items.map(item => {
        const amount = item.quantity * item.rate;
        subtotal += amount;
        return { ...item, amount };
      });

      const taxAmount = (subtotal * (invoice.taxRate || 0)) / 100;
      const total = subtotal + taxAmount;

      invoice.items = enrichedItems;
      invoice.subtotal = subtotal;
      invoice.taxAmount = taxAmount;
      invoice.total = total;
    }

    await invoice.save();

    return res.status(200).json(response(200, 'success', invoice, 'Invoice updated successfully'));
  } catch (err) {
    console.error('Error updating invoice:', err);
    res.status(500).json(response(500, 'error', null, 'Server error'));
  }
};

exports.deleteInvoice = async (req, res) => {
  if (!req.user) {
    return res.status(401).json(response(401, 'error', null, 'Unauthorized'));
  }

  try {
    const user = req.user;
    const { invoiceId } = req.params;

    const invoice = await Invoice.findOne({ _id: invoiceId, accountId: user.accountId });
    if (!invoice) {
      return res.status(404).json(response(404, 'error', null, 'Invoice not found'));
    }

    // Optional: prevent deletion of paid invoices
    if (invoice.status === 'paid') {
      return res.status(400).json(response(400, 'error', null, 'Cannot delete a paid invoice'));
    }

    invoice.status = 'invalid';
    await invoice.save();

    return res.status(200).json(response(200, 'success', invoice, 'Invoice marked as invalid'));
  } catch (err) {
    console.error('Error deleting invoice:', err);
    res.status(500).json(response(500, 'error', null, 'Server error'));
  }
};


exports.markAsPaid = async (req, res) => {
  if (!req.user) {
    return res.status(401).json(response(401, 'error', null, 'Unauthorized'));
  }

  try {
    const user = req.user;
    const { invoiceId } = req.params;
    const { method = 'cash', transactionId = null } = req.body;

    const invoice = await Invoice.findOne({ _id: invoiceId, accountId: user.accountId });
    if (!invoice) {
      return res.status(404).json(response(404, 'error', null, 'Invoice not found'));
    }

    if (invoice.status === 'paid') {
      return res.status(400).json(response(400, 'error', null, 'Invoice is already marked as paid'));
    }

    if (invoice.status === 'invalid') {
      return res.status(400).json(response(400, 'error', null, 'Cannot pay an invalid invoice'));
    }

    // Create payment record
    const payment = new Payment({
      invoiceId,
      accountId: user.accountId,
      amount: invoice.total,
      method,
      status: 'completed',
      transactionId,
      paidAt: new Date()
    });

    await payment.save();

    // Update invoice
    invoice.status = 'paid';
    invoice.paidAt = payment.paidAt;
    await invoice.save();

    return res.status(200).json(response(200, 'success', { invoice, payment }, 'Invoice marked as paid successfully'));
  } catch (err) {
    console.error('Error marking invoice as paid:', err);
    res.status(500).json(response(500, 'error', null, 'Server error'));
  }
};


exports.publicViewInvoice = async (req, res) => {
  const token = req.query.token;

  if (!token) {
    return res.status(400).json(response(400, 'error', null, 'Missing token'));
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    if (payload.type !== 'invoice-view') {
      return res.status(403).json(response(403, 'error', null, 'Invalid token type'));
    }

    const invoice = await Invoice.findOne({ _id: payload.invoiceId, accountId: payload.accountId }).populate('clientId accountId');

    if (!invoice) {
      return res.status(404).json(response(404, 'error', null, 'Invoice not found'));
    }

    return res.status(200).json(response(200, 'success', invoice));
  } catch (err) {
    return res.status(401).json(response(401, 'error', null, 'Invalid or expired token'));
  }
}
