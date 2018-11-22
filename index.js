let myTokenizer = require('./libs/tokenizer.conf.js').instance;
let myHTMLTokenizer = require('./libs/tokenizer.conf.js').instance2;
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
          token._bldConfig._typeof = token.tag === "directive with no closures" ? 'autoclose' : 'asblock'

          return token
        }
      })
      // blade parser start here
      let bladeParser = new parser();
      // return an array of object
      bladeParser.precompile(codeAr, (html) => {
        // console.log('html generated', html);
        // you must to tokenize another to check blade directive
        // var HTMLParser = require('fast-html-parser');



      })

    });
  }
  registerHelper() {
  }
  registerDirective() {

  }
}



module.exports = bladeRender
