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
console.log('NodeJs server started on port 3000 - http://localhost:3000');

var theUser = require('./routes/user');
var thefriend = require('./routes/friends');
var theGroup = require('./routes/groups');
var theStatic = require('./routes/static');
var theHelper = require('./routes/helper');
var users = {};

var multipart = require('connect-multiparty')
var multipartMiddleware = multipart();
var bodyParser = require('body-parser')

app.use( bodyParser.json({limit: '5mb'}) );
app.use(bodyParser.urlencoded({
  extended: true,
  limit: '50mb'
}));

//Configure logger; create a write stream (in append mode)
var accessLogStream = fs.createWriteStream(__dirname + '/access.log', {flags: 'a'})
app.use(morgan('combined', {stream: accessLogStream}))

//Serve Static Files
app.use("/uploads", express.static(__dirname + '/uploads', { maxAge: oneYear }));
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
//Static
app.get('/privacy', theStatic.privacy);
app.get('/terms', theStatic.terms);

//Users
app.post('/user', theUser.addUser);
app.get('/username_check/:uname', theUser.usernameCheck);
app.get('/user/search/:uname', theUser.userSearch);
app.get('/user/me/:uname', theUser.userSearch);
app.put('/user', theUser.editUser);
app.post('/user/reset', theUser.resetPass);
app.post('/user/auth', theUser.authUser);

//Friendship
app.post('/friends/invite', thefriend.inviteFriend);
app.get('/friends/:nick', thefriend.getFriends);
app.post('/friends/match', thefriend.matchContacts);

//Chat Group
app.post('/group', theGroup.createGroup);
app.get('/mygroups/:nick', theGroup.getMygroups);

//Upload Image
app.post('/upload', multipartMiddleware, theHelper.uploadImages);
//app.post('/base64upload', multipartMiddleware, theHelper.base64upload);

//The Chat
io.sockets.on('connection', function (socket) {
  var shortid = require('shortid');
  var getConnection = require('./connection.js');
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
      "aname": data.aname
    });
  });

  socket.on('usersChat', function(data) {
    socket.broadcast.to(data.room).emit('usersReply', {
      "msg": data.msg,
      "chatter_name": data.chatter_name
    });
  });

});
