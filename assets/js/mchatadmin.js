jQuery(function($){

  var socket = io.connect();
  var song = $('#newchat');
  var nowStore = [];
  if (!store.enabled) {
    jQuery('#me').text('Local storage is not supported by your browser. Please disable "Private Mode", or upgrade to a modern browser.')
    return
  }

  //console.clear();

  store.clear();
  socket.emit('mnewadmin');

  //Set up env
  $('.window-area').css('display', "none");

  //Chat window
  function fitChat() {
    $('.chat-list').scrollTop($('.chat-list')[0].scrollHeight);
    $('#chatter_message').focus();
  }

  function sendWelcome() {

  }

  $('#adminLogin').submit(function(e) {
    e.preventDefault();

    var chatter_name = $('#admName').val();
    var admPass = $('#admPass').val();

    if(admPass !== 'sobhia') {
      $('.msgred').html('Wrong password');
      return;
    }

    chatter_email = ($('#admEmail').val()) ? $('#admEmail').val() : "me@example.com";
    store.set('chatter', {"chatter_name":chatter_name, "chatter_email": chatter_email });
    $('#admNamespan').text(chatter_name);
    var hash = md5(chatter_email),
    url = "https://secure.gravatar.com/avatar/" + hash + "?d=mm";
    $('#admimg').attr("src", url);

    //Set local variables
    store.set('aname', chatter_name);
    store.set('aemail', chatter_email);
    store.set('apic', url);

    $('.login-area').css('display', "none");
    $('.window-area').css('display', "block");
    $('.sign-out').removeClass('hidden');
    $('#addprod').removeClass('hidden');

    populateHistrory("room");

  });

  $('#newProduct').submit(function(e) {
    e.preventDefault();
    var postdata = {
      'name': $('#name').val(),
      'price':  $('#price').val(),
      'category': $('#category').val(),
      'imgs': $('.thumbnail.this img').attr('src')
    }
    socket.emit('newProduct', postdata, function(data) {
      $('#myModal').modal('hide');
      $("#newProduct")[0].reset();
      $('#successModal').modal('show');
    });

  });

  $('#thelistlink').click(function() {
    jQuery.getJSON( "products", function( data ) {
    var items = [];
    jQuery.each( data, function( key, val ) {
      console.log(val);
      items.push( '<li class="list-group-item"><div class="tumbnail"><a href="#"><img src="'+val.imgs+'" ></a><div class="caption"><h6><a href="#">'+val.name+'</a></h6><span class="price"></span><span class="price sale">$'+val.price+'</span></div></div></li>' );
    });

    jQuery( "<ul/>", {
      "class": "list-group",
      html: items.join( "" )
    }).appendTo( "#thelist" );
  });
  });

  $('#chatter_create_user').click(function(e) {
    e.preventDefault();
    var chatter_name = $('#chatter_name').val(),
    chatter_email = $('#chatter_email').val();
    store.set('chatter', {"chatter_name":"admin", "chatter_email": ""});
    $('.chatter_pre_signup').slideUp();
    $('.chatter_post_signup').slideDown();
    $('p#welcome').text('Hello, '+chatter_name);
    $('#chatter_message').focus();
    fitChat();
  });

  $('#admChatForm').submit(function(e) {
    e.preventDefault();
    var thisChat = $('#chatter_message').val();
    if( thisChat === '' ) {
      return false;
    }
    var chatter = store.get('chatter');

    store.get('aname');
    store.get('aemail');
    store.get('apic');

    //Get chatter details
    var aname = store.get('aname'),
    aemail = store.get('aemail'),
    aroom = store.get('aroom'),
    apic = store.get("apic");

    socket.emit('adminsChat', {
      "msg":thisChat,
      "room":chatter.room,
      "apic": apic,
      "aname":aname
    });
    var thisChatHtml = '<li class="me"><div class="name"><span class="">\
    '+chatter.chatter_name+'</span>\
    <span class="msg-time">'+getTimenow()+'</span></div>\
    <div class="message">\
    <p>'+thisChat+'</p>\
    </div></li>';
    $('.chat-list ul').append(thisChatHtml);
    $('#chatter_message').val('');
    fitChat();
  });


  socket.on('newCustomer', function(data){
    jQuery('#newusers').append("<li class='text-muted realcust' data-chatsub='" + data.chat_sub+ "' data-room='"+data.room+"'><a href='#'><span>" + data.chatter_name + "</span></a></li>");
    $('.customers li').click(function() {

      var room = $(this).attr('data-room');
      var chatsub = $(this).attr('data-chatsub');
      socket.emit('adminJoned', {"room":room});

      var aRooms = store.get('aroom');
      store.set('aroom', room);

      store.set('chatter', {"room":room, chatter_name:"Me"});
      $('.chatter_pre_signup').slideUp();
      $('.input-area').removeClass('hidden');
      $('.chatter_post_signup').slideDown();
      $('.chat-list ul li').remove();
      $('.nobody').fadeOut();
      $('#conv-title').text(chatsub);
    });
  });

  socket.on('usersReply', function(data){
    var thisChatHtml = '<li class="">\
    <div class="name">\
    <span class="">'+data.chatter_name+'</span><span class="msg-time">'+getTimenow()+'</span>\
    </div>\
    <div class="message">\
    <p>'+data.msg+'.</p>\
    </div></li>';
    $('.chat-list ul').append(thisChatHtml);
  });

  $('.fa-expand').click(function() {
    $('.window-wrapper').toggleClass('big');
  });
  $('.thumbnail').click(function() {
    $('.thumbnail').removeClass('this');
    $(this).addClass('this');
  });

  $('.sign-out').click(function() {
    store.clear(); // Clear all local storage including chat histry
    $('.login-area').css('display', "block");
    $('.window-area').css('display', "none");
    $('.sign-out').addClass('hidden');
  });

  $('#endchat').on('click', function(e) {
    e.preventDefault();
    var room = store.get('aroom');
    console.log(room);
    socket.emit('adminEnded', {"room":room});

  });

  function getTimenow() {
    var d = new Date();
    return d.toTimeString().split(" ")[0];
    return d.getHours() + ":" + d.getMinutes();
  }

  function populateHistrory(roomId) {
    $.getJSON("//localhost:3000/assets/chat-history.json",
    function (data) {
      //console.log(data.chats);
      for (chat of data.chats) {
        console.log(chat);
      }
    }
  );
}

});
