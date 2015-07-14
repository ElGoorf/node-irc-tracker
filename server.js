var irc = require('irc');
var express = require('express');
var MongoClient = require('mongodb').MongoClient
, assert = require('assert');

var ircServer = 'irc.devhat.net';
var channel = '#test';

// irc bot
var bot = new irc.Client(ircServer, 'ElGoorf', {
    port: 6667,
    debug: true,
    channels: [channel]
});

// mongoDB connection
var mongoUrl = 'mongodb://localhost:27017/node-irc-tracker';
// Use connect method to connect to the Server
MongoClient.connect(mongoUrl, function(err, db) {
    assert.equal(null, err);
    console.log("Connected correctly to MongoDB server");

    var chatLog = db.collection('chatlog');
  
    bot.addListener('error', function(message) {
        console.error('ERROR: %s: %s', message.command, message.args.join(' '));
    });

    bot.addListener('message#blah', function(from, message) {
        io.emit('chat-live-message', {
            nick:from,
            rawMessage:message
        });
        console.log('<%s> %s', from, message);
    });

    bot.addListener('action', function(from, channel, action) {
    
        var datetime = new Date();
        
        io.emit('chat-event', {
            datetime: datetime,
            from:from,
            rawAction:action
        });
        
        chatLog.insert([{
                type: "action",
                rawAction: action,
                dateTime: datetime,
                server: ircServer,
                channel: channel,
                nick: from
                }]);
        
        console.log('*%s %s', from, action);
    });

    bot.addListener('message', function(from, to, message) {
    
        var datetime = new Date();
    
        io.emit('chat-event', {
            datetime: datetime,
            nick:from,
            to:to,
            rawMessage:message
        });
        
        chatLog.insert([{
                type: "message",
                rawMessage: message,
                dateTime: datetime,
                server: ircServer,
                channel: channel,
                nick: from
                }]);
        
        console.log('%s => %s: %s', from, to, message);
    
/*
        if (to.match(/^[#&]/)) {
            // channel message
            if (message.match(/hello/i)) {
                bot.say(to, 'Hello there ' + from);
            }
            if (message.match(/dance/)) {
                setTimeout(function() {
                    bot.say(to, '\u0001ACTION dances: :D\\-<\u0001');
                }, 1000);
                setTimeout(function() {
                    bot.say(to, '\u0001ACTION dances: :D|-<\u0001');
                }, 2000);
                setTimeout(function() {
                    bot.say(to, '\u0001ACTION dances: :D/-<\u0001');
                }, 3000);
                setTimeout(function() {
                    bot.say(to, '\u0001ACTION dances: :D|-<\u0001');
                }, 4000);
                io.emit('dance', {
                    'for': 'everyone'
                });
            }
        }
        else {
            // private message
            console.log('private message');
        }
        */
    });
    bot.addListener('pm', function(nick, message) {
        console.log('Got private message from %s: %s', nick, message);
    });
    bot.addListener('join', function(channel, who) {
        io.emit('chat-live-join', who);
        console.log('%s has joined %s', who, channel);
    });
    bot.addListener('part', function(channel, who, reason) {
        console.log('%s has left %s: %s', who, channel, reason);
        io.emit('chat-live-part', {
            who:who,
            reason:reason
        });
    });
    bot.addListener('kick', function(channel, who, by, reason) {
        console.log('%s was kicked from %s by %s: %s', who, channel, by, reason);
        io.emit('chat-live-kick', {
            who:who,
            by:by,
            reason:reason
        });
    });

    /* Storing data debate
 * 
 * Hussein: Video of me cycling: http://somevideolink.com and some photos http://imgur.com/i/1 http://imgur/i/2
 * 
 * index:
 *  datetime
 *  server
 *  channel
 *  nick
 *  type of message (part/join/message/action)
 *  media link(s)
 *
 * store as object:
 * {
 *  messageId: #00001,
 *  rawMessage: "Hussein: Video of me cycling: http://youtube.com/v/01234abcdef and some photos http://imgur.com/i/1 http://imgur/i/2 and the blog http://notmybase.com/cyclingblog",
 *  dateTime: 2015-06-20 12:00:00,
 *  server: "irc.devhat.net",
 *  channel: "#lobby",
 *  nick: "Hussein",
 *  type: "message",
 *  media: [
 *      {
 *          url:  "http://youtube.com/v/01234abcdef",
 *          type: video,
 *          source-title: "Hussein Cycling Trip"
 *      },
 *      {
 *          url:  "http://imgur.com/i/1",
 *          type: image,
 *          source-title: "Hussein's photo on Imgur.com"
 *      },
 *      {
 *          url:  "http://imgur.com/i/2",
 *          type: image,
 *          source-title: "Hussein's photo on Imgur.com"
 *      },
 *      {
 *          url:  "http://notmybase.com/cyclingblog",
 *          type: site,
 *          source-title: "Hussein's Cycling Blog - notmybase.com"
 *      },
 *  ]
 * }
 * 
 */
 

    //db.close();
});





// web page
var app     = express();
app.set('port', process.env.PORT || 3000);
var expressServer  = require('http').createServer(app).listen(app.get('port'),
  function(){
    console.log("Express server listening on port " + app.get('port'));
});
var io      = require('socket.io').listen(expressServer);
var http = require('http').Server(app);

app.use(express.static('public'));

app.get('/', function(req, res){
    res.sendFile(__dirname + '/public/index.html');
});

io.on('connection', function(client){
    console.log('Browser connection');
    // get recent chat history and send it to new client
//    client.broadcast.emit('chat-event',data);
    MongoClient.connect(mongoUrl, function(err, db) {
        console.log("Retrieving recent chat history...");
        var chatLog = db.collection('chatlog');
        chatLog.find({}).limit(30).toArray(function(err, docs) {
            assert.equal(err, null);        
            for(var d = 0; d < docs.length; d++){
                client.emit('chat-event',docs[d]);
            }
        });
    });
});