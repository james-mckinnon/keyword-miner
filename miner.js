(function() {
  'use strict';

  var request = require('request'),
    miner = require('text-miner'),
    cheerio = require('cheerio');

  function ascending(a, b) {
    return a.count > b.count ? -1 : ((a.count < b.count) ? 1 : 0);
  }

  function validate(term) {
    return /^[a-zA-Z]+$/.test(term.word);
  }

  function limit(max) {
    return function (term, index) {
      return max ? index < max : true;
    };
  }

  function query(options, done) {
    if (!options) {
      return done(new Error('options/url is null'));
    }

    options = typeof options === 'string' ? { site: options } : options;

    if (!options.site) {
      return done(new Error('URL invalid: ' + options.site));
    }

    options.threshold = options.threshold || 0;
    options.limit = options.limit || 0;
    options.element = options.element || 'body';
    options.exclude = options.exclude || [];
    options.ignoreInlineCSS = options.ignoreInlineCSS || true;
    options.ignoreScripts = options.ignoreScripts || true;

    var requestOptions = {
      url: options.site,
      followRedirects: true,
      followAllRedirects: true,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2228.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Encoding': 'gzip, deflate, sdch',
        'Accept-Language': 'en-GB,en-US;q=0.8,en;q=0.6',
        'Cache-Control': 'max-age=0',
        'Connection': 'keep-alive'
      }
    };

    request(requestOptions, function(error, response, body) {
      if (error || response.statusCode != 200) {
        return done();
      }

      var corpus = new miner.Corpus([]),
        words = [],
        terms,
        dom = cheerio.load(body),
        doc;

      if (options.ignoreInlineCSS || options.ignoreScripts) {
        doc = dom(options.element).html();

        if (options.ignoreInlineCSS) {
          doc = doc.replace(/style=(['"])[^\1]*?\1/ig, '').replace(/<style[^<]*?<\/style>/ig, '');
        }

        if (options.ignoreScripts) {
          doc = doc.replace(/<script[\s\S]*?<\/script>/ig, '').replace(/<noscript[\s\S]*?<\/noscript>/ig, '');
        }

        doc = dom(doc).text();
      } else {
        doc = dom(options.element).text();
      }

      corpus.addDoc(doc);
      corpus.trim()
        .toLower()
        .removeInvalidCharacters()
        .removeInterpunctuation()
        .removeNewlines()
        .removeDigits()
        .removeWords(miner.STOPWORDS.EN)
        .stem();

      done(
        null,
        new miner.Terms(corpus)
          .findFreqTerms(options.threshold)
          .sort(ascending)
          .filter(validate)
          .filter(function (term) {
            return options.exclude.indexOf(term.word) === -1;
          })
          .filter(limit(options.limit))
      );
    });
  }

  module.exports = query;

}());
