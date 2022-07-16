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

function chkUserId(context) {
  const { userId } = context;
  const now = new Date();
  if (!userId) {
    throw new Error("未登入!!");
  } else if (now.getTime() > userId.expiry) {
    throw new Error("驗證過期!!");
  }
  return true;
}

module.exports = {
  APP_SECRET,
  getUserId,
  chkUserId,
};
