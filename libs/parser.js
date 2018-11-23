const directives = require('./directives');

class parser {
  constructor() {
    this.html = '';
    this.pattern = {
      block_with_escaping: new RegExp('({{)(?: |)([^]+?)(?: |)}}', 'g'),
      block_without_escaping: new RegExp('({!!)(?: |)([^]+?)(?: |)!!}', 'g'),
      inline_directive: new RegExp('\/?(@\w+)(?:|)\(([^]+?)\)', 'gm'),
      global_directive: new RegExp('(@\w+)(?: |)([^]+?)(?: |)\@end\w+', 'g'),
    }
    this.compilePattern = [this.pattern.inline_directive, this.pattern.global_directive, this.pattern.block_with_escaping, this.pattern.block_without_escaping]
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

    // for me
    // block escaping regex
    // ({{)(?: |)([^]+?)(?: |)}}

    // for me
    // block unescaping regex
    // ({!!)(?: |)([^]+?)(?: |)!!}

    // for me
    // match inline directive
    // \/?(@\w+)(?:|)\(([^]+?)\) /gm

    // for me
    // match directive like @block @endblock
    // (@\w+)(?: |)([^]+?)(?: |)\@end\w+/g

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
  normalizeParams(entry) {
    if(typeof entry === 'array') {
      entry.forEach((param) => {
        return param.replace('.', '/').replace("'", '').replace("'", '')
      })
    }
    else {
      return entry.replace('.', '/').replace("'", '').replace("'", '')
    }
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
      the_return[i]._bld._execPathParam = code._bldConfig._typeof === "autoclose" && this.getParams(code.value).length > 1  ?  this.normalizeParams(this.getParams(code.value)[1]) : null
      the_return[i]._bld._codeToExec = code._bldConfig._typeof === "asblock" && this.getParams(code.value).length <= 1  ?  code.value.match(/\w+\s+|<\s*\w+[^>]*>(.*?)<\s*\/\s*\w+>/g).join(' ') : null

      // console.log('code', code.value.match(/\w+\s+|<\s*\w+[^>]*>(.*?)<\s*\/\s*\w+>/g))
    })

    if(callback && typeof callback === 'function') {
      callback(the_return);
    }
  }
  builder(cmd, code) {
    switch (cmd) {
      case 'append':
        this.html += code
        break;
      case 'replace':
        this.html = this.html.replace(code.block, code.to);
        break;
      case 'find':
        var re = new RegExp(code, 'g');
        // console.log(re)
        return this.html.match(re);
        break;
      case 'html':
        return this.html;
        break;
      default:

        break;
    }
  }
  handleError() {
   console.log('has error to compile');
  }
  precompile(arr, func) {
    this.parse(arr, (arrObj) => {
      // console.log('codearr', arr)

      // INIT FIRST COMPILATION
      arrObj.forEach((comp) => {
        if(directives[comp.name] != undefined) {
          directives[comp.name](comp, this);

        }
        else {
          this.handleError();
        }
      })
      this.identify(this.html);

    })
    if(func && typeof func === 'function') {
      func(this.builder('html'));
    }
  }
  identify(string) {
    // console.log('string called', string)

    // FIRST MATCH INLINE DIRECTIVE (LE plus chiant d'abord)
    // SECOND MATCH global DIRECTIVE
    // THREE MATCH BLOCK

    // console.log('condition statement', string.match(/(@\w+)(?: |)([^]+?)(?: |)\@end\w+/g))
    // console.log('condition statement length', string.match(/(@\w+)(?: |)([^]+?)(?: |)\@end\w+/g).length)
    // console.log('condition statement search index', string.search(/\@\if/g))
  }
  compile(string, func) {
    console.log('string called', string)

    // FIRST MATCH INLINE DIRECTIVE (LE plus chiant d'abord)
    // SECOND MATCH global DIRECTIVE
    // THREE MATCH BLOCK
    this.compilePattern.forEach((pattern) => {
      var arrMatches = string.match(pattern)
      if(arrMatches && arrMatches.length > 0) {
        arrMatches.forEach((matche) => {

        })
      }
    })

    // this.parse(ar, (arrObj) => {
    //   console.log('arrObj', arrObj)
    //
    //   // INIT FIRST COMPILATION
    //   arrObj.forEach((comp) => {
    //     if(directives[comp.name] != undefined) {
    //       directives[comp.name](comp, this);
    //     }
    //     else {
    //       this.handleError();
    //     }
    //   })
    //   this.identify(this.html);
    //
    // })
    if(func && typeof func === 'function') {
      func();
    }
  }
}

module.exports = parser;
