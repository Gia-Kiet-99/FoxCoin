const fs = require('fs');

module.exports = {
  readJSON(path) {
    try {
      const jsonString = fs.readFileSync(path, 'utf-8');
      return jsonString;
    } catch (error) {
      console.log(error);
    }
    return null;
  },

  writeJSON(path, jsonString) {
    try {
      fs.writeFileSync(path, jsonString);
    } catch (error) {
      console.log(error);
    }
  }
}