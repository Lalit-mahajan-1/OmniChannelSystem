const jwt = require('jsonwebtoken');
const Employer = require('../models/Employer');
const Customer = require('../models/Customer');

// ──────────────────────────────────────────────
// authenticate — Verify JWT and attach req.user
// ──────────────────────────────────────────────
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Token is missing.',
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch user based on role
    let user;
    if (decoded.role === 'employer') {
      user = await Employer.findOne({ _id: decoded.id, isActive: true });
    } else if (decoded.role === 'customer') {
      user = await Customer.findOne({ _id: decoded.id, isActive: true });
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token is valid but user no longer exists or is deactivated.',
      });
    }

    // Attach user and role to request
    req.user = user;
    req.userId = decoded.id;
    req.userRole = decoded.role;

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired. Please log in again.',
      });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.',
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Authentication error.',
    });
  }
};

// ──────────────────────────────────────────────
// authorize — Role-based access control
// Usage: authorize('employer')  or  authorize('employer', 'customer')
// ──────────────────────────────────────────────
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.userRole) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required before authorization.',
      });
    }

    if (!allowedRoles.includes(req.userRole)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${allowedRoles.join(' or ')}. Your role: ${req.userRole}.`,
      });
    }

    next();
  };
};

// ──────────────────────────────────────────────
// optionalAuth — Attach user if token present, but don't block
// Useful for routes that behave differently for logged-in users
// ──────────────────────────────────────────────
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return next();

    const token = authHeader.split(' ')[1];
    if (!token) return next();

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    let user;
    if (decoded.role === 'employer') {
      user = await Employer.findOne({ _id: decoded.id, isActive: true });
    } else if (decoded.role === 'customer') {
      user = await Customer.findOne({ _id: decoded.id, isActive: true });
    }

    if (user) {
      req.user = user;
      req.userId = decoded.id;
      req.userRole = decoded.role;
    }
  } catch (_) {
    // Token invalid — continue without user
  }

  next();
};

// ──────────────────────────────────────────────
// serviceAuth — Authenticate internal agent services
// Agents pass X-Service-Key header with AGENT_SERVICE_KEY
// This creates a synthetic employer session so existing
// controller logic works without changes.
// ──────────────────────────────────────────────
const serviceAuth = async (req, res, next) => {
  const serviceKey = req.headers['x-service-key'];
  const expectedKey = process.env.AGENT_SERVICE_KEY;

  if (!serviceKey || !expectedKey || serviceKey !== expectedKey) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or missing service key.',
    });
  }

  const employerId = req.headers['x-employer-id'] || process.env.EMPLOYER_MONGO_ID;
  if (!employerId) {
    return res.status(400).json({
      success: false,
      message: 'Employer ID not provided.',
    });
  }

  const employer = await Employer.findOne({ _id: employerId, isActive: true });
  if (!employer) {
    return res.status(404).json({
      success: false,
      message: 'Employer not found.',
    });
  }

  req.user = employer;
  req.userId = employer._id.toString();
  req.userRole = 'employer';
  next();
};

// ──────────────────────────────────────────────
// authenticateOrService — Accept either JWT or service key
// Use on routes that both the frontend and agents call.
// ──────────────────────────────────────────────
const authenticateOrService = async (req, res, next) => {
  if (req.headers['x-service-key']) {
    return serviceAuth(req, res, next);
  }
  return authenticate(req, res, next);
};

module.exports = { authenticate, authorize, optionalAuth, serviceAuth, authenticateOrService };
