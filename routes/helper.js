var getConnection = require('../connection.js');

exports.uploadImages = function (req, res) {
  getConnection(function (err, db) {
    var wine = req.body;
    var fs = require('fs');
    var hostname = req.headers.host;
    fs.readFile(req.files.displayImage.path, function (err, data) {
      var originalFilename = new Date().getTime() + req.files.displayImage.originalFilename,
      newPath = "uploads/" + originalFilename;
      fs.writeFile(newPath, data, function (err) {
        if (err) {
          res.send({"stat": 400, 'msh': "Unable to upload"});
          res.end();
        } else {
          var thisimage = [{
            filename: originalFilename,
            created: new Date().getTime(),
            currentEventID: req.body.currentEventID
          }];
          db.collection('images', function (err, collection) {
            collection.insert(thisimage, {safe: true}, function(err, result) {
              if (err) {
                res.send({'error':'An error has occurred'});
              } else {
                res.send({"stat": 200, "msg": success, "data":result.ops});
                res.end();
              }
            });
          });
        }
      });
    });
  });
};
