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
  return null;
}

let username= decodeURI(getIRIParameterValue('username'));
if ((typeof username == 'undefined') || (username === null) || (username=== 'null') || (username=== "") ) {
    username= "Anonymous_" + Math.floor(Math.random() * 1000);
}

let chatRoom= decodeURI(getIRIParameterValue('game_id'));
if ((typeof chatRoom == 'undefined') || (chatRoom === null) || (chatRoom=== 'null') ) {
    chatRoom= "Lobby";
}

/* Set up the socket.io connection to the server */
let socket = io();
socket.on('log', function(array) { 
    console.log.apply(console,array)
});

function makeInviteButton(socket_id) {
    let newHTML= "<button type='button' class='btn btn-outline-primary'>Invite</button>";
    let newNode= $(newHTML);
    newNode.click( () => { 
      let payload= {
          requested_user:socket_id
      }
      console.log('**** Client log message, sending \'invite\' command: ' + JSON.stringify(payload));
      socket.emit('invite', payload);
    }
    );
    return newNode;
}

function makeInvitedButton(socket_id) {
    let newHTML= "<button type='button' class='btn btn-outline-primary'>Invite</button>";
    let newNode= $(newHTML);
    newNode.click( () => { 
      let payload= {
          requested_user:socket_id
      }
      console.log('**** Client log message, sending \'uninvite\' command: ' + JSON.stringify(payload));
      socket.emit('uninvite', payload);
    }
    );
    return newNode;
}

function makePlayButton(socket_id) {
    let newHTML= "<button type='button' class='btn btn-success'>Play</button>";
    let newNode= $(newHTML);
    newNode.click( () => { 
        let payload= {
            requested_user: socket_id
        }
        console.log('**** Client log message, sending \'game_start\' command: ' + JSON.stringify(payload));
        socket.emit('game_start', payload);
      }
      );
    return newNode;
}

function makeStartGameButton() {
    let newHTML= "<button type='button' class='btn btn-danger'>Starting Game</button>";
    let newNode= $(newHTML);
    return newNode;
}


socket.on('invite_response', (payload) => {
    if((typeof payload == 'undefined') || (payload === null)) {
        console.log("Server did not send a payload");
        return;
    }
    if(payload.result === 'fail') {
        console.log(payload.message);
        return;
    }
    let newNode= makeInvitedButton(payload.socket_id);
    $('.socket_' + payload.socket_id + '  button').replaceWith(newNode);
})

socket.on('invited', (payload) => {
    if((typeof payload == 'undefined') || (payload === null)) {
        console.log("Server did not send a payload");
        return;
    }
    if(payload.result === 'fail') {
        console.log(payload.message);
        return;
    }
    let newNode= makePlayButton(payload.socket_id);
    $('.socket_' + payload.socket_id + '  button').replaceWith(newNode);
})

socket.on('uninvited', (payload) => {
    if((typeof payload == 'undefined') || (payload === null)) {
        console.log("Server did not send a payload");
        return;
    }
    if(payload.result === 'fail') {
        console.log(payload.message);
        return;
    }
    let newNode= makeInviteButton(payload.socket_id);
    $('.socket_' + payload.socket_id + '  button').replaceWith(newNode);
})

socket.on('game_start_response', (payload) => {
    if((typeof payload == 'undefined') || (payload === null)) {
        console.log("Server did not send a payload");
        return;
    }
    if(payload.result === 'fail') {
        console.log(payload.message);
        return;
    }
    let newNode= makeStartGameButton();
    $('.socket_' + payload.socket_id + '  button').replaceWith(newNode);
    /* Jump to the game page */
    window.location.href= 'game.html?username=' + username + '&game_id=' + payload.game_id;
})

