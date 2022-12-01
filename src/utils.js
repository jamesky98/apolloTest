import jwt from "jsonwebtoken";

const APP_SECRET = process.env.APP_SECRET;

function getTokenPayload(token) {
  // console.log(APP_SECRET);
  return jwt.verify(token, APP_SECRET);
}

function getUserId(req, authToken) {
  if (req) {
    // console.log(req);
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
  // console.log(userId);
  const now = new Date();
  if (!userId) {
    console.log("未登入!!");
    throw new Error("No token found");
    return false;  
  } else if (now.getTime() > userId.expiry) {
    console.log("驗證過期!!");
    throw new Error("Token expired");
    return false;  
  }else if(userId.userAc===0) {
    console.log("帳號尚未啟用!!");
    throw new Error("Not active");
    return false;  
  }
  return true;
}

export {
  APP_SECRET,
  getUserId,
  chkUserId,
};
