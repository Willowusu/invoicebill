var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'ScribeBill' });
});

/* GET login page. */
router.get('/login', function (req, res, next) {
  res.render('login', { title: 'Login' });
});

/* GET register page. */
router.get('/register', function (req, res, next) {
  res.render('register', { title: 'Register' });
});

/* GET dashboard page. */
router.get('/dashboard', function (req, res, next) {
  res.render('dashboard', { title: 'Dashboard' });
});

/* GET clients page. */
router.get('/clients', function (req, res, next) {
  res.render('clients', { title: 'Clients' });
});

/* GET create client page. */
router.get('/clients/create', function (req, res, next) {
  res.render('createClient', { title: 'Create Client' });
});

/* GET transactions page. */
router.get('/clients/:id', function (req, res, next) {
  res.render('clientInfo', { title: 'Client  Information' });
});


/* GET invoices page. */
router.get('/invoices', function (req, res, next) {
  res.render('invoices', { title: 'Invoices' });
});

/* GET create invoice page. */
router.get('/invoices/create', function (req, res, next) {
  res.render('createInvoice', { title: 'Create Invoices' });
});

/* GET invoices page. */
router.get('/invoices/:id', function (req, res, next) {
  res.render('invoiceInfo', { title: 'Invoice Details' });
});

/* GET settings page. */
router.get('/settings', function (req, res, next) {
  res.render('settings', { title: 'Settings' });
});

/* GET public invoice page. */
router.get('/view-invoice', function (req, res, next) {
  res.render('view-invoice', { title: 'View Invoice' });
});
module.exports = router;
