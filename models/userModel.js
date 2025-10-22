// Simulação simples de um modelo de usuário em memória
let users = [];
let nextId = 1;

function addUser(user) {
  // user deve conter: username, email, passwordHash
  const entry = {
    id: nextId++,
    username: user.username,
    email: user.email,
    passwordHash: user.passwordHash,
    createdAt: new Date().toISOString(),
  };
  users.push(entry);
  return entry;
}

function findByUsername(username) {
  return users.find((u) => u.username === username) || null;
}

function _resetForTests() {
  users = [];
  nextId = 1;
}

function listAll() {
  return users.map((u) => ({ id: u.id, username: u.username, email: u.email }));
}

module.exports = { addUser, findByUsername, _resetForTests, listAll };
