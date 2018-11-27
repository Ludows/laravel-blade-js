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
    render: (arr, parser) => {
      arr.forEach((extend) => {
        let extend_rt;
        // console.log('extends start', obj)
        let params = parser.getParams(extend)
        // console.log('params', params)
        // console.log('parser.normalizeParams(params[0])', parser.normalizeParams(params.defaultParams[0]))
        let fullPath = path.join(parser._bld.options.views, parser.normalizeParams(params.defaultParams[0])+parser._bld.options.extension);
        extend_rt = fs.readFileSync(fullPath)
        parser.builder('append', extend_rt);
      })
    }
  },
  section: {
    type: 'both',
    render : (arr, parser) => {
        arr.forEach((section) => {
          let params = parser.getParams(section);
          console.log('params section', params)
          // console.log('params length', params.length)
          var test_in_parent_view = parser.builder('find', '@yield\\(\''+ parser.normalizeParams(params.defaultParams[0]) +'\'\\)' )
          // console.log('test', test_in_parent_view)
          if(test_in_parent_view != null) {
            // Le bloc existe dans la vue parente
            switch (params.defaultParams.length) {
              case 1:
                parser.builder('replace', {block: test_in_parent_view[0], to: parser.getContents(section, 'section')})
                break;
              default:
                parser.builder('replace', {block: test_in_parent_view[0], to: parser.normalizeParams(params.defaultParams[1])})
                break;
            }

          }
          else {
            parser.handleError()
          }
        })

    }
  },
  if : {
    type: 'block',
    render: (arr, parser) => {
      console.log('string if called', arr)
      console.log('string if called', arr.length)
      arr.forEach((blk) => {
        let params = parser.getParams(blk);
        console.log("parser.getContents(blk, 'if')", parser.getContents(blk, 'if'))

        // A Modifier dans le futur
        let renderedVars = parser._renderVars(params.vars)[0]
        let ops = parser.normalizeParams(params.operators[0])
        let content = parser.getContents(blk, 'if')
        let defaultParam = parser.normalizeParams(params.defaultParams[0])
        if(renderedVars+${ops}+defaultParam) {
          console.log(renderedVars+ops+defaultParam)
          console.log(renderedVars==defaultParam)
        }
      })

    }
  }



}

module.exports = directives;
