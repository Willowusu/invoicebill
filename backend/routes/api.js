const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const clientController = require('../controllers/clientController');
const invoiceController = require('../controllers/invoiceController');
const dashboardController = require('../controllers/dashboardController');
const { authenticateToken } = require('../middleware/auth');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() }); // Use memory, not disk



router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.post('/auth/invite', authenticateToken, authController.inviteUser);
router.post('/auth/update-password', authenticateToken, authController.updatePassword);
router.post('/auth/update-user-profile', authenticateToken, authController.updateUserProfile);
router.put('/auth/update-account-details', authenticateToken, authController.updateAccountDetails);
router.put('/auth/update-account-invoice-settings', authenticateToken, authController.updateAccountInvoiceSettings);

router.post('/dashboard-stats', authenticateToken, dashboardController.getDashboardStats);

router.post('/clients', authenticateToken, clientController.createClient);
router.get('/clients', authenticateToken, clientController.getClients);
router.get('/clients/:clientId', authenticateToken, clientController.getClientById);
router.patch('/cliepasswordnts/:clientId', authenticateToken, clientController.updateClient);
router.delete('/clients/:clientId', authenticateToken, clientController.deleteClient);
router.get('/clients/:clientId/invoices', authenticateToken, clientController.getClientInvoices);


router.post('/invoices', authenticateToken, invoiceController.createInvoice);
router.get('/invoices', authenticateToken, invoiceController.getInvoices);
router.get('/invoices/:invoiceId', authenticateToken, invoiceController.getInvoiceById);
router.patch('/invoices/:invoiceId', authenticateToken, invoiceController.updateInvoice);
router.delete('/invoices/:invoiceId', authenticateToken, invoiceController.deleteInvoice);
router.post('/invoices/:invoiceId/mark-as-paid', authenticateToken, invoiceController.markAsPaid);
router.post('/invoices/:invoiceId/send', authenticateToken, invoiceController.sendInvoiceByEmail);
router.get('/invoices/public/view', invoiceController.publicViewInvoice);






module.exports = router;