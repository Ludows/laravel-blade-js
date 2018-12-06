const directives = require('./directives');
const operatorsManager = require('./operators');

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
    this.operators = operatorsManager;
    this.temp = [];
    this.utils = {
      variables : /\$[a-zA-Z_]+([a-zA-Z0-9_]*)/g,
      operators: /[\+\-\*\%\=\&\|\~\^\<\>\?\:\!\/]+/g,
      helpers: /([a-z0-9]+)\((.*)\)(\t|\r|\s)*\W|\s([a-z0-9]+)\((.*)\)(\t|\r|\s)*\W/gi,
      defaultParams: /\'(.*?)\'|\"(.*?)\"/g,
      escapedBlocks : /({{)(?: |)([^]+?)(?: |)}}/g,
      unescapedBlocks : /({!!)(?: |)([^]+?)(?: |)!!}/g,
      directives: /(@\w+)(?: |)([^]+?)(?: |)\@end\w+/g

    }
  }
  getTemp(name) {
    let rtn;
    // console.log('name temp', name)
    for (let i = 0; i < this.temp.length; i++) {
      if(name && name === this.temp[i].name) {
        rtn = this.temp[i];
        break;
      }
    }
    return rtn;
  }
  _sendToTemp(obj) {
    return this.temp.push(obj)
  }
  getVars() {
    return this._bld.variables;
  }
  evaluate(operator, val1, val2) {
    return this.operators[operator](val1, val2);
  }
  paternify_directives(object) {
    let resultArr = new Array();
    for (var directive in object) {

      var objGenerated = {
        name: directive,
        type: object[directive].type
        // regexp:
      }
      switch (object[directive].type) {
        case 'inline':
          objGenerated.Regex =  new RegExp("\@"+directive+"\\([\'\"](.*)[\'\"]\s*\,\s*[\'\"](.*)[\'\"]\\)|\@"+directive+"\\([\'\"](.*)[\'\"]\s*\\)|\@"+directive+"\\((\s*|.*)\\)", 'gi')
          break;
        case 'block':
          objGenerated.Regex = new RegExp("\@"+directive+"(?: |)([^]+?)(?: |)\@end"+directive, 'gi')
          break;
       case 'both':
         objGenerated.Regex = new Object();
         objGenerated.Regex.inline = new RegExp("\@"+directive+"\\([\'\"](.*)[\'\"]\s*\,\s*[\'\"](.*)[\'\"]\\)|\@"+directive+"\\([\'\"](.*)[\'\"]\s*\\)", 'gi')
         objGenerated.Regex.block = new RegExp("\@"+directive+"\\s*\\(\\s*(.*)\\s*\\)((?:(?!\@show|\@stop|\@end"+directive+").*\\s*)*)(\@show|\@stop|\@end"+directive+")", 'gi')


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
      if(pars.defaultParams.length < 2) {
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
      var contents = entry.split(re);
      // console.log('contents', contents)
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
    // console.log('entry point parse params', entry)
    let rtn;
    var re = /(\(([^()]*)\))|(\{\{([^]*)\}\})|(\{\!\!([^]*)\!\!\})/g
    var string_to_test = entry.match(re)[0]
    // console.log('_parseParams matching', string_to_test)
    rtn = {
      vars : this._hasVariables(string_to_test).vars,
      helpers: this._hasHelperCall(string_to_test).helpers,
      blocks: string_to_test.includes('{') ? "escaped" : "unescaped",
      directives: this._hasDirectives(string_to_test).vars,
      operators: this._hasOperators(string_to_test).operators,
      defaultParams: this._getBasicParameters(string_to_test).params,
      currentStr: string_to_test
    }

    return rtn;
  }
  renderBlocks() {
    var html = this.builder('html');
    let escapedBlocksList = html.match(this.utils.escapedBlocks)
    let unescapedBlocksList = html.match(this.utils.unescapedBlocks)
    if(escapedBlocksList != null) {
      escapedBlocksList.forEach((escaped) => {
        let params = this.getParams(escaped)
        this._globalRender(params)
      })
    }
    if(unescapedBlocksList != null) {
      unescapedBlocksList.forEach((unescaped) => {
        let params = this.getParams(unescaped)
        this._globalRender(params)
      })
    }
  }
  _globalRender(parameters) {
    /// On va faire dans mon cas présent et ensuite on poussera dans le vice ultime ahaha !
    let compiled_data;
    // console.log('parameters for rendering blocks', parameters)
    if(parameters.vars.length > 0) {
      compiled_data = this._renderVars(parameters.vars)
    }
    // a faire pour les autres types operateurs blabla et bla
    this.builder('replace', {block: parameters.currentStr, to: compiled_data})

  }
  _renderVars(vars) {
    let rtn;
    if(vars && vars instanceof Array) {
      rtn = new Array();
      vars.forEach((variable) => {
        if(this._bld.variables[variable.substr(1)] != undefined) {
          rtn.push(this._bld.variables[variable.substr(1)])
        }
        else {
          this.handleError()
        }
      })
    }
    else {
      if(this._bld.variables[vars.substr(1)] != undefined) {
        rtn = this._bld.variables[vars.substr(1)]
      }
      else {
        this.handleError()
      }
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
  _hasDirectives(entry) {
    let bool = false;
    let arr = entry.match(this.utils.directives)
    if(arr != null) {
      bool = true;
    }
    return {response : bool, vars : arr , currentStr : entry}
  }
  hasDirective(name, str) {
    // console.log('name', name)
    // console.log('str', str)
    let vl;
    let content;
    let dtves = this.patterns;

    if(str && typeof str === 'string') {
      content = str
    }
    else {
      content = this.html
    }

    for (var i = 0; i < dtves.length; i++) {
      if(dtves[i].name === name && dtves[i].type != 'both') {
        vl = content.match(dtves[i].Regex)
        break;
      }
      else if(dtves[i].name === name && dtves[i].type === 'both') {
        vl = content.match(dtves[i].Regex.block)
        break;
      }
    }

    return vl;
  }
  hasVar(name, str) {
    // console.log('name', name)
    // console.log('str', str)
    let vl;
    let content;
    let dtves = this.patterns;

    if(str && typeof str === 'string') {
      content = str
    }
    else {
      content = this.html
    }

    var re = new RegExp("({{)(?: |)(\\$"+ name +")(?: |)}}|({!!)(?: |)(\\$"+ name +")(?: |)!!}", 'g');
    // console.log('content hasvar regex', content)

    vl = content.match(re)[0]


    return vl;
  }
  _hasBlocks(entry) {
    let bool = false;
    let arr = entry.match(this.utils.unescapedBlocks)
    let arr2 = entry.match(this.utils.escapedBlocks)
    if(arr != null || arr2 != null) {
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
    if(entry.includes('[') && entry.includes(']')) {
      // cela ne peut pas être un opérateur, ici nous rentrons dans le cas d'un array
      arr = null;
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
      // console.log('before find', this.html)
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

      if(pattern.Regex.inline && pattern.Regex.block) {

        if(pattern.Regex.block.test(str) === true) {
          var str2 =str.match(pattern.Regex.block)
          // console.log('str2', str2)
          val = this.normalizerBothDirective(str2.toString(), pattern.name)
        }
      }
      else {
        if(str.match(pattern.Regex) != null) {
          // console.log('pattern.name '+pattern.name, pattern.name)
          val = str.match(pattern.Regex)
        }
      }
      if(val != null) {
        console.log('pattern render called '+ pattern.name)
        directives[pattern.name].render(val, this)
      }
    })
    this.renderBlocks();
  }
  moreCompilationIsNeeded(str) {
    let rtn = false;
    let directives = this._hasDirectives(str)
    let blocks = this._hasBlocks(str)

    // console.log('as directives ?', directives)
    if(blocks.response != null || directives.response != null) {
      rtn = true;
    }
    return { response: rtn, taille: directives.vars.length + 1};
  }
  compile(str, func) {

    this._initCompilationProcess(str)

    var precompiled = this.builder('html')
    let moreCompilation = this.moreCompilationIsNeeded(precompiled)
    console.log('moreCompilation', moreCompilation)
    if(moreCompilation.response === true) {
      for (let i = 0; i < moreCompilation.taille; i++) {
        let forCompile = this.builder('html')
        this._initCompilationProcess(forCompile)
		  }
    }
    if(func && typeof func === 'function') {
      func(this.builder('html'));
    }
  }

}

module.exports = parser;
