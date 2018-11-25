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
      componentsDir: '',
      views: '',
      extension: '.bjs'
    }
    this.options = Object.assign(defaults, opts)
    this.directives = directiveManager;
    this.helpers = helpersManager;
    this.variables = {}
    this.events = {
      before_precompile: (parser) => {},
      after_precompile: (parser) => {},
      before_compile: (parser) => {},
      after_compile: (parser) => {},
      before_render: (parser) => {},
      completed_parsing: (parser) => {},
      error_parsing: (parser) => {}
    }
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
      // blade parser start here
      // we synchronise the bladeRenderer to parser
      let bladeParser = new parser(this);
      // console.log('bladeParser', bladeParser)
      // return an array of object
      bladeParser.precompile(code.toString(), (precompiled) => {
        console.log('precompiled', precompiled)
        bladeParser.compile(precompiled, (html) => {
          // console.log('html', html)
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
