/* DarkclamBot / make.js
 * echo 'make script for DarkclamBot' && node make
 * (c) 2016 David (daXXog) Volm ><> + + + <><
 * Released under Apache License, Version 2.0:
 * http://www.apache.org/licenses/LICENSE-2.0.html  
 */

var bitfactory = require('bitfactory'),
    UglifyJS = require("uglify-js"),
    stoptime = require('stoptime'),
    fs = require('fs');

var watch = stoptime(),
    header = '';

bitfactory.make({ //routes
    "": function(err, results) {
        console.log('built DarkclamBot in ' + watch.elapsed() + 'ms.');
    }
}, { //dependencies
    "*": { //wildcard
        "header": function(cb) {
            fs.readFile('darkclam-bot.h', 'utf8', function(err, data) {
                header = data;
                cb(err);
            });
        },
        "darkclam-bot.min.js": ["header", function(cb) {
            fs.writeFileSync('darkclam-bot.min.js', header + UglifyJS.minify('darkclam-bot.js').code);
            cb();
        }],
        "cli.min.js": ["header", function(cb) {
            fs.writeFileSync('cli.min.js', header + UglifyJS.minify('cli.js').code);
            cb();
        }]
    }
});