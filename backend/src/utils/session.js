function serializeUser(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    phone: user.phone ?? null,
  };
}

function persistSessionUser(session, user) {
  session.user = user;
  session.userId = user.id;
  session.userRole = user.role;
}

module.exports = { serializeUser, persistSessionUser };
