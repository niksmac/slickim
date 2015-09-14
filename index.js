var express = require('express'),
app = express(),
http = require('http'),
server = http.createServer(app),
io = require('socket.io').listen(server),
socketClients = {},
oneYear = 31557600000;
server.listen(3000);

var theUser = require('./routes/user');
var theStatic = require('./routes/static');
var theHelper = require('./routes/helper');
var users = {};

var multipart = require('connect-multiparty')
var multipartMiddleware = multipart();
var bodyParser = require('body-parser')
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));

//Serve Static Files
app.use("/uploads", express.static(__dirname + '/uploads', { maxAge: oneYear }));

// Show the home page
app.get('/', function (req, res) {
  res.sendFile(__dirname + '/views/index.html');
});


//Static
app.get('/privacy', theStatic.privacy);
app.get('/terms', theStatic.terms);

//Users
app.post('/user', theUser.addUser);
app.get('/username_check/:uname', theUser.usernameCheck);
app.put('/user', theUser.editUser);
app.post('/user/reset', theUser.resetPass);
app.post('/user/auth', theUser.authUser);

//Upload Image
app.post('/upload', multipartMiddleware, theHelper.uploadImages);
