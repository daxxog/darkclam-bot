/* DarkclamBot
 * A bot that gets users ready for the darkclam drop.
 * (c) 2016 David (daXXog) Volm ><> + + + <><
 * Released under Apache License, Version 2.0:
 * http://www.apache.org/licenses/LICENSE-2.0.html  
 */

/* UMD LOADER: https://github.com/umdjs/umd/blob/master/returnExports.js */
(function (root, factory) {
    if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like enviroments that support module.exports,
        // like Node.
        module.exports = factory();
    } else if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(factory);
    } else {
        // Browser globals (root is window)
        root.DarkclamBot = factory();
  }
}(this, function() {
    var S = require('string'),
        ValidCryptoAddress = require('valid-crypto-address'),
        JustBot = require('just-bot'),
        redis = require('redis'),
        async = require('async'),
        request = require('request'),
        inherits = require('util').inherits,
        DarkclamBot;
    
    //super hack
    DarkclamBot = function(_public, botconfig, redisconfig, eh) {
        var Parent = DarkclamBot.super_,
            bot = new Parent(botconfig),
            client = redis.createClient(redisconfig),
            ec = DarkclamBot.ERROR_CODES,
            consoleTest = false;
        
        if(typeof eh !== 'function') {
            eh = function(err, pos) {
                console.error(err);
            };
        }
        
        var infomsg = async.queue(function(msg, callback) {
            if(!consoleTest) {
                bot.msg(msg.to, msg.txt);
            } else {
                console.log(msg);
            }
            
            setTimeout(callback, 2500);
        }, 1);
        
        var chatmsg = async.queue(function(msg, callback) {
            if(!consoleTest) {
                _public.chat(msg);
            } else {
                console.log(msg);
            }
            
            setTimeout(callback, 2777);
        }, 1);
        
        bot.on('ready', function() {
            var info = '1) type /public; then /msg ' + bot.uid + ' #icanhazdarkclams';
            
            var meinfo = '/me ' + info;
            
            bot.on('msg', function(msg) {
                if(msg.txt === '/info' || msg.txt === '!info' || msg.txt === '!darkclam') {
                    infomsg.push({
                        to: msg.user,
                        txt: info
                    });
                } else if(ValidCryptoAddress(msg.txt)) {
                    if(S(msg.txt).startsWith('1') || S(msg.txt).startsWith('3')) {
                        request(['https://just-dice.com/user', msg.user].join('/'), function(err, res) {
                            if(!err) {
                                if(res.statusCode === 200) {
                                    if(res.body === 'user stats are private') {
                                        infomsg.push({
                                            to: msg.user,
                                            txt: info
                                        });
                                    }
                                    
                                    try {
                                        var body = JSON.parse(res.body),
                                            balance = body.play.wagered;
                                        
                                        client.hset('dc', msg.user, msg.txt, function(err) {
                                            if(!err) {
                                                infomsg.push({
                                                    to: msg.user,
                                                    txt: '3) ' + msg.txt + ' has ' + balance + ' DC pending; stay /public my friend'
                                                });
                                            } else {
                                                eh(err, ec.DC_ERROR);
                                            }
                                        });
                                    } catch (e) {
                                        eh(e.stack, ec.JD_ERROR);
                                    }
                                } else {
                                    eh(res.statusCode, ec.JD_ERROR);
                                }
                            } else {
                                eh(err, ec.JD_ERROR);
                            }
                        });
                    } else {
                        infomsg.push({
                            to: msg.user,
                            txt: '2) create an XCP wallet; https://wallet.counterwallet.io/; /msg ' + bot.uid + ' [XCP address]'
                        });
                    }
                } else if(S(msg.user).s !== S(bot.uid).s) { //prevent loops
                    infomsg.push({
                        to: msg.user,
                        txt: '2) create an XCP wallet; https://wallet.counterwallet.io/; /msg ' + bot.uid + ' [XCP address]'
                    });
                }
            });
            
            bot.on('chat', function(msg) {
                if(S(msg.txt).startsWith('!darkclam')) {
                    client.exists('dc.spam', function(err, exists) {
                        if(!err) {
                            if(!exists) {
                                client.set('dc.spam', 1, function(err) {
                                    if(!err) {
                                        client.expire('dc.spam', 3600 /* one hour */, function(err) {
                                            if(!err) {
                                                chatmsg.push(meinfo);
                                            } else {
                                                eh(err, ec.SPAM_EXPIRE_ERROR);
                                            }
                                        });
                                    } else {
                                        eh(err, ec.SPAM_SET_ERROR);
                                    }
                                });
                            } else {
                                infomsg.push({
                                    to: msg.user,
                                    txt: info
                                });
                            }
                        } else {
                            eh(err, ec.SPAM_EXISTS_ERROR);
                        }
                    });
                }
            });
        });
        
        return bot;
    }; inherits(DarkclamBot, JustBot);
    
    DarkclamBot.ERROR_CODES = {
        SPAM_EXISTS_ERROR: 1,
        SPAM_SET_ERROR: 2,
        SPAM_EXPIRE_ERROR: 3,
        JD_ERROR: 4,
        DC_ERROR: 5
    };
    
    return DarkclamBot;
}));
