import jwt from "jsonwebtoken";
import User from "../models/userModel.js";
import AppError from "../utils/appError.js";
import catchAsync from "../utils/catchAsync.js";

const getTokenFromRequest = (req) => {
  if (req.headers.authorization?.startsWith("Bearer ")) {
    return req.headers.authorization.split(" ")[1];
  }

  if (req.cookies?.token) {
    return req.cookies.token;
  }

  return null;
};

const protect = catchAsync(async (req, res, next) => {
  const token = getTokenFromRequest(req);

  if (!token) {
    return next(new AppError("You are not logged in. Please provide a token.", 401));
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(new AppError("The user belonging to this token no longer exists.", 401));
  }

  req.user = currentUser;
  next();
});

const optionalProtect = catchAsync(async (req, res, next) => {
  const token = getTokenFromRequest(req);

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const currentUser = await User.findById(decoded.id);

    if (currentUser) {
      req.user = currentUser;
    }
  } catch {
    req.user = undefined;
  }

  next();
});

const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user?.role || !roles.includes(req.user.role)) {
      return next(new AppError("You do not have permission to perform this action.", 403));
    }
    next();
  };
};

export { protect, optionalProtect, restrictTo };
