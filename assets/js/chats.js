jQuery(function($){

        var socket = io.connect();
        var song = $('#newchat');

        if (!store.enabled) {
          jQuery('#me').text('Local storage is not supported by your browser. Please disable "Private Mode", or upgrade to a modern browser.')
          return
        }

        if(typeof store.get('nick') != "undefined") {
          var nick = store.get('nick');
          var group = store.get('group');

          jQuery('#me').attr('data-nick', nick);
          jQuery('#me').attr('data-group', group);

          var userdata = {"nick":nick, "group": group};
          jQuery('#me').text(nick + " IN "+ group);
          socket.emit('newuser', userdata, function(data){
            $('#newuser').hide();
            $('#chatWrap').show();
          });
        }


        


        jQuery('#message').keyup(function(e){
          var nick = jQuery('#me').attr('data-nick');
          var group = jQuery('#me').attr('data-group');
          var chatdata = {"nick":nick, "group": group};

          socket.emit('istyping', chatdata, function(data){

          });
        });



        jQuery('#leave').click(function(e){
          // Clear all local data
          store.clear();
          $('#newuser').fadeIn();
          $('#chatWrap').fadeOut();
          return false;
        });


        jQuery('#nickform').submit(function(e){
          e.preventDefault();
          var nick = jQuery('#nikk').val();
          var group = jQuery('#group').val();

          store.set('nick', nick);
          store.set('group', group);

          jQuery('#me').attr('data-nick', nick);
          jQuery('#me').attr('data-group', group);

          jQuery('#me').text(nick + " IN "+ group);

          var userdata = {"nick":nick, "group": group};
          socket.emit('newuser', userdata, function(data){
            $('#newuser').hide();
            $('#chatWrap').show();
          });
        });

        jQuery('#msgForm').submit(function(e){
          e.preventDefault();
          var msg = jQuery('#message').val();
          var nick = jQuery('#me').attr('data-nick');
          var group = jQuery('#me').attr('data-group');

          var fpath = (typeof jQuery('#fileupload').attr('data-fpath') != 'undefined') ? jQuery('#fileupload').attr('data-fpath') : "";
          chatdata = {"nick":nick, "group": group, "msg": msg, "photo": fpath};

          socket.emit('newchat', chatdata, function(data){
            $('#fileupload').fadeIn();
          });

          if(typeof jQuery('#fileupload').attr('data-fpath') != 'undefined') {
           jQuery('#chats').append('<p> <img class="img-responsive img-rounded" src="'+ fpath +'" > <p>');
          }
          jQuery('#chats').append("<p class='text-primary'><b>Me:</b> " + msg + '</p>');
          jQuery('#message').val('');

        });

        socket.on('chatbroardcast', function(data){
          console.log(data);
          song.get(0).play();
          if(typeof data.photo != 'undefined') {
            jQuery('#chats').append('<p><img class="img-responsive img-rounded" src="'+ data.photo +'" > <p>');
          }
          jQuery('#chats').append("<p class='text-muted'><b>"+data.nick+":</b> " + data.msg + '</p>');
        });

        socket.on('chatlog', function(data){
          if(typeof data.photo != 'undefined') {
            jQuery('#chatlog').append("<p class='text'><b>"+data.nick+" uploaded a <a href='" + data.photo + "'>photo<a></p>");
          }
          jQuery('#chatlog').append("<p class='text'><b>"+data.nick+":</b> Said " + data.msg + ' in ' + data.group + '</p>');
        });

        socket.on('someoneistyping', function(data){
          jQuery('#istyp').fadeIn();
          jQuery('#istyp').text(data.nick + ' is typing...');
          setTimeout(function(){
            jQuery('#istyp').fadeOut();
          }, 2000);

        });


        socket.on('newusercame', function(data){
          jQuery('#chats').append("<p class='text-success'>" + data.nick + ' Joined Chat<br></p>');
        });





});

$(function () {
  $('#fileupload').fileupload({
    dataType: 'json',
    done: function (e, data) {
      $('#fileupload').fadeOut();
      var imgPath = data.result.image[0].filename;
      $('#fileupload').attr('data-fpath', imgPath);
    }
  });
});

function base64(file, callback){
  var coolFile = {};
  function readerOnload(e){
    var base64 = btoa(e.target.result);
    coolFile.base64 = base64;
    callback(coolFile)
  };

  var reader = new FileReader();
  reader.onload = readerOnload;

  var file = file[0].files[0];
  coolFile.filetype = file.type;
  coolFile.size = file.size;
  coolFile.filename = file.name;
  reader.readAsBinaryString(file);
}
