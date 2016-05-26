var MongoClient = require('mongodb').MongoClient;
var db_singleton = null;
var getConnection = function getConnection(callback) {
  if (db_singleton) {
    callback(null, db_singleton);
  } else {
    // 109.109.241.2
    var connURL = "mongodb://109.109.241.2:27017/slickim";
    MongoClient.connect(connURL, function (err, db) {
      if (err) {
        console.log("Error creating new connection " + err);
      } else {
        db_singleton = db;
        console.log("created new connection");
      }
      callback(err, db_singleton);
      return;
    });
  }
}
module.exports = getConnection;
