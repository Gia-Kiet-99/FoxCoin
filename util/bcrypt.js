const bcrypt = require('bcrypt');

const salt = 10;

module.exports = {
  hashPassword(password) {
    return bcrypt.hash(password, salt);
  },

  verifyPassword(password, hashedPassword) {
    return bcrypt.compare(password, hashedPassword);
  }
}