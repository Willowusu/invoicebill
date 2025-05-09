const Client = require('../models/Client');
const Invoice = require('../models/Invoice');
const { response } = require('../utils/response');

exports.createClient = async (req, res) => {

  try {
    const { name, email, phone, company, address, notes } = req.body;

    console.log(req.body)

    const user = req.user; // Assuming user is set in req by authentication middleware


    // Validate input
    if (!name || !email || !phone || !address) {
      return res.status(400).json(response(400, 'error', null, 'All fields are required'));
    }

    // Create new client
    const client = new Client({
      accountId: user.accountId,
      name,
      email,
      phone,
      company,
      address,
      notes
    });

    await client.save();

    return res.status(201).json(response(201, 'success', client, 'Client created successfully'));
  } catch (err) {
    console.error(err);
    return res.status(500).json(response(500, 'error', null, 'Internal server error'));
  }

}

exports.getClients = async (req, res) => {
  try {
    const user = req.user;


    // Fetch clients for the authenticated user
    const clients = await Client.find({ accountId: user.accountId, status: 'active' });

    if (!clients || clients.length === 0) {
      return res.status(404).json(response(404, 'error', null, 'No clients found'));
    }

    return res.status(200).json(response(200, 'success', clients, 'Clients fetched successfully'));
  } catch (err) {
    console.error('Error fetching clients:', err);
    res.status(500).json(response(500, 'error', null, 'Server error'));
  }
}

exports.getClientById = async (req, res) => {
  try {
    const user = req.user;
    const clientId = req.params.clientId;

    // Fetch client
    const client = await Client.findOne({ _id: clientId, accountId: user.accountId, status: 'active' });

    if (!client) {
      return res.status(404).json(response(404, 'error', null, 'Client not found'));
    }

    // Fetch related invoices
    const invoices = await Invoice.find({ clientId: clientId, accountId: user.accountId });

    // Financial summary calculations
    const totalInvoices = invoices.length;
    const totalSpent = invoices
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + (inv.total || 0), 0);

    const outstandingBalance = invoices
      .filter(inv => inv.status === 'sent' || inv.status === 'overdue')
      .reduce((sum, inv) => sum + ((inv.total || 0) - (inv.paidAmount || 0)), 0);

    const clientData = {
      ...client.toObject(),
      financialSummary: {
        totalInvoices,
        totalSpent,
        outstandingBalance
      }
    };

    return res.status(200).json(response(200, 'success', clientData, 'Client fetched successfully'));
  } catch (err) {
    console.error('Error fetching client:', err);
    res.status(500).json(response(500, 'error', null, 'Server error'));
  }
}


exports.updateClient = async (req, res) => {
  try {
    const user = req.user;
    const clientId = req.params.clientId;
    const updates = req.body;

    // Check if the client exists and belongs to the current user
    const client = await Client.findOne({ _id: clientId, accountId: user.accountId });

    if (!client) {
      return res.status(404).json(response(404, 'error', null, 'Client not found or unauthorized.'));
    }

    // Update only the allowed fields
    const allowedFields = ['name', 'email', 'phone', 'company', 'address', 'notes'];
    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        client[field] = updates[field];
      }
    });

    await client.save();

    return res.status(200).json(response(200, 'success', client, 'Client updated successfully'));
  } catch (err) {
    console.error('Error editing client:', err);
    res.status(500).json(response(500, 'error', null, 'Server error'));
  }
};

exports.deleteClient = async (req, res) => {
  try {
    const user = req.user;
    const clientId = req.params.clientId;

    // Check if the client exists and belongs to the current user
    const client = await Client.findOne({ _id: clientId, accountId: user.accountId });

    if (!client) {
      return res.status(404).json(response(404, 'error', null, 'Client not found or unauthorized.'));
    }

    //set client status to inactive
    client.status = 'inactive';
    await client.save();

    return res.status(200).json(response(200, 'success', null, 'Client deleted successfully'));
  } catch (err) {
    console.error('Error deleting client:', err);
    res.status(500).json(response(500, 'error', null, 'Server error'));
  }
}

exports.getClientInvoices = async (req, res) => {
  try {
    const user = req.user;
    const clientId = req.params.clientId;

    // Optional: validate client ownership
    const client = await Client.findOne({ _id: clientId, accountId: user.accountId, status: 'active' });
    if (!client) {
      return res.status(404).json(response(404, 'error', null, 'Client not found'));
    }

    // Fetch all invoices for this client and account
    const invoices = await Invoice.find({
      clientId: clientId,
      accountId: user.accountId
    }).sort({ issueDate: -1 });

    return res.status(200).json(response(200, 'success', invoices, 'Client invoices fetched successfully'));
  } catch (err) {
    console.error('Error fetching client invoices:', err);
    return res.status(500).json(response(500, 'error', null, 'Server error'));
  }
};
