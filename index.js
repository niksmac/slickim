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
app.use("/assets/js", express.static(__dirname + '/assets/js', { maxAge: oneYear }));
app.use("/assets/css", express.static(__dirname + '/assets/css', { maxAge: oneYear }));

// app.use(express.static(__dirname + '/assets'));


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


app.get('/products', function (req, res) {
  getConnection(function (err, db) {
    db.collection('products', function (err, collection) {
      collection.find().sort({$natural : -1}).toArray(function(err, items) {
        res.send(items);
      });
    });
  });
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

  socket.on('newSale', function(data, callback) {
    var orderId = shortid.generate();

    var wine = data;
    wine.orderId = orderId;
    getConnection(function (err, db) {
      db.collection('orders', function (err, collection) {
        collection.insert(wine, {safe: true}, function (err, res) {
          if (err) {
            console.log('err');
          } else {
            console.log('order created #' + orderId);
          }
        });
      });
    });
    callback();
  });


  socket.on('newProduct', function(data, callback) {
    var productId = shortid.generate();
    var wine = data;
    wine.productId = productId;
    getConnection(function (err, db) {
      db.collection('products', function (err, collection) {
        collection.insert(wine, {safe: true}, function (err, res) {
          if (err) {
            console.log('err');
          } else {
            console.log('product created #' + productId);
          }
        });
      });
    });
    callback();
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
    var botName = "Helper Bot";
    socket.broadcast.to(data.room).emit('usersReply', {
      "msg": data.msg,
      "chatter_name": data.chatter_name
    });
    // console.log(socket.id);
    var thisMsg = data.msg;
    var botsReply = '';
    if (S(thisMsg).startsWith("/help")) {
      botsReply = "This is a helper bot, you can see the list of commands here <ul><li>/help,</li> <li>/whoami,</li> <li>/purchases,</li> <li>/orderstatus,</li></ul>";
    } else if (S(thisMsg).startsWith("/whoami")) {
      botsReply = "Well, you are <b>" + data.chatter_name + "</b>";
    } else if (S(thisMsg).startsWith("/purchases")) {
      botsReply = '<ul class="sales">  <li>    <span>1</span>    <span>Birthday Cake</span>    <span>$95</span>  </li>  <li>    <span>2</span>    <span>Party Cups</span>    <span>$9.95</span>  </li>  <li>    <span>3</span>    <span>Pound of beef</span>    <span>$49.95</span>  </li>  <li>    <span>4</span>    <span>Bullet-proof vest</span>    <span>$495</span>  </li>  </ul>';
    } else if (S(thisMsg).startsWith("/orderstatus")) {
      var delay = Math.floor(Math.random() * 6) + 1;
      var orderno = Math.floor(Math.random() * 61224) + 60000;
      botsReply = 'Your order #'+orderno+' will be delivered in <b>' + delay + '</b> days!!';
    }

    if (botsReply != '') {
      socket.emit('botsReply', {
        "msg": botsReply,
        "apic": "http://www.gravatar.com/avatar/00000000000000000000000000000000?d=monsterid&f=y",
        "aname": botName
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
