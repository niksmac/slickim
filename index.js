var express = require('express'),
app = express(),
http = require('http'),
server = http.createServer(app),
morgan  = require('morgan'),
fs = require('fs'),
io = require('socket.io').listen(server),
socketClients = {},
oneYear = 31557600000;
server.listen(3000);
console.log('NodeJs server started on - http://localhost:3000');

var theStatic = require('./routes/static');
var theHelper = require('./routes/helper');
var users = {};

var multipart = require('connect-multiparty')
var multipartMiddleware = multipart();
var bodyParser = require('body-parser')
var passwordHash = require('password-hash');
var getConnection = require('./connection.js');
var S = require('string');

app.use( bodyParser.json({limit: '5mb'}) );
app.use(bodyParser.urlencoded({
  extended: true,
  limit: '50mb'
}));

//Configure logger; create a write stream (in append mode)
var accessLogStream = fs.createWriteStream(__dirname + '/access.log', {flags: 'a'})
app.use(morgan('combined', {stream: accessLogStream}))

//Serve Static Files
app.use("/assets", express.static(__dirname + '/assets', { maxAge: oneYear }));

// Show the home page
app.get('/', function (req, res) {
  res.sendFile(__dirname + '/views/index.html');
});

//Chat UI
app.get('/chat', function (req, res) {
  res.sendFile(__dirname + '/views/chat.html');
});

app.get('/mchat', function (req, res) {
  res.sendFile(__dirname + '/views/mchat.html');
});
app.get('/mchatadmin', function (req, res) {
  res.sendFile(__dirname + '/views/mchatadmin.html');
});


//The Chat
io.sockets.on('connection', function (socket) {
  var shortid = require('shortid');


  socket.on('newuser', function (data, callback) {
    if (data in users) {
      callback(false);
    } else {
      callback(true);
      socket.room = data.group;
      socket.join(data.group);
      socket.broadcast.to(data.group).emit('newusercame', {
        "nick": data.nick,
        "group": data.group,
      });
      socket.user_id = data.nick;
      socketClients[socket.user_id] = socket;
    }
  });

  socket.on('newchat', function (data, callback) {
    if (data in users) {
      callback(false);
    } else {
      callback(true);

      socket.broadcast.emit('chatlog', {
        "nick": data.nick,
        "group": data.group,
        "msg": data.msg,
        "photo": data.photo,
      });

      socket.room = data.group;
      socket.join(data.group);
      socket.broadcast.to(data.group).emit('chatbroardcast', {
        "nick": data.nick,
        "group": data.group,
        "msg": data.msg,
        "photo": data.photo,
      });

      socket.user_id = data.nick;
      socketClients[socket.user_id] = socket;


      var wine = data;
      getConnection(function (err, db) {
        db.collection('chats', function (err, collection) {
          collection.insert(wine, {safe: true}, function (err, result) {
            if (err) {
              console.log('err');
            } else {
              console.log('chat saved');
            }
          });
        });
      });

    }
  });

  socket.on('istyping', function (data, callback) {
    if (data in users) {
      callback(false);
    } else {
      callback(true);

      socket.room = data.group;
      socket.join(data.group);
      socket.broadcast.to(data.group).emit('someoneistyping', {
        "nick": data.nick,
        "group": data.group,
      });

      socket.user_id = data.nick;
      socketClients[socket.user_id] = socket;
    }
  });

  socket.on('disconnect', function (data) {
    if (!socket.user_id) { return; }
    delete socketClients[socket.user_id];
  });

  socket.on('mnewuser', function(data, callback) {
    var groupId = shortid.generate();
    socket.join(groupId);
    socket.broadcast.to('admins').emit('newCustomer', {
      "chatter_name": data.chatter_name,
      "chatter_email": data.chatter_email,
      "room": groupId,
      "chat_sub": data.chat_sub
    });

    var wine = data;
    getConnection(function (err, db) {
      db.collection('users', function (err, collection) {
        collection.insert(wine, {safe: true}, function (err, res) {
          if (err) {
            console.log('err');
          } else {
            console.log('addded');
          }
        });
      });
    });

    callback(groupId);
  });

  socket.on('mnewadmin', function(data) {
    socket.join("admins");
  });

  socket.on('adminJoned', function(data) {
    socket.join(data.room);
    socket.broadcast.to(data.room).emit('adminJonedYes', {});
  });

  socket.on('adminsChat', function(data) {
    socket.broadcast.to(data.room).emit('adminsReply', {
      "msg": data.msg,
      "apic": data.apic,
      "aname": data.aname,
      "chatter_name": 'Admins here'
    });

    var wine = data;
    getConnection(function (err, db) {
      db.collection('chats', function (err, collection) {
        collection.insert(wine, {safe: true}, function (err, result) {
          if (err) {
            console.log('err');
          } else {
            console.log('chat saved');
          }
        });
      });
    });

  });

  socket.on('usersChat', function(data) {
    socket.broadcast.to(data.room).emit('usersReply', {
      "msg": data.msg,
      "chatter_name": data.chatter_name
    });

    var thisMsg = data.msg;
    if (S(thisMsg).startsWith("/help")) {
      socket.in(data.room).emit('botReply', {
        "msg": "This is cool",
        "apic": "",
        "aname": "The Helper Bot",
        "chatter_name": 'The Helper Bot'
      });
    }

    var wine = data;
    getConnection(function (err, db) {
      db.collection('chats', function (err, collection) {
        collection.insert(wine, {safe: true}, function (err, result) {
          if (err) {
            console.log('err');
          } else {
            console.log('chat saved');
          }
        });
      });
    });
  });

  socket.on('adminEnded', function(data) {
    socket.broadcast.to(data.room).emit('adminEndedYes', {});
  });

  socket.on('userFeedback', function(data) {
    var wine = data;
    getConnection(function (err, db) {
      db.collection('feedback', function (err, collection) {
        collection.insert(wine, {safe: true}, function (err, result) {
          if (err) {
            console.log('err');
          } else {
            console.log('feedback saved');
          }
        });
      });
    });

  });

});
