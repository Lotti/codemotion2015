var debug = true;

var gameDiv = "game";
var gameWidth = parseInt(document.getElementById(gameDiv).offsetWidth);
var gameHeight = parseInt(document.getElementById(gameDiv).offsetHeight);

var game = new Phaser.Game(gameWidth, gameHeight, debug ? Phaser.CANVAS : Phaser.AUTO, gameDiv, null, false, false);
var players = [];
var sprites;
var ball;

var player = (debug == true ? 0 : -1);
var master = false;//(player == 0);


var colors = [ "ff0000", "00ff00", "0000ff", "ffff00"];

var BootState = {
    preload: function() {
        game.load.image('loadingBar', 'res/textures/loading.png');
    },
    create: function() {
        game.state.start('preload');
    }
};

var LoadingState = {
    preload: function() {
        this.loadingBar = game.add.sprite(0, 0, 'loadingBar');
        // Center the preload bar
        this.loadingBar.x = game.world.centerX - this.loadingBar.width / 2;
        this.loadingBar.y = game.world.centerY - this.loadingBar.height / 2;
        game.load.setPreloadSprite(this.loadingBar);

        game.load.image('pixel', 'res/sprites/pixel.png');
    },
    create: function() {
        this.loadingBar.destroy();
        this.cursors = game.input.keyboard.createCursorKeys();

        game.physics.startSystem(Phaser.Physics.ARCADE);

        sprites = game.add.group();

        this.ball = sprites.create(game.width/2,game.height/2,'pixel');
        this.ball.name = 'ball';
        this.ball.scale.setTo(10,10);
        this.ball.anchor.setTo(0.5,0.5);

        game.physics.enable([this.ball], Phaser.Physics.ARCADE);
        this.ball.body.velocity.x = game.rnd.integerInRange(-200, 200);
        this.ball.body.velocity.y = game.rnd.integerInRange(-200, 200);
        this.ball.body.bounce.x = 1;
        this.ball.body.bounce.y = 1;
        this.ball.body.minBounceVelocity = 0;
        this.ball.player = -1;

        this.players = [];
        this.players.push(sprites.create(game.width/2, 5, 'pixel'));
        this.players.push(sprites.create(5, game.height/2, 'pixel'));
        this.players.push(sprites.create(game.width/2, game.height - 5, 'pixel'));
        this.players.push(sprites.create(game.width - 5, game.height/2, 'pixel'));

        this.players[0].tint = 0xff0000;
        this.players[1].tint = 0x00ff00;
        this.players[2].tint = 0x0000ff;
        this.players[3].tint = 0xffff00;

        for(var i in this.players) {
            this.players[i].player = i;
            this.players[i].name = 'player' + (i + 1);
            if (i%2 == 0) {
                this.players[i].scale.setTo(50, 10);
            }
            else {
                this.players[i].scale.setTo(10, 50);
            }
            this.players[i].anchor.setTo(0.5, 0.5);
            game.physics.enable([this.players[i]], Phaser.Physics.ARCADE);
            this.players[i].body.bounce.x = 1;
            this.players[i].body.bounce.y = 1;
            this.players[i].body.minBounceVelocity = 0;
            this.players[i].body.immovable = true;
        }

        sprites.setAll('body.collideWorldBounds', true);
    },
    update: function () {
        game.physics.arcade.collide(this.ball, this.players, function (ball, player) {
            ball.tint = player.tint;
        });

        this.inputManagement();
    },
    inputManagement: function() {
        for(var i in this.players) {
            var p = this.players[i];
            var pH2 = p.body.height;
            var pW2 = p.body.width;
            switch (parseInt(i)) {
                case 0:
                case 2:
                    if (this.ball.body.x <= game.world.width - pW2) {
                        p.position.x = this.ball.position.x;
                    }
                    break;
                case 1:
                case 3:
                    if (this.ball.body.y <= game.world.height - pH2) {
                        p.position.y = this.ball.position.y;
                    }
                    break;
            }
        }
    }
};

var SynchState = {
    players: 0,
    countdown: false,
    preload: function() {
        var style = {font: "40px Arial", fill: "#ffffff", align: "center"};
        this.text = game.add.text(game.world.centerX, game.world.centerY, "Awaiting other players ("+this.players+")", style);
        this.text.anchor.setTo(0.5,0.5);
    },
    create: function() {
    },
    update: function () {
        if (this.countdown) {
            this.text.text = "Starting in ";
        }
        else {
            this.text.text = "Awaiting other players (" + this.players + ")";
        }
    }
};

