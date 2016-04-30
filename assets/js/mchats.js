jQuery(function($){

  var socket = io.connect();
  var song = $('#newchat');
  var nowStore = [];
  if (!store.enabled) {
    jQuery('#me').text('Local storage is not supported by your browser. Please disable "Private Mode", or upgrade to a modern browser.')
    return
  }
  store.clear();

  //Chat window
  function fitChat() {
    $('.chatter_convo').scrollTop($('.chatter_convo')[0].scrollHeight);
    $('#chatter_message').focus();
  }

  function sendWelcome() {
    $('#chatter_message').focus();
  }

  $('.chatter_pre_signup').css('display', "block");
  $('.chatter_post_signup').css('display', "none");

  $('a').click(function(e) {
    e.preventDefault();
    var olStore = (store.get('links')) ? store.get('links') : '';
    nowStore.push([$(this).attr('href'), new Date().getTime()]);
    store.set('links', nowStore);
    console.log(nowStore);
    //window.location.href = ([$(this).attr('href');
  });

  $('#chatter_create_user').submit(function(e) {
    e.preventDefault();
    var chatter_name = $('#chatter_name').val(),
        chatter_email = $('#chatter_email').val(),
        chat_sub = $('#chat_sub').val();

    var hash = md5(chatter_email),
        url = "https://secure.gravatar.com/avatar/" + hash + "?d=mm";
    $('#chatter_avatar').attr("src", url);
    if(chatter_name === '') {
      $('#chatter_name').addClass('required');
      $('#chatter_name').focus();
      return false;
    }
    var userdata = {
      "chatter_name": chatter_name,
      "chatter_email": chatter_email,
      "chat_sub": chat_sub,
      "chat_pic": url
    };

    //Set local variables
    store.set('cname', chatter_name);
    store.set('cemail', chatter_email);
    store.set('cpic', url);

    //Ack admins
    socket.emit('mnewuser', userdata, function(data) {
      store.set('croom', data);
    });
    $('.chatter_pre_signup').slideUp();
    $('.chatter_post_signup').slideDown();
    $('#welcome').text("Please wait while one of our support executive joins you.");
    fitChat();
  });

  $('#sendchat').click(function() {
    console.log(store.get('croom'));
    var thisChat = $('#chatter_message').val();
    if( thisChat === '' ) {
      return false;
    }
    //Get chatter details
    var cname = store.get('cname'),
        cemail = store.get('cemail'),
        croom = store.get('croom'),
        cpic = store.get("cpic");
    socket.emit('usersChat', {"msg":thisChat, "room":croom, "chatter_name":cname});
    var thisChatHtml = "<span class='chatter_msg_item chatter_msg_item_user clearfix'>\
    <span class='chatter_avatar'><img src='"+cpic+"' /></span>\
    <strong class='chatter_name'>"+cname+"</strong>"+thisChat+"</span>";

    $('.chatter_convo').append(thisChatHtml);
    $('#chatter_message').val('');
    fitChat();
  });

  socket.on("adminJonedYes", function(data) {
    var thisChatHtml = "<div class='clearfix admincame'>An admistrator just joined your chat</div>";
    $('.chatter_convo').append(thisChatHtml);
  });

  socket.on("adminsReply",function(data) {
    console.log(data);
    renderNormalChat(data);
    var thisChatHtml = "<span class='chatter_msg_item chatter_msg_item_admin clearfix'>\
    <span class='chatter_avatar'><img src='"+data.apic+"' /></span>\
    <strong class='chatter_name'>" + data.aname + "</strong>"+data.msg+"</span>";
    $('.chatter_convo').append(thisChatHtml);
    fitChat();
  });

  socket.on("adminEndedYes", function(data) {
    console.log('adminEndedYes');
    console.log(data);
    $('.chatter_post_signup').slideDown();
  });

  $('#chatter_create_user').hide();
  $('.chatter_post_signup').hide();
  $('.chatter_feedback').show();

  $('#sendfeedback').click(function(e) {
    e.preventDefault();
    var chatter_name = $('#chatter_name').val(),
        chatter_email = $('#chatter_email').val(),
        chat_sub = $('#chat_sub').val(),
        feedback = $('#feedbacktxt').val();

    var userdata = {
      "chatter_name": chatter_name,
      "chatter_email": chatter_email,
      "chat_sub": chat_sub,
      "feedback": feedback
    };
    socket.emit('userFeedback', userdata, function(data) {
      console.log('success');
    });

  });



  //console.log(window.navigator.geolocation.getCurrentPosition);
  // socket.on('connection', function(data){
  //   var userdata = {"nick":nick, "group": group};
  // socket.emit('newuser', userdata, function(data){
  //   $('#newuser').hide();
  //   $('#chatWrap').show();
  // });
  // });


});


function renderNormalChat(data) {
  return data;
}
