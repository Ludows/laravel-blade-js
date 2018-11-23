const directives = require('./directives');

class parser {
  constructor(bladeRender) {
    this.html = '';
    this._bld = bladeRender;
    this.patterns = this.paternify_directives(directives);
    // this.pattern = {
    //   block_with_escaping: new RegExp(/({{)(?: |)([^]+?)(?: |)}}/, 'gi'),
    //   block_without_escaping: new RegExp(/({!!)(?: |)([^]+?)(?: |)!!}/, 'gi'),
    //   inline_directive: new RegExp(/\@\w+\([\'\"](.*)[\'\"]\s*\,\s*[\'\"](.*)[\'\"]\)|\@\w+\([\'\"](.*)[\'\"]\s*\)/, 'gi'),
    //   global_directive: new RegExp(/\@\w+\(\s*[\'\"](.*)[\'\"]\s*\)((?:(?!\@show|\@stop|\@end\w+).*\s*)*)(\@show|\@stop|\@end\w+)/, 'gi'),
    // }
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
  paternify_directives(object) {
    // new RegExp(/\@\w+\([\'\"](.*)[\'\"]\s*\,\s*[\'\"](.*)[\'\"]\)|\@\w+\([\'\"](.*)[\'\"]\s*\)/, 'gi'),
    // new RegExp(/\@\w+\(\s*[\'\"](.*)[\'\"]\s*\)((?:(?!\@show|\@stop|\@end\w+).*\s*)*)(\@show|\@stop|\@end\w+)/, 'gi'),
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
          objGenerated.Regex = new RegExp("\@"+directive+"\\(\\s*[\'\"](.*)[\'\"]\\s*\\)((?:(?!\@show|\@stop|\@end"+directive+").*\\s*)*)(\@show|\@stop|\@end"+directive+")", 'gi')
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
  normalizerBothDirective(str1, str2) {
    var value_to_return;
    //tester le nombre de paramètres
    // si 2 parametre , str1 est retourné sinon c'est la str2
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


    // for me
    // operateur ternaire match
    // .+\?.+\:.+

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
    console.log('debug', entry)
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
  precompile(str, func) {

    // console.log('str html', str)

    this.patterns.forEach((pattern) => {

      // console.log('typeof pattern.Regex', typeof pattern.Regex)

      if(pattern.Regex.inline && pattern.Regex.block) {
        console.log('you must compare between two matches')
        var test1 = str.match(pattern.Regex.inline)
        var test2 = pattern.Regex.block.exec(str)
        console.log('test1', test1)
        console.log('test2', test2)
        this.normalizerBothDirective(test1[0], test2[0])
      }
      else {
        var test = str.match(pattern.Regex)
        console.log('test', test)
        directives[pattern.name].render(test[0], this)
      }



    })


    if(func && typeof func === 'function') {
      func(this.builder('html'));
    }
  }
  compile(string, func) {




    if(func && typeof func === 'function') {
      func();
    }
  }
}

module.exports = parser;
