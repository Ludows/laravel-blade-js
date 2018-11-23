let fs = require('fs');
let path = require('path');

var directives = {

  // {
  //  type: 'inline' // 'block' // 'both'
  // }

  // test: {
  //   type
  // }
  extends: {
    type: 'inline',
    render: (str, parser) => {
      let extend_rt;
      // console.log('extends start', obj)
      let params = parser.getParams(str)
      console.log('params', params[0].replace('.', '/'))
      let fullPath = path.join(parser._bld.options.views, parser.normalizeParams(params[0])+parser._bld.options.extension);
      extend_rt = fs.readFileSync(fullPath)
      parser.builder('append', extend_rt);
    }
  },
  section: {
    type: 'both',
    render : (obj, parser) => {
        var test_in_parent_view = parser.builder('find', '@yield\\(\''+ parser.normalizeParams(obj.params[0]) +'\'\\)' )
        // console.log('test', test_in_parent_view)
        if(test_in_parent_view.length > 0) {
          // Le bloc existe dans la vue parente
          // A REVOIR
          // switch (obj._bld._typeof) {
          //   case 'asblock':
          //     parser.builder('replace', {block: test_in_parent_view[0], to: obj._bld._codeToExec})
          //     break;
          //   default:
          //     parser.builder('replace', {block: test_in_parent_view[0], to: obj._bld._execPathParam})
          //     break;
          // }
          // console.log('the html', parser.builder('html'))

        }
        else {
          parser.handleError()
        }
    }
  }


  // extends : (obj, parser) => {
  //   let extend_rt;
  //   // console.log('extends start', obj)
  //   let fullPath = path.join(obj._bld.views, parser.normalizeParams(obj.params[0])+obj._bld.extension);
  //   extend_rt = fs.readFileSync(fullPath)
  //   parser.builder('append', extend_rt);
  // },
  // section: (obj, parser) => {
  //   // console.log('section start', obj)
  //   var test_in_parent_view = parser.builder('find', '@yield\\(\''+ parser.normalizeParams(obj.params[0]) +'\'\\)' )
  //   // console.log('test', test_in_parent_view)
  //   if(test_in_parent_view.length > 0) {
  //     // Le bloc existe dans la vue parente
  //     switch (obj._bld._typeof) {
  //       case 'asblock':
  //         parser.builder('replace', {block: test_in_parent_view[0], to: obj._bld._codeToExec})
  //         break;
  //       default:
  //         parser.builder('replace', {block: test_in_parent_view[0], to: obj._bld._execPathParam})
  //         break;
  //     }
  //     // console.log('the html', parser.builder('html'))
  //
  //   }
  //   else {
  //     parser.handleError()
  //   }
  // }
}

module.exports = directives;
