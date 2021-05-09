const db = require('../../util/db');

module.exports = {
  async checkEmailExists(email) {
    try {
      const user = await db('user').where({ email: email });
      if (user.length > 0) {
        return true;
      }
    } catch (error) {
      console.log(error);
    }
    return false;
  }
}