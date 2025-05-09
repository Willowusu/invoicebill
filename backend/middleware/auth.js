const jwt = require('jsonwebtoken');
const { response } = require('../utils/response');

exports.authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json(response(401, 'error', null, 'Unauthorized'));
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json(response(403, 'error', null, 'Forbidden'));
    }
    req.user = user;
    next();
  });
}

exports.requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json(response(403, 'error', null, 'Admin access required'));
  }
  next();
};
