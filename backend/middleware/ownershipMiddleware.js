import AppError from "../utils/appError.js";

const checkOwnership = (getOwnerId) => {
  return (req, res, next) => {
    const ownerId = getOwnerId(req);

    if (!ownerId) {
      return next(new AppError("Owner information could not be determined.", 500));
    }

    if (req.user.role === "admin") {
      return next();
    }

    if (req.user._id.toString() !== ownerId.toString()) {
      return next(
        new AppError("You do not have permission to perform this action.", 403)
      );
    }
    next();
  };
};

export default checkOwnership;