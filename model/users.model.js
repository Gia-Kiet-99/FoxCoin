const db = require('../util/db');

module.exports = {
  all() {
    return db('user');
  },

  async single(publicKey) {
    const users = await db('user').where({address: publicKey});
    if(users.length === 0) {
      return null;
    }
    return users[0];
  },

  add(user) {
    return db('user').insert(user);
  }
}