var GameState = {
    preload: function() {
        this.cursors = game.input.keyboard.createCursorKeys();
    },
    create: function() {
        if (master) {
            game.physics.startSystem(Phaser.Physics.ARCADE);
        }

        sprites = game.add.group();

        this.ball = sprites.create(game.width/2,game.height/2,'pixel');
        this.ball.name = 'ball';
        this.ball.scale.setTo(10,10);
        this.ball.anchor.setTo(0.5,0.5);

        if (master) {
            game.physics.enable([this.ball], Phaser.Physics.ARCADE);
            this.ball.body.velocity.x = game.rnd.integerInRange(-200, 200);
            this.ball.body.velocity.y = game.rnd.integerInRange(-200, 200);
            this.ball.body.bounce.x = 1;
            this.ball.body.bounce.y = 1;
            this.ball.body.minBounceVelocity = 0;
            this.ball.player = -1;
        }

        this.players = [];
        this.players.push(sprites.create(game.width/2, 5, 'pixel'));
        this.players.push(sprites.create(5, game.height/2, 'pixel'));
        this.players.push(sprites.create(game.width/2, game.height - 5, 'pixel'));
        this.players.push(sprites.create(game.width - 5, game.height/2, 'pixel'));

        this.players[0].tint = 0xff0000;
        this.players[1].tint = 0x00ff00;
        this.players[2].tint = 0x0000ff;
        this.players[3].tint = 0xffff00;

        for(var i in this.players) {
            this.players[i].player = i;
            this.players[i].name = 'player' + (i + 1);
            if (i%2 == 0) {
                this.players[i].scale.setTo(50, 10);
            }
            else {
                this.players[i].scale.setTo(10, 50);
            }
            this.players[i].anchor.setTo(0.5, 0.5);
            if (master) {
                game.physics.enable([this.players[i]], Phaser.Physics.ARCADE);
                this.players[i].body.bounce.x = 1;
                this.players[i].body.bounce.y = 1;
                this.players[i].body.minBounceVelocity = 0;
                this.players[i].body.immovable = true;
            }
        }

        if (master) {
            sprites.setAll('body.collideWorldBounds', true);
        }

        var scoresPos = [
            { w: game.world.centerX, h: game.world.centerY-100 },
            { w: game.world.centerX-100, h: game.world.centerY },
            { w: game.world.centerX, h: game.world.centerY+100 },
            { w: game.world.centerX+100, h: game.world.centerY }
        ];

        for(var i in this.players) {
            var style = {font: "50px Arial", fill: "#"+colors[i], align: "center"};
            this.players[i].scoreLabel = game.add.text(scoresPos[i].w, scoresPos[i].h, "0", style);
            this.players[i].scoreLabel.anchor.setTo(0.5,0.5);
        }
    },
    update: function() {
        if (master) {
            game.physics.arcade.collide(this.ball, this.players, function (ball, player) {
                ball.tint = player.tint;
                ball.player = player.player;
            });
            this.checkScore();
            //this.updateServer();
        }
        this.inputManagement();
    },
    checkScore: function() {
        var scored = false;
        if (this.ball.body.y < 1) {
            scored = true;
            if (this.ball.player == -1 || this.ball.player == 0) {
                this.players[0].scoreLabel.text--;
                scored = true;
            }
            else {
                this.players[this.ball.player].scoreLabel.text++;
            }
        }
        else if (this.ball.body.y > game.world.height - this.ball.body.height - 1) {
            scored = true;
            if (this.ball.player == -1 || this.ball.player == 2) {
                this.players[2].scoreLabel.text--;
            }
            else {
                this.players[this.ball.player].scoreLabel.text++;
            }
        }
        else if (this.ball.body.x < 1) {
            scored = true;
            if (this.ball.player == -1 || this.ball.player == 1) {
                this.players[1].scoreLabel.text--;
            }
            else {
                this.players[this.ball.player].scoreLabel.text++;
            }
        }
        else if (this.ball.body.x > game.world.width - this.ball.body.width - 1) {
            scored = true;
            if (this.ball.player == -1 || this.ball.player == 3) {
                this.players[3].scoreLabel.text--;
            }
            else {
                this.players[this.ball.player].scoreLabel.text++;
            }
        }

        if (scored) { //reset ball position
            this.ball.body.position.setTo(game.world.centerX, game.world.centerY);
        }

        for(var i in players) {
            if (this.players[i].scoreLabel.text > 9) {
                this.endGame(this.players[i]);
            }
        }
    },
    inputManagement: function() {
        var moveFactor = 2;
        if (this.cursors.left.isDown || this.cursors.up.isDown) {
            switch(player) {
                case 0:
                case 2:
                    this.players[player].position.x-=moveFactor;
                    break;
                case 1:
                case 3:
                    this.players[player].position.y-=moveFactor;
                    break;
            }
        }
        else if (this.cursors.right.isDown || this.cursors.down.isDown) {
            switch(player) {
                case 0:
                case 2:
                    this.players[player].position.x+=moveFactor;
                    break;
                case 1:
                case 3:
                    this.players[player].position.y+=moveFactor;
                    break;
            }
        }
        else {
            switch(player) {
                case 0:
                case 2:
                    if (game.input.activePointer.x > this.players[player].position.x) {
                        this.players[player].position.x+=moveFactor;
                    }
                    else if (game.input.activePointer.x < this.players[player].position.x){
                        this.players[player].position.x-=moveFactor;
                    }
                    break;
                case 1:
                case 3:
                    if (game.input.activePointer.y > this.players[player].position.y) {
                        this.players[player].position.y+=moveFactor;
                    }
                    else if (game.input.activePointer.y < this.players[player].position.y){
                        this.players[player].position.y-=moveFactor;
                    }
                    break;
            }
        }
    },
    endGame: function(player) {
        this.ball.body.velocity.setTo(0,0);
        var style = {font: "50px Arial", fill: "#ffffff", align: "center"};
        var text = game.add.text(game.world.centerX, game.world.centerY, player.name+" wins!", style);
        text.anchor.setTo(0.5,0.5);
    },
    updateServer: function() {
        for(var i in players) {
            this.players[i].body.x;
            this.players[i].body.y;
            this.players[i].scoreLabel.text;
        }
        this.ball.body.x;
        this.ball.body.y;
    },
    render: function() {
         if (debug) {
             game.debug.body(this.ball);
             for(var i in this.players) {
                game.debug.body(this.players[i]);
             }
         }
    }
};


