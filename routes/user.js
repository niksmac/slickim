var getConnection = require('../connection.js');

// Register New User
exports.addUser = function (req, res) {
  var wine = req.body;
  var passwordHash = require('password-hash');
  getConnection(function (err, db) {
    var uEmail = req.body.email,
        result = {},
        uPass = passwordHash.generate(req.body.password),
        hashKey = passwordHash.generate(req.body.email);
    wine.password = uPass;
    wine.accTok = hashKey;
    wine.fullName = "";
    wine.bio = "";
    wine.picPath = "";

    db.collection('users', function (err, collection) {
      collection.findOne({'email': uEmail}, function (err, item) {
        if (item) {
          result.stat = 100;
          result.msg = 'User Exists !!';
          res.send(result);
        } else {
          collection.insert(wine, {safe: true}, function (err, item) {
            if (err) {
              res.send({'stat': 300, 'msg' : "Server Err"});
            } else {
              result.stat = 200;
              result.msg = 'New Registration';
              result.user = item.ops;
              res.send(result);
            }
          });
        }
      });
    });
  });
};

//Checking for username Existance
exports.usernameCheck = function (req, res) {
  var needle = req.params.uname,
      result = {};
  getConnection(function (err, db) {
    db.collection('users', function (err, collection) {
      collection.findOne({'nick': needle}, function (err, items) {
        if (err) { throw err; }
        if(items) {
          result.stat = 100;
          result.msg = 'Nickname Taken !!';
          res.send(result);
        } else {
          result.stat = 200;
          result.msg = 'Nickname Available';
          res.send(result);
        }
      });
    });
  });
};

// Edit a User
exports.editUser = function (req, res) {
  var wine = req.body;
  //console.log(wine);
  //res.send(wine);

  getConnection(function (err, db) {
    var uEmail = req.body.email,
        result = {};
    db.collection('users', function (err, collection) {
      collection.update({'email': uEmail},
        {$set:{
          'fullName': req.body.fullName,
          "bio": req.body.bio,
          "mobile": req.body.mobile,
          "picPath": req.body.picPath
        }} , function (err, item) {
        if (item) {
          result.stat = 100;
          result.msg = 'User Exists !!';
          res.send(result);
        } else {
          collection.insert(wine, {safe: true}, function (err, result) {
            if (err) {
              res.send({'stat': 300, 'msg' : "Server Err"});
            } else {
              result.stat = 200;
              result.msg = 'New Registration';
              res.send(result);
            }
          });
        }
      });
    });
  });
};

//Checking for username Existance
exports.authUser = function (req, res) {
  var passwordHash = require('password-hash');
  var email = req.body.email,
      result = {};
  getConnection(function (err, db) {
    db.collection('users', function (err, collection) {
      collection.findOne({'email': email}, function (err, items) {
        if (err) { throw err; }
        if(items) {
          if(passwordHash.verify(req.body.password, items.password )) {
            result.stat = 200;
            result.msg = 'Logged In';
            result.user = items;
            res.send(result);
          } else {
            result.stat = 400;
            result.msg = 'Wrong Password';
            res.send(result);
          }
        } else {
          result.stat = 400;
          result.msg = 'No Such user found';
          res.send(result);
        }
      });
    });
  });
};

//Reset the password for an email address
exports.resetPass = function (req, res) {
  var emailorusername = req.body.emailorusername,
      result = {};
  getConnection(function (err, db) {
    db.collection('users', function (err, collection) {
      collection.findOne({ $or: [ { "email": emailorusername}, { "nick": emailorusername } ] }, function (err, items) {
        if (err) { throw err; }
        console.log(items);
        if(items) {
          result.stat = 200;
          result.msg = 'Email sent to your address !!';
          res.send(result);
        } else {
          result.stat = 400;
          result.msg = 'No Such user found';
          res.send(result);
        }
      });
    });
  });
};


//Search for a user
exports.userSearch = function (req, res) {
  var nickname = req.params.uname,
      result = {};
  getConnection(function (err, db) {
    db.collection('users', function (err, collection) {
      collection.find({ "nick": {$regex : nickname}}, { "fullName":1, "bio":1, "picPath":1, "_id":0, "nick":1  }).toArray(function (err, items) {
        if (err) { throw err; }
        console.log(items);
        if(items) {
          result.stat = 200;
          result.msg = 'Found';
          result.users = items;
          res.send(result);
        } else {
          result.stat = 400;
          result.msg = 'No Such user found';
          res.send(result);
        }
      });
    });
  });
};
