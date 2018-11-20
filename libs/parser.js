
class parser {
  constructor() {

  }
  which_name(entry) {
    var base_name = '';
    for (var i = 0; i < entry.length; i++) {
      if(entry[i] != "@" && entry[i] != "(") {
        base_name += entry[i]
      }
      if(entry[i] === "(") {
        break;
      }
    }
    return base_name;
  }
  what_type(entry) {
    var type = undefined;

    var typed_data = ['@', '{{', '{!!', '()', 'No Match']
    var types = ['directive', 'block with escape', 'block without escape', 'function', 'Oooops']

    for (var i = 0; i < types.length; i++) {
      if(entry.includes(typed_data[i])) {
        type = types[i];
        break;
      }
    }

    // Prévoir pour le typage de variable
    return type;
  }
  getParams(entry) {
    var par_regex = /\'.*?\'/g;
    var params = entry.match(par_regex);

    return params;
  }
  parse(array, callback) {
    var the_return = new Array();

    array.forEach((code, i) => {
      the_return[i] = new Object();
      the_return[i].name = this.which_name(code.value)
      the_return[i].type = this.what_type(code.value)
      the_return[i].params = this.getParams(code.value)
      the_return[i].content = code.value
      the_return[i]._bld = code._bldConfig
    })

    if(callback && typeof callback === 'function') {
      callback(the_return);
    }
  }
  builder(cmd, code) {
    let txt = '';
    switch (cmd) {
      case 'append':
        txt += code
        break;
      case 'replace':
        // txt += code
        break;
      default:
        return txt;
        break;
    }
  }
  compile(ar, func) {

    if(func && typeof func === 'function') {
      func();
    }
  }
}

module.exports = parser;