socket.on('join_room_response', (payload) => {
    if ((typeof payload == 'undefined') || (payload === null)) {
        console.log("Server did not send a payload");
        return;
    }
    if (payload.result === 'fail') {
        console.log(payload.message);
        return;
    }

    /* of we are being notified of ourselves then ignore the message and return */
    if(payload.socket_id === socket.id) {
        return;
    }

    let domElements= $('.socket_' + payload.socket_id);
    /* if we are being repeat notified then return */
    if (domElements.length !== 0){
        return;
    }

    /*
        <div class="row align-items-center">
          <div class="col text-end">
            Don
          </div>
          <div class= "col text-end">
            <button type= "button" class="btn btn-primary">Invite</button>
          </div>
        </div>
    */
    let nodeA= $("<div></div>");
    nodeA.addClass("row");
    nodeA.addClass("align-items-center");
    nodeA.addClass("socket_" + payload.socket_id);
    nodeA.hide();

    let nodeB= $("<div></div>");
    nodeB.addClass("col");
    nodeB.addClass("text-end");
    nodeB.addClass("socket_" + payload.socket_id);
    nodeB.append('<h4>' + payload.username + '</h4>');

    let nodeC= $("<div></div>");
    nodeC.addClass("col");
    nodeC.addClass("text-start");
    nodeC.addClass("socket_" + payload.socket_id);
    let buttonC= makeInviteButton(payload.socket_id);
    nodeC.append(buttonC);

    nodeA.append(nodeB);
    nodeA.append(nodeC);

    $("#players").append(nodeA);
    nodeA.show("fade", 1000);

    /* Announces new member */
    let newHTML= '<p class=\'join_room_response\'>' + payload.username + ' joined the chatroom (There are ' + payload.count + ' user(s) in this room)</p>';
    let newNode= $(newHTML);
    newNode.hide();
    $('#messages').prepend(newNode);
    newNode.show("fade", 500);
})

socket.on('player_disconnected', (payload) => {
    if((typeof payload == 'undefined') || (payload === null)) {
        console.log("Server did not send a payload");
        return;
    }

    if(payload.socket_id === socket.id) {
        return;
    }

    let domElements= $('.socket_' + payload.socket_id);
    if (domElements.length !== 0) {
        domElements.hide("fade", 500);
    }

    let newHTML= '<p class=\'left_room_response\'>' + payload.username + ' left the ' + payload.room + ' (There are ' + payload.count + ' user(s) in this room)</p>';
    let newNode= $(newHTML);
    newNode.hide();
    $('#messages').prepend(newNode);
    newNode.show('fade', 500);
})

function sendChatMessage() {
    let request= {};
    request.room= chatRoom;
    request.username= username;
    request.message= $('#chatMessage').val();
    console.log('**** Client log message, sending \'send_chat_message\' command: ' + JSON.stringify(request));
    socket.emit('send_chat_message', request);
    $('#chatMessage').val("");
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
    let newHTML= '<p class=\'chat_message\'><b>' + payload.username + '</b>: ' + payload.message + '</p>';
    let newNode= $(newHTML);
    newNode.hide();
    $('#messages').prepend(newNode);
    newNode.show("fade", 500);
})

let old_board= [
    ['?', '?','?','?','?','?','?','?'],
    ['?', '?','?','?','?','?','?','?'],
    ['?', '?','?','?','?','?','?','?'],
    ['?', '?','?','?','?','?','?','?'],
    ['?', '?','?','?','?','?','?','?'],
    ['?', '?','?','?','?','?','?','?'],
    ['?', '?','?','?','?','?','?','?'],
    ['?', '?','?','?','?','?','?','?']
];

let my_color="";

