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
      stringParameters: /\'(.*?)\'|\"(.*?)\"/g,
      escapedBlocks : /({{)(?: |)([^]+?)(?: |)}}/g,
      unescapedBlocks : /({!!)(?: |)([^]+?)(?: |)!!}/g,
      directives: /(@\w+)(?: |)([^]+?)(?: |)\@end\w+/g,
      array: /\[(.*?)\]/g

    }
  }
  /**
   * getTemp - description
   *
   * @param  {string} name le nom de la directive à retrouver dans la variable temporaire de compilation.
   * @return {object}  Retourne le pattern a utiliser pour matcher une chaine de caractère
   */
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

  /**
   * _sendToTemp - Envoie un objet concernant une directive à envoyer dans la variable temporaire.
   *
   * @param  {object} obj l'objet à envoyer
   * @return {object}     l'objet envoyé
   */
  _sendToTemp(obj) {
    return this.temp.push(obj)
  }

  /**
   * getVars - Retournes les variables attachée à l'instance de la classe Renderer
   *
   * @return {object}
   */
  getVars() {
    return this._bld.variables;
  }

  /**
   * evaluate - Renvoie le résultat entre deux valeurs. utilisée pour tester les conditions des blocks
   *
   * @param  {string} operator va matcher l'operateur à utiliser pour traiter l'évaluation entre les deux valeurs envoyée.
   * @param  {string} val1
   * @param  {string} val2
   * @return {boolean}
   */
  evaluate(operator, val1, val2) {
    return this.operators[operator](val1, val2);
  }

  /**
   * paternify_directives - Génères à la volée les Regex pour matcher les différentes directives dans le contenu.
   *
   * @param  {object} object l'objet Directive présent en haut de ce fichier.
   * @return {array}        retourne un Array contenant une liste d'objet avec le type, le nom de la directive , et le pattern Regex à utiliser.
   */
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

  /**
   * normalizerBothDirective - Cette fonction sert gérer le cas suivant l'exemple ci dessous :
   *
   * exemple : @section('title', 'test') or @section('title') title @endsection
   *
   * @param  {string} str            la chaine de caractère à évaluer
   * @param  {string} directive_name le nom de la directive à matcher suivants les deux cas
   * @return {array}                Retourne un array de directives prêtes pour le renderer
   */
  normalizerBothDirective(str, directive_name) {

    var value_to_return = new Array();

    var re = new RegExp("(@"+directive_name+")(?: |)([^]+?)(?: |)\@end"+directive_name+"", 'g')
    var re2 = new RegExp("\@"+directive_name+"\\([\'\"](.*)[\'\"]\s*\,\s*[\'\"](.*)[\'\"]\\)|\@"+directive_name+"\\([\'\"](.*)[\'\"]\s*\\)", 'gi')

    var blockDir_test = str.match(re)
    var inlineDir_test = str.match(re2)
    var excludes_blocks = new Array();

    inlineDir_test.forEach((inline) => {
      var pars = this.getParams(inline)
      if(pars.stringParameters.length < 2) {
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

  /**
   * getContents - Retourne le contenu entre les balises des sections ou le second paramètres selon le cas ci dessous :
   *
   * exemple : @section('title',  contenu ===> 'test') or @section('title') contenu ===> title <=== contenu  @endsection
   *
   * @param  {string} entry   chaine de cractère à tester
   * @param  {string} pattern le Pattern à checker
   * @return {string}         Le contenu intégral entre les balises de directives propres à Blade.
   *
   * @todo => faire une autoreconnaissance du pattern à utiliser !
   */
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
  getArrayParams(entry) {
    return this._parseArray(entry);
  }
  _parseArray(entry) {
    let content = new Array();
    let array = entry[0]
    let slitting;
    let obj;
    if(array.indexOf(',') != -1) {
      // console.log('boucle')
      slitting = array.split(',');
      slitting.forEach((s, index) => {
        obj = new Object();
        let subs = s.split('=>');
        obj.var = this.unformat(subs[0]);
        obj.value = this.unformat(subs[1]);
        content[index] = obj;
      })
    }
    else {
      // console.log('no boucle')
      slitting = array.split('=>');
      obj = new Object();
      obj.var = this.unformat(slitting[0]);
      obj.value = this.unformat(slitting[1]);
      content.push(obj);

    }
    return content;
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
      blocks: this._hasBlocks(string_to_test).vars,
      directives: this._hasDirectives(string_to_test).vars,
      operators: this._hasOperators(string_to_test).operators,
      array: this._hasArray(string_to_test).array,
      stringParameters: this._getBasicParameters(string_to_test).params,
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
    let str_rt;
    let arr = entry.match(this.utils.unescapedBlocks)
    let arr2 = entry.match(this.utils.escapedBlocks)

    // console.log(arr2)
    if(arr != null || arr2 != null) {
      bool = true;
    }

    arr2 != null && arr === null  ? (str_rt = arr2) :
    arr2 === null && arr === null ? (str_rt = null) :
    arr2 != null && arr != null ? (str_rt = arr.concat(arr2)) :
    arr2 === null && arr != null ? (str_rt = arr) : null;


    return {response : bool, vars : str_rt , currentStr : entry}
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
    let is_a_array_param = this._hasArray(entry).array;
    let arr = entry.match(this.utils.stringParameters)
    if(arr != null) {
      bool = true;
    }
    // console.log('_getBasicParameters', arr)
    if(is_a_array_param != null) {
      arr = arr.filter((item) => {
        // console.log('item', item)
        return is_a_array_param[0].includes(item) === false;
      })
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
      bool = false;
      arr = null;
    }
    return {response : bool, operators : arr, currentStr : entry}
  }
  _hasArray(entry) {
    let bool = false;
    let arr = entry.match(this.utils.array)
    if(arr != null) {
      bool = true;
    }
    return {response : bool, array : arr, currentStr : entry}
  }
  normalizeParams(entry) {
    if(typeof entry === 'array') {
      entry.forEach((param) => {
        return param.replace('.', '/').replace("'", '').replace("'", '').toString()
      })
    }
    else {
      return entry.replace('.', '/').replace("'", '').replace("'", '').toString()
    }
  }
  formatForRegex(entry) {
    let format = entry.replace('[', '\\[').replace("]", '\\]').replace("$", '\\$').replace("> $", '> \\$').replace("(", '\\(').replace(")", '\\)');
    // console.log('format', format)
    return format
  }
  unformat(entry) {
    let format = entry.replace('[', '').replace("]", '').replace("$", '$').replace("> $", '> $').replace("(", '(').replace(")", ')').replace("\'", '').replace("\'", '').trim();
    // console.log('format', format)
    return format
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
