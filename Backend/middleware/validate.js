// ──────────────────────────────────────────────
// Input validation middleware
// Lightweight validation without external deps
// ──────────────────────────────────────────────

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const objectIdRegex = /^[0-9a-fA-F]{24}$/;

// Validate that req.params.id is a valid MongoDB ObjectId
const validateObjectId = (paramName = 'id') => {
  return (req, res, next) => {
    const value = req.params[paramName];
    if (!value || !objectIdRegex.test(value)) {
      return res.status(400).json({
        success: false,
        message: `Invalid ${paramName} format. Must be a valid ObjectId.`,
      });
    }
    next();
  };
};

// Validate login body
const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];

  if (!email || typeof email !== 'string' || !emailRegex.test(email.trim())) {
    errors.push('Valid email is required');
  }
  if (!password || typeof password !== 'string' || password.length < 1) {
    errors.push('Password is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: errors.join('. '),
    });
  }

  // Sanitize
  req.body.email = email.trim().toLowerCase();
  next();
};

// Validate employer/customer creation body
const validateRegistration = (req, res, next) => {
  const { name, email, password } = req.body;
  const errors = [];

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    errors.push('Name must be at least 2 characters');
  }
  if (!email || typeof email !== 'string' || !emailRegex.test(email.trim())) {
    errors.push('Valid email is required');
  }
  if (!password || typeof password !== 'string' || password.length < 6) {
    errors.push('Password must be at least 6 characters');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: errors.join('. '),
    });
  }

  // Sanitize
  req.body.name = name.trim();
  req.body.email = email.trim().toLowerCase();
  next();
};

// Validate scrape body
const validateScrape = (req, res, next) => {
  const { keyword, platforms } = req.body;
  const errors = [];

  if (!keyword || typeof keyword !== 'string' || keyword.trim().length < 2) {
    errors.push('Keyword must be at least 2 characters');
  }

  if (platforms) {
    if (!Array.isArray(platforms)) {
      errors.push('Platforms must be an array');
    } else {
      const allowed = ['twitter', 'reddit'];
      const invalid = platforms.filter(p => !allowed.includes(p));
      if (invalid.length > 0) {
        errors.push(`Invalid platforms: ${invalid.join(', ')}. Allowed: ${allowed.join(', ')}`);
      }
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: errors.join('. '),
    });
  }

  req.body.keyword = keyword.trim();
  next();
};

// Validate send message body
const validateSendMessage = (req, res, next) => {
  const { message, employerId, customerId } = req.body;
  const errors = [];

  if (!message || typeof message !== 'string' || message.trim().length < 1) {
    errors.push('Message body is required');
  }

  if (employerId && !objectIdRegex.test(employerId)) {
    errors.push('Invalid employerId format');
  }

  if (customerId && !objectIdRegex.test(customerId)) {
    errors.push('Invalid customerId format');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: errors.join('. '),
    });
  }

  next();
};

module.exports = {
  validateObjectId,
  validateLogin,
  validateRegistration,
  validateScrape,
  validateSendMessage,
};
