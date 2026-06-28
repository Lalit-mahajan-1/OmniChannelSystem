const jwt = require("jsonwebtoken");

const socketAuth = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return next(new Error("Authentication error: No token provided"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");
    
    // Attach user info to socket
    socket.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      employerId: decoded.employerId,
    };

    next();
  } catch (error) {
    next(new Error("Authentication error: Invalid token"));
  }
};

module.exports = socketAuth;
