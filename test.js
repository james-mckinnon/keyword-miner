(function () {
    'use strict';

    var miner = require('./miner.js'),
        urls = [
            'https://en.wikipedia.org/wiki/Data_mining',
            'http://www.wildfireinternet.co.uk',
            'http://simple-seo.ecommerce.co.uk'
        ];

    urls.forEach(function (url) {
        var options = {
            site: url,
            limit: 5,
            element: 'body'
        };

        console.log('Site:', options.site);
        miner(options, function (error, words) {
            if (error) throw error;
            console.log('Words:', words);
        });
    });
}());
