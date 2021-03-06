var irc = require('irc');
var express = require('express');
var MongoClient = require('mongodb').MongoClient
, assert = require('assert');

var ircServer = 'irc.devhat.net';
var channel = '#test2';

// irc bot
var bot = new irc.Client(ircServer, 'ElGoorf', {
    port: 6667,
    debug: true,
    channels: [channel]
});

var users = [];

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
        
        var actionData = {
                type: "action",
                rawAction: action,
                dateTime: datetime,
                server: ircServer,
                channel: channel,
                nick: from
                };
        
        io.emit('chat-event', actionData);
        
        chatLog.insert([actionData]);
    });

    bot.addListener('message', function(from, to, message) {
    
        var datetime = new Date();
        
        var messageData = {
                type: "message",
                rawMessage: message,
                dateTime: datetime,
                server: ircServer,
                channel: channel,
                nick: from
                };
    
        io.emit('chat-event', messageData);
        
        chatLog.insert([messageData]);
    
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
        var datetime = new Date();
        
        var joinData = {
                type: "join",
                dateTime: datetime,
                server: ircServer,
                channel: channel,
                nick: who
                };
    
        io.emit('chat-event', joinData);
        
        chatLog.insert([joinData]);
    });
    
    bot.addListener('part', function(channel, who, reason) {
        var datetime = new Date();
        
        var partData = {
                type: "part",
                dateTime: datetime,
                server: ircServer,
                channel: channel,
                nick: who,
                reason:reason
                };
    
        io.emit('chat-event', partData);
        
        chatLog.insert([partData]);
    });
    bot.addListener('kick', function(channel, who, by, reason) {
        var datetime = new Date();

        var kickData = {
            type: "kick",
            dateTime: datetime,
            server: ircServer,
            channel: channel,
            nick:who,
            by:by,
            reason:reason
        };

        io.emit('chat-event', kickData);

        chatLog.insert([kickData]);
    });

    bot.addListener('topic', function(channel, topic, nick) {
        var datetime = new Date();

        var topicData = {
            type: "topic",
            dateTime: datetime,
            server: ircServer,
            channel: channel,
            topic: topic,
            by:nick,
        };

        io.emit('meta-topic', topicData);

        chatLog.insert([topicData]);
    });

    bot.addListener('names', function(channel,nicks) {

        users = nicks;

        io.emit('meta-users', users);
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

    io.emit('meta-users', users);
});