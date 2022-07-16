const jwt = require("jsonwebtoken");
const APP_SECRET = process.env.APP_SECRET;

function getTokenPayload(token) {
  return jwt.verify(token, APP_SECRET);
}

function getUserId(req, authToken) {
  if (req) {
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      if (!token) {
        throw new Error("No token found");
      }
      const tokenData = getTokenPayload(token);
      return tokenData;
    }
  } else if (authToken) {
    const tokenData = getTokenPayload(authToken);
    return tokenData;
  }

  throw new Error("Not authenticated");
}

module.exports = {
  APP_SECRET,
  getUserId,
};
