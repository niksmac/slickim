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


  jQuery.getJSON( "products", function( data ) {
    var items = [];
    jQuery.each( data, function( key, val ) {
      console.log(val);
      items.push( '<div class="col-xs-6 col-md-4 sitems" data-toggle="modal" data-target="#myModal"><div class="product tumbnail thumbnail-3"><a href="#"><img src="'+val.imgs+'" alt=""></a><div class="caption"><h6><a href="#">'+val.name+'</a></h6><span class="price"></span><span class="price sale">$'+val.price+'</span></div></div></div>' );

      // <div class="col-xs-6 col-md-4 sitems" data-toggle="modal" data-target="#myModal">
      //   <div class="product tumbnail thumbnail-3"><a href="#"><img src="assets/img/shop-1.jpg" alt=""></a>
      //     <div class="caption">
      //       <h6><a href="#">Short Sleeve T-Shirt</a></h6><span class="price">
      //         </span><span class="price sale">$12.49</span>
      //       </div>
      //     </div>
      //   </div>


    });

    jQuery( "<ul/>", {
      "class": "my-new-list",
      html: items.join( "" )
    }).appendTo( "#catalog" );
    initpopup();
  });

  function initpopup() {
    $('.sitems').click(function() {
      var thisElm = $(this);
      $('.bname').html(thisElm.find('h6 a').html());
      $('.bprice').html(thisElm.find('.sale').html());
    });
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



  $('#buynow').submit(function(e) {
    e.preventDefault();
    var postdata = {
      'name': $('#name').val(),
      'email':  $('#email').val(),
      'address': $('#address').val(),
      'phone': $('#phone').val(),
      'pin': $('#pin').val(),
      'sitem': {
        'name': $('.well .bname').text(),
        'price': $('.well .bprice').text()
      }
    }

    socket.emit('newSale', postdata, function(data) {
      $('#myModal').modal('hide');
      $("#buynow")[0].reset();
      $('#successModal').modal('show');
    });

  });

  socket.on("adminJonedYes", function(data) {
    var thisChatHtml = "<div class='clearfix admincame'>An admistrator just joined your chat</div>";
    $('.chatter_convo').append(thisChatHtml);
  });

  socket.on("adminsReply",function(data) {
    renderNormalChat(data);
    var thisChatHtml = "<span class='chatter_msg_item chatter_msg_item_admin clearfix'>\
    <span class='chatter_avatar'><img src='"+data.apic+"' /></span>\
    <strong class='chatter_name'>" + data.aname + "</strong>"+data.msg+"</span>";
    $('.chatter_convo').append(thisChatHtml);
    fitChat();
  });

  socket.on("botsReply",function(data) {
    renderNormalChat(data);
    var thisChatHtml = "<span class='chatter_msg_item botsReply chatter_msg_item_admin clearfix'>\
    <span class='chatter_avatar'><img src='"+data.apic+"' /></span>\
    <strong class='chatter_name'>" + data.aname + "</strong>"+data.msg+"</span>";
    $('.chatter_convo').append(thisChatHtml);
    fitChat();
  });

  socket.on("adminEndedYes", function(data) {
    // $('.chatter_post_signup').slideDown();
    $('#chatter_create_user').hide();
    $('.chatter_post_signup').hide();
    $('.chatter_feedback').show();
  });

  // $('#chatter_create_user').hide();
  // $('.chatter_post_signup').hide();
  // $('.chatter_feedback').show();

  $('#sendfeedback').click(function(e) {
    e.preventDefault();
    var chatter_name = $('#chatter_name').val(),
    chatter_email = $('#chatter_email').val(),
    chat_sub = $('#chat_sub').val(),
    feedback = $('#feedbacktxt').val();

    if(feedback == ""){
      $('#feedbacktxt').val('Feedback cant be empty');
      $('#feedbacktxt').addClass('red');
      setTimeout(function() {
        $('#feedbacktxt').removeClass('red');
        $('#feedbacktxt').val('');
      }, 1000);
      return;
    }
    var userdata = {
      "chatter_name": chatter_name,
      "chatter_email": chatter_email,
      "chat_sub": chat_sub,
      "feedback": feedback
    };
    socket.emit('userFeedback', userdata, function(data) {
      console.log('success');
    });
    store.clear();
    $('.chatter_feedback').hide();
    $('.chatter_pre_signup').css('display', "block");
  });
});


function renderNormalChat(data) {
  return data;
}

$(function() {
  var availableTutorials = [
    "/help",
    "/whoami",
    "/purchases",
    "/orderstatus",
  ];
  $( "#chatter_message" ).autocomplete({
    source: availableTutorials
  });
});
