var getConnection = require('../connection.js');

exports.uploadImages = function (req, res) {
  getConnection(function (err, db) {
    var wine = req.body;
    var fs = require('fs');
    var hostname = req.headers.host;
    fs.readFile(req.files.displayImage.path, function (err, data) {
      var originalFilename = new Date().getTime() + req.files.displayImage.originalFilename,
      newPath = "uploads/" + originalFilename.replace(/[^a-z0-9._\-]/gi, '_').toLowerCase();
      fs.writeFile(newPath, data, function (err) {
        if (err) {
          res.send({"stat": 400, 'msg': "Unable to upload"});
          res.end();
        } else {
          var thisimage = [{
            filename: newPath,
            created: new Date().getTime()
          }];
          db.collection('images', function (err, collection) {
            collection.insert(thisimage, {safe: true}, function(err, result) {
              if (err) {
                res.send({"stat": 300, 'msg':'An error has occurred'});
              } else {
                delete result.ops._id;
                res.send({"stat": 200, "msg": "Success", "image":result.ops});
                res.end();
              }
            });
          });
        }
      });
    });
  });
};
