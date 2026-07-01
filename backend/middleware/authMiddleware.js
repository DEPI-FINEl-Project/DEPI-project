const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  let token;

  // Check if token exists
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Get token
      token = req.headers.authorization.split(" ")[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log(decoded);

      // Get user without password
      req.user = await User.findById(decoded.id).select("-password");
      console.log(req.user);

      next();

    } catch (error) {
  console.log(error);

  return res.status(401).json({
    message: error.message,
  });
}
  }

  if (!token) {
    return res.status(401).json({
      message: "No token provided",
    });
  }
};

module.exports = { protect };