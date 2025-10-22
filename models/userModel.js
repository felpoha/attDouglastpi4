const { v4: uuidv4 } = require("uuid");

// Simulação simples em memória
const users = [];

function addUser(user) {
  const id = uuidv4();
  const record = {
    id,
    username: user.username,
    email: user.email,
    passwordHash: user.passwordHash,
  };
  users.push(record);
  return record;
}

function findByUsername(username) {
  return users.find((u) => u.username === username) || null;
}

module.exports = {
  addUser,
  findByUsername,
  // export for tests/debug
  _internal: { users },
};
