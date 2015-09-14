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
var users = {};


var bodyParser = require('body-parser')
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/views/index.html');
});

//app.get('/story/:id', thisStory.getsingleStory);


//Static
app.get('/privacy', theStatic.privacy);
app.get('/terms', theStatic.terms);

//Users
app.post('/user', theUser.addUser);
app.get('/username_check/:uname', theUser.usernameCheck);
app.put('/user', theUser.editUser);

app.post('/user/auth', theUser.authUser);
