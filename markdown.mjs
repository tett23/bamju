/* eslint no-plusplus: 0, func-names: 0 */


import Markdown from './app/main/parser/markdown';

const fs = require('fs');

const file = fs.readFileSync('/Users/tett23/projects/bamju-specifications/リンクのテスト.md').toString();

Markdown.parse('bamju-specifications', file).then((r) => {
  console.log(r);
});

// const marked = require('marked');
// const fs = require('fs');
// const { markedParserTok, markedLexerToken } = require('./app/main/parser/marked_overrides');
//
//
// const options = {
//   gfm: true,
//   tables: true,
//   breaks: true
// };
//
//
// const renderer = new marked.Renderer(options);
// renderer.inlineLink = (repo, name, fragment) => {
//   return `inlineLink: repo: ${repo}name: ${name}fragment: ${fragment}`;
// };
//
// const lexer = new marked.Lexer(options);
// lexer.rules.inlineLink1 = /^\s*\[\[inline\|(.+?):(.+?)#(.+?)\]\]/;
// lexer.rules.inlineLink2 = /^\s*\[\[inline\|(.+?)#(.+?)\]\]/;
// lexer.rules.inlineLink3 = /^\s*\[\[inline\|(.+?):(.+?)\]\]/; lexer.rules.inlineLink4 = /^\s*\[\[inline\|(.+?)\]\]/;
// lexer.token = markedLexerToken;
//
// const parser = new marked.Parser(Object.assign(options, { renderer }));
// parser.tok = markedParserTok;
//
//
// const tokens = lexer.lex(file);
// tokens.links = {};
//
// console.log(tokens);
//
// console.log(parser.parse(tokens));
