const directives = require('./directives');

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


// for me
// match all operators
// [\+\-\*\%\=\&\|\~\^\<\>\?\:\!\/]+ / g

// for me
// match all variables
// [a-zA-Z_]+([a-zA-Z0-9_]*)

class parser {
  constructor(bladeRender) {
    this.html = '';
    this._bld = bladeRender;
    this.patterns = this.paternify_directives(directives);
    this.utils = {
      variables : /\$[a-zA-Z_]+([a-zA-Z0-9_]*)/g,
      operators: /[\+\-\*\%\=\&\|\~\^\<\>\?\:\!\/]+/g,
      helpers: /([a-z0-9]+)\((.*)\)(\t|\r|\s)*\W|\s([a-z0-9]+)\((.*)\)(\t|\r|\s)*\W/gi,
      defaultParams: /\'(.*?)\'|\"(.*?)\"/g
    }
  }
  paternify_directives(object) {
    let resultArr = new Array();
    for (var directive in object) {
      // console.log('directive', object[directive])

      var objGenerated = {
        name: directive,
        type: object[directive].type
        // regexp:
      }
      switch (object[directive].type) {
        case 'inline':
          objGenerated.Regex =  new RegExp("\@"+directive+"\\([\'\"](.*)[\'\"]\s*\,\s*[\'\"](.*)[\'\"]\\)|\@"+directive+"\\([\'\"](.*)[\'\"]\s*\\)", 'gi')
          break;
        case 'block':
          objGenerated.Regex = new RegExp("\@"+directive+"\\s*\\(\\s*(.*)\\s*\\)((?:(?!\@show|\@stop|\@end"+directive+").*\\s*)*)(\@show|\@stop|\@end"+directive+")", 'gi')
          break;
       case 'both':
         objGenerated.Regex = new Object();
         objGenerated.Regex.inline = new RegExp("\@"+directive+"\\([\'\"](.*)[\'\"]\s*\,\s*[\'\"](.*)[\'\"]\\)|\@"+directive+"\\([\'\"](.*)[\'\"]\s*\\)", 'gi')
         objGenerated.Regex.block = new RegExp("\@"+directive+"\\(\\s*[\'\"](.*)[\'\"]\\s*\\)((?:(?!\@show|\@stop|\@end"+directive+").*\\s*)*)(\@show|\@stop|\@end"+directive+")", 'gi')


         break;
        default:

      }
      resultArr.push(objGenerated);
    }
    return resultArr;
  }
  normalizerBothDirective(str, directive_name) {

    var value_to_return = new Array();

    var re = new RegExp("(@"+directive_name+")(?: |)([^]+?)(?: |)\@end"+directive_name+"", 'g')
    var re2 = new RegExp("\@"+directive_name+"\\([\'\"](.*)[\'\"]\s*\,\s*[\'\"](.*)[\'\"]\\)|\@"+directive_name+"\\([\'\"](.*)[\'\"]\s*\\)", 'gi')

    var blockDir_test = str.match(re)
    var inlineDir_test = str.match(re2)
    var excludes_blocks = new Array();

    inlineDir_test.forEach((inline) => {
      var pars = this.getParams(inline)
      if(pars.length < 2) {
        excludes_blocks.push(inline)
        let idx = inlineDir_test.indexOf(inline);
        inlineDir_test.splice(idx, 1)
      }
    })

    blockDir_test.forEach( (block, i) => {
      value_to_return.push(block.replace(inlineDir_test[i], '').trim())
    })

    value_to_return = value_to_return.concat(inlineDir_test);

    // console.log('after treatment value_to_return', value_to_return)
    // console.log('after treatment exclude', excludes_blocks)

    return value_to_return;
  }
  getContents(entry, pattern) {
    let rtn = '';
    var params = this.getParams(entry);
    if(params.length === 2) {
      rtn = params[1]
    }
    else {
      let re = new RegExp(/(.*)/, 'g');
      var contents = entry.match(re);
      contents.forEach((content) => {
        if(content.includes("@"+pattern) == false && content.includes("@end"+pattern) == false) {
          rtn += content;
        }
      })
    }
    return rtn
  }
  getParams(entry) {
    return this._parseParams(entry);
  }
  _parseParams(entry) {
    let rtn;
    var re = /(\(([^()]*)\))/g
    var string_to_test = entry.match(re)[0]
    rtn = {
      vars : this._hasVariables(string_to_test).vars,
      helpers: this._hasHelperCall(string_to_test).helpers,
      operators: this._hasOperators(string_to_test).operators,
      defaultParams: this._getBasicParameters(string_to_test).params,
      currentStr: string_to_test
    }

    return rtn;
  }
  _renderVars(vars) {
    let tst = vars;
    let rtn;
    if(vars && vars instanceof Array) {
      rtn = new Array();
      vars.forEach((variable) => {
        rtn.push(this._bld.variables[variable.substr(1)])
      })
    }
    else {
      rtn = this._bld.variables[vars.substr(1)]
    }

    return rtn;

  }
  _Interpolate(entry) {
    // for rendering block contents
    // {{}}
    // {!!!!}
  }
  _hasVariables(entry) {
    let bool = false;
    let arr = entry.match(this.utils.variables)
    if(arr != null) {
      bool = true;
    }
    return {response : bool, vars : arr , currentStr : entry}
  }
  _hasHelperCall(entry) {
    let bool = false;
    let arr = entry.match(this.utils.helpers)
    if(arr != null) {
      bool = true;
    }
    return {response : bool, helpers : arr, currentStr : entry}
  }
  _getBasicParameters(entry) {
    let bool = false;
    let arr = entry.match(this.utils.defaultParams)
    if(arr != null) {
      bool = true;
    }
    return {response : bool, params : arr, currentStr : entry}
  }
  _hasOperators(entry) {
    let bool = false;
    let arr = entry.match(this.utils.operators)
    if(arr != null) {
      bool = true;
    }
    return {response : bool, operators : arr}
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
  _initCompilationProcess(str) {
    this.patterns.forEach((pattern) => {

      var val;
      // console.log('typeof pattern.Regex', typeof pattern.Regex)

      if(pattern.Regex.inline && pattern.Regex.block) {
        console.log('you must compare')
        // console.log('pattern.name', pattern.name)
        var str2 = pattern.Regex.block.exec(str)
        if(str2 != null) {
          val = this.normalizerBothDirective(str2.input, pattern.name)
        }
      }
      else {
        if(str.match(pattern.Regex) != null) {
          // console.log('pattern.name '+pattern.name, pattern.name)
          val = str.match(pattern.Regex)
        }
      }
      if(val != null) {
        directives[pattern.name].render(val, this)
      }
    })
  }
  precompile(str, func) {

    // console.log('str html', str)
    this._initCompilationProcess(str)

    if(func && typeof func === 'function') {
      func(this.builder('html'));
    }
  }
  compile(str, func) {

    this._initCompilationProcess(str)
    if(func && typeof func === 'function') {
      func();
    }
  }
}

module.exports = parser;
