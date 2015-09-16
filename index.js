var express = require('express'),
app = express(),
http = require('http'),
server = http.createServer(app),
io = require('socket.io').listen(server),
socketClients = {},
oneYear = 31557600000;
server.listen(3000);

var theUser = require('./routes/user');
var thefriend = require('./routes/friends');
var theStatic = require('./routes/static');
var theHelper = require('./routes/helper');
var users = {};

var multipart = require('connect-multiparty')
var multipartMiddleware = multipart();
var bodyParser = require('body-parser')
app.use( bodyParser.json({limit: '50mb'}) );
app.use(bodyParser.urlencoded({
  extended: true,
  limit: '50mb'
}));

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

//Upload Image
app.post('/upload', multipartMiddleware, theHelper.uploadImages);
//app.post('/base64upload', multipartMiddleware, theHelper.base64upload);

//The Chat
io.sockets.on('connection', function (socket) {
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
});
