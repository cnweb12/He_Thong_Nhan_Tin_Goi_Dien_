function normalizePhone(phone) {
  return String(phone || "").replace(/[^\d+]/g, "").trim();
}

function normalizeUsername(username) {
  return String(username || "").trim().toLowerCase();
}

function normalizeDirectKey(userIdA, userIdB) {
  return [String(userIdA), String(userIdB)].sort().join(":");
}

module.exports = {
  normalizePhone,
  normalizeUsername,
  normalizeDirectKey,
};
