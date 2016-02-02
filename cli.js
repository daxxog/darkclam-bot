/* DarkclamBot / cli.js
 * command line interface for DarkclamBot
 * (c) 2016 David (daXXog) Volm ><> + + + <><
 * Released under Apache License, Version 2.0:
 * http://www.apache.org/licenses/LICENSE-2.0.html  
 */

var DarkclamBot = require('./darkclam-bot.min.js'),
    JustBot = require('just-bot');

new DarkclamBot(new JustBot(process.argv[3]), process.argv[2]);