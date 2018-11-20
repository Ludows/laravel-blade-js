let myTokenizer = require('./libs/tokenizer.conf.js');
let parser = require('./libs/parser');
let directiveManager = require('./libs/directives');
let helpersManager = require('./libs/helpers');

var fs = require( 'fs' );
var path = require( 'path' );

class bladeRender {
  constructor(opts) {
    var defaults = {
      cache : true,
      cacheDir: '',
      views: '',
      extension: '.bjs'
    }
    this.options = Object.assign(defaults, opts)
    this.directives = directiveManager;
    this.helpers = helpersManager;
    this.variables = {}
  }
  render(name, properties, callback) {
    // console.log('options', this.options)
    console.log('name', name)
    console.log('properties', properties)
    // console.log('callback', callback);

    if(properties && typeof properties === 'object') {
      this.variables = properties;
    }

    // get full path to view
    let fullPathToView = path.join(this.options.views, name+this.options.extension);
    // you need to see content
    fs.readFile(fullPathToView, (err, code) => {
      if (err) {
          throw err;
      }
      // we tokenize code with our config
      let tokens = myTokenizer.tokenize( code.toString() );
      let codeAr = tokens.filter((token) => {
        if(token.tag === "directive with no closures" || token.tag === "directive with closures") {
          token._bldConfig = { views: this.options.views, extension : this.options.extension, name: name }
          return token
        }
      })
      // blade parser start here
      let bladeParser = new parser();
      // return an array of object
      bladeParser.parse(codeAr, (arr) => {
        console.log('codearr', arr)

        // INIT FIRST COMPILATION
        arr.forEach((comp) => {
          if(this.directives[comp.name] != undefined) {
            var compiled = this.directives[comp.name](comp);
            bladeParser.builder('append', compiled);
          }
          // else on handle les directives non existantes...

        })

      })
    });
  }
  registerHelper() {
  }
  registerDirective() {

  }
}



module.exports = bladeRender
