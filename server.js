var irc = require('irc');
var express = require('express');






// web page
var app     = express();
var server  = app.listen(1337);
var io      = require('socket.io').listen(server);
var http = require('http').Server(app);

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
  console.log('Browser connection');
});






// irc bot
var bot = new irc.Client('irc.devhat.net', 'Node', {
    port: 6667,
    debug: true,
    channels: ['#test']
});

bot.addListener('error', function(message) {
    console.error('ERROR: %s: %s', message.command, message.args.join(' '));
});

bot.addListener('message#blah', function(from, message) {
    console.log('<%s> %s', from, message);
});

bot.addListener('message', function(from, to, message) {
    console.log('%s => %s: %s', from, to, message);

    if (to.match(/^[#&]/)) {
        // channel message
        if (message.match(/hello/i)) {
            bot.say(to, 'Hello there ' + from);
        }
        if (message.match(/dance/)) {
            setTimeout(function() { bot.say(to, '\u0001ACTION dances: :D\\-<\u0001'); }, 1000);
            setTimeout(function() { bot.say(to, '\u0001ACTION dances: :D|-<\u0001');  }, 2000);
            setTimeout(function() { bot.say(to, '\u0001ACTION dances: :D/-<\u0001');  }, 3000);
            setTimeout(function() { bot.say(to, '\u0001ACTION dances: :D|-<\u0001');  }, 4000);
            io.emit('dance', { 'for': 'everyone' });
        }
    }
    else {
        // private message
        console.log('private message');
    }
});
bot.addListener('pm', function(nick, message) {
    console.log('Got private message from %s: %s', nick, message);
});
bot.addListener('join', function(channel, who) {
    io.emit('join', who);
    console.log('%s has joined %s', who, channel);
});
bot.addListener('part', function(channel, who, reason) {
    console.log('%s has left %s: %s', who, channel, reason);
    io.emit('part', {who:who,reason:reason});
});
bot.addListener('kick', function(channel, who, by, reason) {
    console.log('%s was kicked from %s by %s: %s', who, channel, by, reason);
    io.emit('part', {who:who,by:by,reason:reason});
});