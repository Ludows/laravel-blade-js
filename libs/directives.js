let fs = require('fs');
let path = require('path');
const utilties = require('./utilities')

var directives = {

  extends: {
    type: 'inline',
    render: (arr, parser) => {
      arr.forEach((extend) => {
        let extend_rt;
        // console.log('extends start', obj)
        let params = parser.getParams(extend)
        // console.log('params', params)
        // console.log('parser.normalizeParams(params[0])', parser.normalizeParams(params.stringParameters[0]))
        let fullPath = path.join(parser._bld.options.views, parser.normalizeParams(params.stringParameters[0])+parser._bld.options.extension);
        extend_rt = fs.readFileSync(fullPath)
        parser.builder('append', extend_rt);
      })
    }
  },
  section: {
    type: 'both',
    render : (arr, parser) => {
      // console.log('arr of sections', arr)
        arr.forEach((section) => {
          // console.log('section ?', section);
          let params = parser.getParams(section);
          // console.log('params section', params)
          var obj = {
            directive : 'section',
            name: parser.normalizeParams(params.stringParameters[0]),
            content: parser.getContents(section, 'section'),
            currentStr: params.currentStr,
            paramsLength: params.stringParameters.length
          }
          parser._sendToTemp(obj)
        })

    }
  },
  yield: {
    type: 'inline',
    render : (arr, parser) => {
      arr.forEach((yield) => {
        // console.log('section ?', section);
        let params = parser.getParams(yield);
        // console.log('params yield', params)

        let name = parser.normalizeParams(params.stringParameters[0])
        var entryObj = parser.getTemp(name)
        var test_in_parent_view = parser.builder('find', '@yield\\(\''+ entryObj.name +'\'\\)' )
        // console.log('test', test_in_parent_view)
        if(test_in_parent_view != null) {
          // Le bloc existe dans la vue parente
          switch (entryObj.paramsLength) {
            case 1:
              parser.builder('replace', {block: test_in_parent_view[0], to: entryObj.content })
              break;
            default:
              parser.builder('replace', {block: test_in_parent_view[0], to: entryObj.content })
              break;
          }

        }
        else {
          parser.handleError()
        }
      })
    }
  },
  hasSection: {
    type: 'block',
    render : (arr, parser) => {}
  },
  if : {
    type: 'block',
    render: (arr, parser) => {
      // console.log('string if called', arr)
      // console.log('string if called', arr.length)
      arr.forEach((blk) => {
        let params = parser.getParams(blk);

        // A Modifier dans le futur

        // pour l'instant pas de gestions en profondeur des operateurs ..
        // pour l'instant pas de gestion du @elseif and @else ..

        let bld = parser.getVars();
        let renderedVars = parser._renderVars(params.vars)[0]
        let ops = parser.normalizeParams(params.operators[0])
        let content = parser.getContents(blk, 'if')
        let defaultParam = parser.normalizeParams(params.stringParameters[0])

        let result = parser.evaluate(params.operators[0], renderedVars, defaultParam)

        if(result === true) {
          parser.builder('replace', {block: blk, to: content})
        }
        else {
          parser.builder('replace', {block: blk, to: ''})
        }
      })

    }
  },
  prepend : {
    type: 'block',
    render: (arr, parser) => {

    }
  },
  push : {
    type: 'block',
    render: (arr, parser) => {
      arr.forEach((push) => {
        let params = parser.getParams(push);
        var obj = {
          directive : 'push',
          name: parser.normalizeParams(params.stringParameters[0]),
          content: parser.getContents(push, 'push'),
          currentStr: params.currentStr,
        }
        parser._sendToTemp(obj)
      })
    }
  },
  stack : {
    type: 'inline',
    render: (arr, parser) => {
      arr.forEach((stack) => {
        let params = parser.getParams(stack);
        // console.log(params)
        let name = parser.normalizeParams(params.stringParameters[0])
        // console.log('name', name)
        var entryObj = parser.getTemp(name)
        // console.log('entryObj', entryObj)
        if(entryObj != undefined) {
          var test_in_parent_view = parser.builder('find', '@stack\\(\''+ entryObj.name +'\'\\)' )
          if(test_in_parent_view != null) {
            // Le bloc existe dans la vue parente
            switch (entryObj.paramsLength) {
              case 1:
                parser.builder('replace', {block: test_in_parent_view[0], to: entryObj.content })
                break;
              default:
                parser.builder('replace', {block: test_in_parent_view[0], to: entryObj.content })
                break;
            }
          }
        }
        else {
          var test_in_parent_view = parser.builder('find', '@stack\\(\''+ name +'\'\\)' )
          // console.log('test_in_parent_view', test_in_parent_view)
          if(test_in_parent_view != null) {
            parser.builder('replace', {block: test_in_parent_view[0], to: '' })

          }
          parser.handleError()
        }


      })
    }
  },
  each : {
    type: 'inline',
    render: (arr, parser) => {

    }
  },
  include: {
    type: 'inline',
    render: (arr, parser) => {
      arr.forEach((include) => {
        // console.log('component', arr)
        let include_rt;
        // console.log('parser', parser)
        let params = parser.getParams(include);
        let fullPath = path.join(parser._bld.options.views, parser.normalizeParams(params.stringParameters[0])+parser._bld.options.extension);
        // console.log('fullPath', fullPath)
        include_rt = fs.readFileSync(fullPath)
        // console.log('include_rt', include_rt.toString())
        let name = params.stringParameters[0].replace('.', '\\.').replace("'", '').replace("'", '');
        var test_in_parent_view = parser.builder('find', '@include\\(\''+ name +'\'\\)' )
        // console.log('test_in_parent_view', test_in_parent_view)
        if(test_in_parent_view != null) {
          parser.builder('replace', {block: test_in_parent_view[0], to: include_rt.toString()})
        }
        else {
          parser.handleError();
        }
      })
    }
  },
  includeIf: {
    type: 'inline',
    render: (arr, parser) => {
      // console.log('includeIf arr', arr)
      arr.forEach((includeIf) => {
        // console.log('component', arr)
        let includeIf_rt;
        // console.log('parser', parser)
        let params = parser.getParams(includeIf);
        let fullPath = path.join(parser._bld.options.views, parser.normalizeParams(params.stringParameters[0])+parser._bld.options.extension);
        // console.log('fullPath', fullPath)
        var existPath = fs.existsSync(fullPath)
        // console.log('test', test)
        if(existPath === true) {
          includeIf_rt = fs.readFileSync(fullPath)
          // console.log('test_in_parent_view', test_in_parent_view)
          let name = params.stringParameters[0].replace('.', '\\.').replace("'", '').replace("'", '');
          var test_in_parent_view = parser.builder('find', '@includeIf\\(\''+ name +'\'\\)' )
          if(test_in_parent_view != null) {
            parser.builder('replace', {block: test_in_parent_view[0], to: include_rt.toString()})
          }
          else {
            parser.handleError();
          }
        }
        else {
          parser.builder('replace', {block: includeIf, to: ''})
        }

      })
    }
  },
  includeWhen: {
    type: 'inline',
    render: (arr, parser) => {
      // console.log('includeWhen', arr)
        // console.log('includeWhen length', arr.length)
      arr.forEach((includeWhen) => {
        // console.log('component', arr)
        let includeWhen_rt;
        // console.log('parser', parser)
        let params = parser.getParams(includeWhen.toString());
        console.log('params includeWhen', params)
        let fullPath = path.join(parser._bld.options.views, parser.normalizeParams(params.stringParameters[0])+parser._bld.options.extension);
        // console.log('fullPath', fullPath)
        var existPath = fs.existsSync(fullPath)

        let vars = parser.getVars();
        let isBool = parser._renderVars(params.vars[0]);

        // console.log('test', test)
          if(existPath === true && isBool === true) {
            includeWhen_rt = fs.readFileSync(fullPath)
            var test_in_parent_view = parser.builder('find', parser.formatForRegex(includeWhen) )
            console.log('includeWhen_rt', includeWhen_rt.toString())

            var arrParams = parser.getArrayParams(params.array);

            console.log('test_in_parent_view', test_in_parent_view)

            if(test_in_parent_view != null) {
              parser.builder('replace', {block: test_in_parent_view[0], to: includeWhen_rt.toString()})
            }
            else {
              parser.handleError();
            }
          }
          else {
            parser.builder('replace', {block: includeWhen, to: ''})
          }


      })
    }
  },
  includeFirst: {
    type: 'inline',
    render: (arr, parser) => {

    }
  },
  component: {
    type: 'block',
    render: (arr, parser) => {
      // console.log('component', arr)
      arr.forEach((component) => {
        let component_rt;
        var condition_to_extract;
        let params = parser.getParams(component);
        let fullPathToView = path.join(parser._bld.options.views, parser._bld.options.componentsDir, parser.normalizeParams(params.stringParameters[0])+parser._bld.options.extension);
        component_rt = fs.readFileSync(fullPathToView).toString()
        parser.builder('replace', {block: component, to: component_rt})

        let slots = parser.hasDirective('slot', component.toString())
        // console.log('slots', slots)
        if(slots != null) {
          // Nous avons des slots à gérer
          slots.forEach((slot) => {
            let slotParams = parser.getParams(slot);

            condition_to_extract = parser.hasVar(parser.normalizeParams(slotParams.stringParameters[0]), component_rt)
            if(condition_to_extract.length > 0) {
              let slotContent = parser.getContents(slot, 'slot');
              component = component.replace(slot, '');
              parser.builder('replace', {block: condition_to_extract, to: slotContent})
            }
            else {
              parser.handleError();
            }
          })
          // console.log(parser.builder('html'))
        }

        condition_to_extract = parser.hasVar('slot', component_rt)

        if(condition_to_extract.length > 0) {
          let lastContents = parser.getContents(component, 'component');
          parser.builder('replace', {block: condition_to_extract, to: lastContents})
        }
        else {
          parser.handleError();
        }

      })

    }
  },
  slot: {
    type:'block',
    render:(arr, parser) => {
      // console.log('slot arr', arr)
    }
  },
  csrf: {
    type:'inline',
    render:(arr, parser) => {
      // console.log('slot arr', arr)
    }
  },
  json: {
    type:'inline',
    render:(arr, parser) => {
      // console.log('slot arr', arr)
    }
  },
  verbatim: {
    type: 'block',
    render: (arr, parser) => {

    }
  },
  isset: {
    type: 'block',
    render: (arr, parser) => {
      arr.forEach((isset) => {
        let params = parser.getParams(isset);
        let vars = parser._renderVars(params.vars[0]);
        let content = parser.getContents(isset, 'isset')
        if(utilties.empty(vars) === false) {
          parser.builder('replace', {block: isset, to: content})
        }
        else {
          parser.builder('replace', {block: isset, to: ''})
        }
      })
    }
  },
  empty: {
    type: 'block',
    render: (arr, parser) => {
      arr.forEach((empty) => {
        let params = parser.getParams(empty);
        let vars = parser._renderVars(params.vars[0]);
        let content = parser.getContents(empty, 'empty')
        if(utilties.empty(vars) === true) {
          parser.builder('replace', {block: empty, to: content})
        }
        else {
          parser.builder('replace', {block: empty, to: ''})
        }
      })
    }
  },
  php: {
    type: 'block',
    render: (arr, parser) => {

    }
  },
  switch: {
    type: 'block',
    render: (arr, parser) => {

    }
  },
  for: {
    type: 'block',
    render: (arr, parser) => {

    }
  },
  foreach: {
    type: 'block',
    render: (arr, parser) => {

    }
  },
  forelse: {
    type: 'block',
    render: (arr, parser) => {

    }
  },
  while: {
    type: 'block',
    render: (arr, parser) => {

    }
  },
  continue: {
    type: 'inline',
    render: (arr, parser) => {

    }
  },
  break: {
    type: 'inline',
    render: (arr, parser) => {

    }
  },
  inject: {
    type: 'inline',
    render: (arr, parser) => {

    }
  }



}

module.exports = directives;
