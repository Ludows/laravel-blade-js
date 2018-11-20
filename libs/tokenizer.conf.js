var tokenizer = require( 'wink-tokenizer' );
let instance = tokenizer();

instance.defineConfig( {
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
} )

instance.addRegex( /\@\w+\(.*?\)/g , 'directive with no closures', 'g' );
instance.addRegex( /@\w+\(.*?\)\s+(.*?)\s+\@end\w+/g , 'directive with closures', 'g' );
// instance.addRegex( /<\s*a[^>]*>(.*?)<\s*/\s*a>/g, 'html' );

module.exports = instance;
