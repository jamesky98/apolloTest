import jwt from "jsonwebtoken";
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
  console.log(userId);
  const now = new Date();
  if (!userId) {
    // hrow new Error("未登入!!");
    console.log("未登入!!");
    return false;  
  } else if (now.getTime() > userId.expiry) {
    // throw new Error("驗證過期!!");
    console.log("驗證過期!!");
    return false;  
  }else if(userId.userAc===0) {
    // throw new Error("帳號尚未啟用!!");
    console.log("帳號尚未啟用!!");
    return false;  
  }
  return true;
}

export {
  APP_SECRET,
  getUserId,
  chkUserId,
};
