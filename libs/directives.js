let fs = require('fs');
let path = require('path');

var directives = {
  extends : (obj, parser) => {
    let extend_rt;
    // console.log('extends start', obj)
    let fullPath = path.join(obj._bld.views, parser.normalizeParams(obj.params[0])+obj._bld.extension);
    extend_rt = fs.readFileSync(fullPath)
    parser.builder('append', extend_rt);
  },
  section: (obj, parser) => {
    console.log('section start', obj)
    var test_in_parent_view = parser.builder('find', '@yield\\(\''+ parser.normalizeParams(obj.params[0]) +'\'\\)' )
    console.log('test', test_in_parent_view)
    if(test_in_parent_view.length > 0) {
      // Le bloc existe dans la vue parente
      switch (obj._bld._typeof) {
        case 'asblock':

          break;
        default:

      }
    }
    else {
      parser.handleError()
    }
  }
}

module.exports = directives;