socket.on('game_update', (payload) => {
    if((typeof payload == 'undefined') || (payload === null)) {
        console.log("Server did not send a payload");
        return;
    }
    if(payload.result === 'fail') {
        console.log(payload.message);
        return;
    }

    let board= payload.game.board;
    if((typeof board == 'undefined') || (board === null)) {
        console.log('Server did not send a valid board to display');
        return;
    }

    /* Update my color */
    if (socket.id === payload.game.player_white.socket)  {
        my_color= 'white';
    }
    else if (socket.id === payload.game.player_black.socket)  {
        my_color= 'black';
    }
    else {
        window.location.href= 'lobby.html?username=' + username;
        return;
    }

    $("#my_color").html('<h3 id="my_color">I am ' + my_color + '</h3>');

    whitesum= 0;
    blacksum= 0;


    /* Animate changes to the board */
    for (let row=0; row < 8; row++) {
        for(let column= 0; column < 8; column++) {
            if (board[row][column] === 'w') {
                whitesum++;
            }
            else if (board[row][column] === 'b') {
                blacksum++;
            }

            if(old_board[row][column] != board[row][column]) {
                let graphic= "";
                let altTag= "";
                if((old_board[row][column] === '?') && (board[row][column] === ' ')) {
                    graphic= "whiteEmpty.png";
                    altTag= "empty space";
                }
                else if((old_board[row][column] === '?') && (board[row][column] === 'w')) {
                    graphic= "empty_to_white.gif";
                    altTag= "white token";
                }
                else if((old_board[row][column] === '?') && (board[row][column] === 'b')) {
                    graphic= "empty_to_black.gif";
                    altTag= "black token";
                }
                else if((old_board[row][column] === ' ') && (board[row][column] === 'w')) {
                    graphic= "empty_to_white.gif";
                    altTag= "white token";
                }
                else if((old_board[row][column] === ' ') && (board[row][column] === 'b')) {
                    graphic= "empty_to_black.gif";
                    altTag= "black token";
                }
                else if((old_board[row][column] === 'w') && (board[row][column] === ' ')) {
                    graphic= "empty.gif";
                    altTag= "empty space";
                }
                else if((old_board[row][column] === 'b') && (board[row][column] === ' ')) {
                    graphic= "empty.gif";
                    altTag= "empty space";
                }
                else if((old_board[row][column] === 'w') && (board[row][column] === 'b')) {
                    graphic= "white_to_black.gif";
                    altTag= "black token";
                }
                else if((old_board[row][column] === 'b') && (board[row][column] === 'w')) {
                    graphic= "black_to_white.gif";
                    altTag= "white token";
                }
                else {
                    graphic= "error.gif";
                    altTag= "error";
                }

                const t= Date.now();
                $('#' + row + '_' + column).html('<img class="img-fluid" src="assets/images/' + graphic + '?time=' + t + '" alt="' + altTag + '" />');
                
                $('#' + row + '_' + column).off('click');
                if(board[row][column] === ' ') {
                    $('#' + row + '_' + column).addClass('hovered_over');
                    $('#' + row + '_' + column).click(((r,c) => {
                        return(() => {
                            let payload= {
                                row: r,
                                column: c,
                                color: my_color
                            };
                            console.log('**** Client log message, sending \'play_token\' command: ' + JSON.stringify(payload));
                            socket.emit('play_token', payload);

                        });
                    })(row, column));
                }
                else {
                    $('#' + row + '_' + column).removeClass('hovered_over');
                }
            }
        }
    }
    $("#whitesum").html(whitesum);
    $("#blacksum").html(blacksum);

    old_board= board;
})

socket.on('play_token_response', (payload) => {
    if((typeof payload == 'undefined') || (payload === null)) {
        console.log("Server did not send a payload");
        return;
    }
    if(payload.result === 'fail') {
        console.log(payload.message);
        return;
    }
})

socket.on('game_over', (payload) => {
    if((typeof payload == 'undefined') || (payload === null)) {
        console.log("Server did not send a payload");
        return;
    }
    if(payload.result === 'fail') {
        console.log(payload.message);
        return;
    }

    /* Announce with a button to the lobby */
    let nodeA= $("<div id='game_over'></div>");
    let nodeB= $("<h1>Game Over</h1>");
    let nodeC= $("<h2>" + payload.who_won + " won!</h2>");
    let nodeD= $("<a href='lobby.html?username=" + username + "'class='btn btn-lg btn-success' role='button'>Return to lobby</a>");
    nodeA.append(nodeB);
    nodeA.append(nodeC);
    nodeA.append(nodeD);
    nodeA.hide();
    $('#game_over').replaceWith(nodeA);
    nodeA.show("fade", 1000);
})

/* Set up the socket.io connection to the server */
$( () => {
    let request= {};
    request.room= chatRoom;
    request.username= username;
    console.log('**** Client log message, sending \'join_room\' command: ' + JSON.stringify(request));
    socket.emit('join_room', request);

    $('#lobbyTitle').html(username + "'s Lobby");
    $('#quit').html("<a href='lobby.html?username=" + username + "'class='btn btn-lg btn-danger' role='button'>Quit</a>");


    $('#chatMessage').keypress( function (e)  {
        let key= e.which;
        if (key === 13) {
          $('button[id= chatButton]').click();
          return false;
        }
    })

   
});