game.state.add("boot", BootState, true);
game.state.add("preload", LoadingState, false);
game.state.add("sync", SynchState, false);
game.state.add("game", GameState, false);

/*
 $(function() {
 var FADE_TIME = 150; // ms
 var TYPING_TIMER_LENGTH = 400; // ms
 var COLORS = [
 '#e21400', '#91580f', '#f8a700', '#f78b00',
 '#58dc00', '#287b00', '#a8f07a', '#4ae8c4',
 '#3b88eb', '#3824aa', '#a700ff', '#d300e7'
 ];

 // Initialize varibles
 var $window = $(window);
 var $usernameInput = $('.usernameInput'); // Input for username
 var $messages = $('.messages'); // Messages area
 var $inputMessage = $('.inputMessage'); // Input message input box

 var $loginPage = $('.login.page'); // The login page
 var $chatPage = $('.chat.page'); // The chatroom page

 // Prompt for setting a username
 var username;
 var connected = false;
 var typing = false;
 var lastTypingTime;
 var $currentInput = $usernameInput.focus();

 var socket = io();

 function addParticipantsMessage (data) {
 var message = '';
 if (data.numUsers === 1) {
 message += "there's 1 participant";
 } else {
 message += "there are " + data.numUsers + " participants";
 }
 log(message);
 }

 // Sets the client's username
 function setUsername () {
 username = cleanInput($usernameInput.val().trim());

 // If the username is valid
 if (username) {
 $loginPage.fadeOut();
 $chatPage.show();
 $loginPage.off('click');
 $currentInput = $inputMessage.focus();

 // Tell the server your username
 socket.emit('add user', username);
 }
 }

 // Sends a chat message
 function sendMessage () {
 var message = $inputMessage.val();
 // Prevent markup from being injected into the message
 message = cleanInput(message);
 // if there is a non-empty message and a socket connection
 if (message && connected) {
 $inputMessage.val('');
 addChatMessage({
 username: username,
 message: message
 });
 // tell server to execute 'new message' and send along one parameter
 socket.emit('new message', message);
 }
 }

 // Log a message
 function log (message, options) {
 var $el = $('<li>').addClass('log').text(message);
 addMessageElement($el, options);
 }

 // Adds the visual chat message to the message list
 function addChatMessage (data, options) {
 // Don't fade the message in if there is an 'X was typing'
 var $typingMessages = getTypingMessages(data);
 options = options || {};
 if ($typingMessages.length !== 0) {
 options.fade = false;
 $typingMessages.remove();
 }

 var $usernameDiv = $('<span class="username"/>')
 .text(data.username)
 .css('color', getUsernameColor(data.username));
 var $messageBodyDiv = $('<span class="messageBody">')
 .text(data.message);

 var typingClass = data.typing ? 'typing' : '';
 var $messageDiv = $('<li class="message"/>')
 .data('username', data.username)
 .addClass(typingClass)
 .append($usernameDiv, $messageBodyDiv);

 addMessageElement($messageDiv, options);
 }

 // Adds the visual chat typing message
 function addChatTyping (data) {
 data.typing = true;
 data.message = 'is typing';
 addChatMessage(data);
 }

 // Removes the visual chat typing message
 function removeChatTyping (data) {
 getTypingMessages(data).fadeOut(function () {
 $(this).remove();
 });
 }

 // Adds a message element to the messages and scrolls to the bottom
 // el - The element to add as a message
 // options.fade - If the element should fade-in (default = true)
 // options.prepend - If the element should prepend
 //   all other messages (default = false)
 function addMessageElement (el, options) {
 var $el = $(el);

 // Setup default options
 if (!options) {
 options = {};
 }
 if (typeof options.fade === 'undefined') {
 options.fade = true;
 }
 if (typeof options.prepend === 'undefined') {
 options.prepend = false;
 }

 // Apply options
 if (options.fade) {
 $el.hide().fadeIn(FADE_TIME);
 }
 if (options.prepend) {
 $messages.prepend($el);
 } else {
 $messages.append($el);
 }
 $messages[0].scrollTop = $messages[0].scrollHeight;
 }

 // Prevents input from having injected markup
 function cleanInput (input) {
 return $('<div/>').text(input).text();
 }

 // Updates the typing event
 function updateTyping () {
 if (connected) {
 if (!typing) {
 typing = true;
 socket.emit('typing');
 }
 lastTypingTime = (new Date()).getTime();

 setTimeout(function () {
 var typingTimer = (new Date()).getTime();
 var timeDiff = typingTimer - lastTypingTime;
 if (timeDiff >= TYPING_TIMER_LENGTH && typing) {
 socket.emit('stop typing');
 typing = false;
 }
 }, TYPING_TIMER_LENGTH);
 }
 }

 // Gets the 'X is typing' messages of a user
 function getTypingMessages (data) {
 return $('.typing.message').filter(function (i) {
 return $(this).data('username') === data.username;
 });
 }

 // Gets the color of a username through our hash function
 function getUsernameColor (username) {
 // Compute hash code
 var hash = 7;
 for (var i = 0; i < username.length; i++) {
 hash = username.charCodeAt(i) + (hash << 5) - hash;
 }
 // Calculate color
 var index = Math.abs(hash % COLORS.length);
 return COLORS[index];
 }

 // Keyboard events

 $window.keydown(function (event) {
 // Auto-focus the current input when a key is typed
 if (!(event.ctrlKey || event.metaKey || event.altKey)) {
 $currentInput.focus();
 }
 // When the client hits ENTER on their keyboard
 if (event.which === 13) {
 if (username) {
 sendMessage();
 socket.emit('stop typing');
 typing = false;
 } else {
 setUsername();
 }
 }
 });

 $inputMessage.on('input', function() {
 updateTyping();
 });

 // Click events

 // Focus input when clicking anywhere on login page
 $loginPage.click(function () {
 $currentInput.focus();
 });

 // Focus input when clicking on the message input's border
 $inputMessage.click(function () {
 $inputMessage.focus();
 });

 // Socket events

 // Whenever the server emits 'login', log the login message
 socket.on('login', function (data) {
 connected = true;
 // Display the welcome message
 var message = "Welcome to Socket.IO Chat – ";
 log(message, {
 prepend: true
 });
 addParticipantsMessage(data);
 });

 // Whenever the server emits 'new message', update the chat body
 socket.on('new message', function (data) {
 addChatMessage(data);
 });

 // Whenever the server emits 'user joined', log it in the chat body
 socket.on('user joined', function (data) {
 log(data.username + ' joined');
 addParticipantsMessage(data);
 });

 // Whenever the server emits 'user left', log it in the chat body
 socket.on('user left', function (data) {
 log(data.username + ' left');
 addParticipantsMessage(data);
 removeChatTyping(data);
 });

 // Whenever the server emits 'typing', show the typing message
 socket.on('typing', function (data) {
 addChatTyping(data);
 });

 // Whenever the server emits 'stop typing', kill the typing message
 socket.on('stop typing', function (data) {
 removeChatTyping(data);
 });
 });
 */