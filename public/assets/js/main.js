function getIRIParameterValue(requestedKey) {
  let pageIRI= window.location.search.substring(1);
  let pageIRIVariables= pageIRI.split('&');
  for(let i=0; i < pageIRIVariables.length; i++) {
      let data= pageIRIVariables[i].split('=');
      let key= data[0];
      let value= data[1];

      if(key === requestedKey) {
          return value;
      }
  }
}

let username= decodeURI(getIRIParameterValue('username'));
if ((typeof username == 'undefined') || (username === null)) {
    username= "Anonymous_" + Math.floor(Math.random() * 1000);
}

let chatRoom= 'Lobby';

/* Set up the socket.io connection to the server */
let socket = io();
socket.on('log', function(array) { 
    console.log.apply(console,array)
});

socket.on('join_room_response', (payload) => {
    if((typeof payload == 'undefined') || (payload === null)) {
        console.log("Server did not send a payload");
        return;
    }
    if(payload.result === 'fail') {
        console.log(payload.message);
        return;
    }
    let newString= '<p class=\'join_room_response\'>' + payload.username + ' joined the ' + payload.room + ' (There are ' + payload.count + ' user(s) in this room)</p>';

    $('#messages').prepend(newString);
})

function sendChatMessage() {
    let request= {};
    request.room= chatRoom;
    request.username= username;
    request.message= $('#chatMessage').val();
    console.log('**** Client log message, sending \'send_chat_message\' command: ' + JSON.stringify(request));
    socket.emit('send_chat_message', request);
}

socket.on('send_chat_message_response', (payload) => {
    if((typeof payload == 'undefined') || (payload === null)) {
        console.log("Server did not send a payload");
        return;
    }
    if(payload.result === 'fail') {
        console.log(payload.message);
        return;
    }
    let newString= '<p class=\'chat_message\'><b>' + payload.username + '</b>: ' + payload.message + '</p>';

    $('#messages').prepend(newString);
})

/* Set up the socket.io connection to the server */
$( () => {
    let request= {};
    request.room= chatRoom;
    request.username= username;
    console.log('**** Client log message, sending \'join_room\' command: ' + JSON.stringify(request));
    socket.emit('join_room', request);
});

