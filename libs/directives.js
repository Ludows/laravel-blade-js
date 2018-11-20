let fs = require('fs');
var directives = {
  extends : (obj) => {
    console.log('extends start', obj)
  }
}

module.exports = directives;
