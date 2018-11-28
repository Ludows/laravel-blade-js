let operators = {
  '==' : (val1, val2) => {return val1 == val2},
  '>=' : (val1, val2) => {return val1 >= val2},
  '>' : (val1, val2) => {return val1 >= val2},
  '<=' : (val1, val2) => {return val1 <= val2},
  '<' : (val1, val2) => {return val1 <= val2},
  '!=' : (val1, val2) => {return val1 != val2}
}

module.exports = operators
