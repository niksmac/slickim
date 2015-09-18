var getConnection = require('../connection.js');

// Request Friendship
exports.inviteFriend = function (req, res) {
  var wine = req.body;
  wine.created = new Date().getTime();
  wine.approved = 0;
  getConnection(function (err, db) {
    var friendnick = req.body.friendnick,
        mynick = req.body.mynick,
        result = {};
    db.collection('users', function (err, collection) {
      collection.findOne({'nick': friendnick}, function (err, item) {
        if (item) {
          db.collection('friends', function (err, collection) {
            collection.findOneAndUpdate({'mynick': mynick, 'friendnick': friendnick, }, wine, {upsert: true}, function (err, item) {
              result.stat = 200;
              result.msg = 'Friendship requested to ' + friendnick;
              res.send(result);
            });
          });
        } else {
          result.stat = 400;
          result.msg = 'No Such user';
          res.send(result);
        }
      });
    });
  });
};

//Get Friends List
exports.getFriends = function (req, res) {
  var needle = req.params.nick,
      result = {};
  getConnection(function (err, db) {
    db.collection('friends', function (err, collection) {
      collection.find({'mynick': needle}, {"_id":0} ).toArray(function (err, items) {
        if (err) { throw err; }
        if(items) {
          result.stat = 200;
          result.msg = 'List of friends of ' + needle;
          result.friends = items;
          res.send(result);
        } else {
          result.stat = 100;
          result.msg = 'Zero friends';
          res.send(result);
        }
      });
    });
  });
};

//Match Contacts
exports.matchContacts = function (req, res) {
  var needle = req.body.emails,
      result = {};
  needleArray = needle.split(',');
  console.log(needleArray);
  getConnection(function (err, db) {
    db.collection('users', function (err, collection) {
      collection.ensureIndex({ "email": 1 })
      collection.find({'email': {'$in': needleArray}}, {"_id":0, "password":0, "accTok":0, "mobile":0 } ).toArray(function (err, items) {
        if (err) { throw err; }
        if(items) {
          result.stat = 100;
          result.msg = 'Matching Contacts';
          result.friends = items;
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
