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
    db.collection('users', function (err, collection) {
      collection.findOne({'email': uEmail}, function (err, item) {
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
  getConnection(function (err, db) {
    var uEmail = req.body.email,
        result = {};

    db.collection('users', function (err, collection) {
      collection.update({'email': uEmail},
        {$set:{
          'fullName': req.body.fullName,
          "bio": req.body.bio,
          "mobile": req.body.mobile,
          "picId": req.body.picId
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
      uPass = passwordHash.generate(req.body.password),
      result = {};
  getConnection(function (err, db) {
    db.collection('users', function (err, collection) {
      collection.findOne({'email': email, "password":uPass}, function (err, items) {
        if (err) { throw err; }
        if(items) {
          result.stat = 200;
          result.msg = 'Nickname Taken !!';
          result.user = items;
          res.send(result);
        } else {
          result.stat = 400;
          result.msg = 'No Such combination found';
          res.send(result);
        }
      });
    });
  });
};
