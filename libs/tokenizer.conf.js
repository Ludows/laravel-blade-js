var tokenizer = require( 'wink-tokenizer' );
let instance = tokenizer();
let instance2 = tokenizer();

var default_opts = {
  currency:false,
  email: false,
  emoji:false,
  emoticon: false,
  hashtag:false,
  number: false,
  ordinal: false,
  punctuation: false,
  quoted_phrase: false,
  symbol: false,
  time: false,
  mention: false,
  url: false,
  word: false,
  alien:false
}

instance.defineConfig( default_opts )
instance2.defineConfig( default_opts )

instance.addRegex( /\@\w+\(.*?\)/g , 'directive with no closures', 'g' );
instance.addRegex( /@\w+\(.*?\)\s+(.*?)\s+\@end\w+/g , 'directive with closures', 'g' );

// instance2.addRegex( /[^\r\n]+/g , 'line', 'g' );

// instance2.addRegex( /\@\w+\(.*?\)/g , 'directive with no closures', 'g' );
// instance2.addRegex( /@\w+\(.*?\)\s+(.*?)\s+\@end\w+/g , 'directive with closures', 'g' );
// instance2.addRegex( /<(\s*|\/)\w+[^>]*>/g, 'html as inline', 'g' );
// instance2.addRegex( /<((?=!\-\-)!\-\-[\s\S]*\-\-|((?=\?)\?[\s\S]*\?|((?=\/)\/[^.\-\d][^\/\]'"[!#$%&()*+,;<=>?@^`{|}~ ]*|[^.\-\d][^\/\]'"[!#$%&()*+,;<=>?@^`{|}~ ]*(?:\s[^.\-\d][^\/\]'"[!#$%&()*+,;<=>?@^`{|}~ ]*(?:=(?:"[^"]*"|'[^']*'|[^'"<\s]*))?)*)\s?\/?))>/ig, 'html ', 'g' );

// instance2.addRegex( /\<+[a-zA-Z0-9\=\"\s]+\>/gi, 'html', 'g' );

module.exports = {instance, instance2};
