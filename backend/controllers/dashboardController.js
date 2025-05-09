const Invoice = require('../models/Invoice');
const Client = require('../models/Client');
const Payment = require('../models/Payment');
const mongoose = require('mongoose');
const { response } = require('../utils/response');

exports.getDashboardStats = async (req, res) => {
  try {
    const accountId = req.user.accountId;

    // Total invoices
    const totalInvoices = await Invoice.countDocuments({ accountId });

    // Total revenue from paid invoices
    const totalRevenue = await Invoice.aggregate([
      { $match: { accountId: new mongoose.Types.ObjectId(accountId), status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    // Pending payments (unpaid invoices)
    const pendingPayments = await Invoice.countDocuments({ accountId, status: 'sent' });

    // Draft invoices
    const draftInvoices = await Invoice.countDocuments({ accountId, status: 'draft' });

    // Overdue invoices (dueDate < today && not paid)
    const overdueInvoices = await Invoice.countDocuments({
      accountId,
      status: { $in: ['sent', 'overdue'] },
      dueDate: { $lt: new Date() }
    });

    // Total clients
    const totalClients = await Client.countDocuments({ accountId, status: 'active' });

    // Last 5 invoices
    const recentInvoices = await Invoice.find({ accountId }).populate('clientId')
      .sort({ createdAt: -1 })
      .limit(5);

    // Top 5 clients by revenue
    const topClients = await Invoice.aggregate([
      { $match: { accountId: new mongoose.Types.ObjectId(accountId), status: 'paid' } },
      {
        $group: {
          _id: '$clientId',
          totalRevenue: { $sum: '$totalAmount' }
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'clients',
          localField: '_id',
          foreignField: '_id',
          as: 'client'
        }
      },
      { $unwind: '$client' },
      {
        $project: {
          _id: 0,
          clientId: '$client._id',
          name: '$client.name',
          email: '$client.email',
          totalRevenue: 1
        }
      }
    ]);

    return res.status(200).json(response(200, 'success', {
      summary: {
        totalInvoices,
        totalRevenue: totalRevenue[0]?.total || 0,
        pendingPayments,
        draftInvoices,
        overdueInvoices,
        totalClients
      },
      recentInvoices,
      topClients
    }, 'Dashboard data fetched successfully'));
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json(response(500, 'error', null, 'Failed to fetch dashboard stats'));
  }
};


exports.getDashboardCharts = async (req, res) => {
  try {
    const accountId = req.user.accountId;

    const monthsAgo = new Date();
    monthsAgo.setMonth(monthsAgo.getMonth() - 4);
    monthsAgo.setDate(1); // Start from 1st of the month

    // Revenue per month (last 5 months)
    const monthlyRevenue = await Invoice.aggregate([
      {
        $match: {
          accountId: new mongoose.Types.ObjectId(accountId),
          status: 'paid',
          paidAt: { $gte: monthsAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$paidAt' } },
          revenue: { $sum: '$totalAmount' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Pie chart data: invoice count by status
    const statusBreakdown = await Invoice.aggregate([
      {
        $match: {
          accountId: new mongoose.Types.ObjectId(accountId)
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    return res.status(200).json(response(200, 'success', {
      revenueChart: monthlyRevenue,
      invoiceStatusChart: statusBreakdown
    }, 'Chart data fetched successfully'));
  } catch (err) {
    console.error('Chart error:', err);
    res.status(500).json(response(500, 'error', null, 'Failed to fetch chart data'));
  }
};
