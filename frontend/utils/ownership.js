export const normalizeId = (value) => {
  if (!value) return "";
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "object" && value._id) {
    return value._id.toString().trim();
  }
  return String(value);
};

export const isOwner = (currentUserId, ownerId) => {
  return normalizeId(currentUserId) === normalizeId(ownerId);
};