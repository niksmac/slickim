var getConnection = require('../connection.js');

// Create Group
exports.createGroup = function (req, res) {
  var shortid = require('shortid');
  var wine = req.body,
      result = {};
  wine.created = new Date().getTime();
  wine.groupId = shortid.generate();
  getConnection(function (err, db) {
    db.collection('groups', function (err, collection) {
      collection.insert(wine, {'_id':1}, function (err, item) {
        if (err) {
          res.send({'stat': 300, 'msg' : "Server Err"});
        } else {
          result.stat = 200;
          result.msg = 'New Registration';
          result.group = item.ops;
          res.send(result);
        }
      });
    });
  });
};

// Get all griups of mine
exports.getMygroups = function (req, res) {
  var needle = req.params.nick,
      result = {};
  getConnection(function (err, db) {
    db.collection('groups', function (err, collection) {
      collection.find({'mynick': needle}, {"_id":0} ).toArray(function (err, items) {
        if (err) { throw err; }
        if(items.length > 0) {
          result.stat = 200;
          result.msg = 'List of groups of ' + needle;
          result.groups = items;
          res.send(result);
        } else {
          result.stat = 300;
          result.msg = 'No Groups Yet';
          res.send(result);
        }
      });
    });
  });
};
