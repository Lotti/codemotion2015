var debug = true;

var gameDiv = "game";
var gameWidth = parseInt(document.getElementById(gameDiv).offsetWidth);
var gameHeight = parseInt(document.getElementById(gameDiv).offsetHeight);

var game = new Phaser.Game(gameWidth, gameHeight, debug ? Phaser.CANVAS : Phaser.AUTO, gameDiv, null, false, false);
var players = [];
var sprites;
var ball;
var ballPositionLabel;

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

        game.physics.startSystem(Phaser.Physics.ARCADE);

        sprites = game.add.group();

        ball = sprites.create(game.width/2,game.height/2,'pixel');
        ball.name = 'ball';
        ball.scale.setTo(10,10);
        ball.anchor.setTo(10,10);
        game.physics.enable( [ ball ], Phaser.Physics.ARCADE);
        ball.body.velocity.x = game.rnd.integerInRange(-200, 200);
        ball.body.velocity.y = game.rnd.integerInRange(-200, 200);
        ball.body.bounce.x = 1;
        ball.body.bounce.y = 1;
        ball.body.minBounceVelocity = 0;
        ball.player = -1;

        players.push(sprites.create(game.width/2, 0, 'pixel'));
        players.push(sprites.create(0, game.height/2, 'pixel'));
        players.push(sprites.create(game.width/2, game.height - 5, 'pixel'));
        players.push(sprites.create(game.width - 5, game.height/2, 'pixel'));

        players[0].tint = 0xff0000;
        players[1].tint = 0x00ff00;
        players[2].tint = 0x0000ff;
        players[3].tint = 0xffff00;

        for(var i in players) {
            players[i].player = i;
            players[i].name = 'player' + (i + 1);
            if (i%2 == 0) {
                players[i].scale.setTo(50, 10);
            }
            else {
                players[i].scale.setTo(10, 50);
            }
            players[i].anchor.setTo(0.5, 0.5);
            game.physics.enable([ players[i] ], Phaser.Physics.ARCADE);
            players[i].body.bounce.x = 1;
            players[i].body.bounce.y = 1;
            players[i].body.minBounceVelocity = 0;
            players[i].body.immovable = true;
        }

        sprites.setAll('body.collideWorldBounds', true);

        var scoresPos = [
            { w: game.world.centerX, h: game.world.centerY-100 },
            { w: game.world.centerX-100, h: game.world.centerY },
            { w: game.world.centerX, h: game.world.centerY+100 },
            { w: game.world.centerX+100, h: game.world.centerY }
        ];

        for(var i in players) {
            var style = {font: "50px Arial", fill: "#"+colors[i], align: "center"};
            players[i].scoreLabel = game.add.text(scoresPos[i].w, scoresPos[i].h, "0", style);
            players[i].scoreLabel.anchor.setTo(0.5,0.5);
        }
    },
    update: function() {
        game.physics.arcade.collide(ball, players, function (ball,player) {
            ball.tint = player.tint;
            ball.player = player.player;
        });
        this.checkScore();
        this.updateServer();
    },
    checkScore: function() {
        if (ball.body.y < 1) {
            if (ball.player == -1 || ball.player == 0) {
                players[0].scoreLabel.text--;
            }
            else {
                players[ball.player].scoreLabel.text++;
            }
        }
        else if (ball.body.y > game.world.height - ball.body.height - 1) {
            if (ball.player == -1 || ball.player == 2) {
                players[2].scoreLabel.text--;
            }
            else {
                players[ball.player].scoreLabel.text++;
            }
        }
        else if (ball.body.x < 1) {
            if (ball.player == -1 || ball.player == 1) {
                players[1].scoreLabel.text--;
            }
            else {
                players[ball.player].scoreLabel.text++;
            }
        }
        else if (ball.body.x > game.world.width - ball.body.width - 1) {
            if (ball.player == -1 || ball.player == 3) {
                players[3].scoreLabel.text--;
            }
            else {
                players[ball.player].scoreLabel.text++;
            }
        }

        for(var i in players) {
            if (players[i].scoreLabel.text > 9) {
                this.endGame(players[i]);
            }
        }
    },
    endGame: function(player) {
        ball.body.velocity.setTo(0,0);
        var style = {font: "50px Arial", fill: "#ffffff", align: "center"};
        var text = game.add.text(game.world.centerX, game.world.centerY, player.name+" wins!", style);
        text.anchor.setTo(0.5,0.5);
    },
    updateServer: function() {
        for(var i in players) {
            players[i].body.x;
            players[i].body.y;
            players[i].scoreLabel.text;
        }
        ball.body.x;
        ball.body.y;
    },
    render: function() {
        if (debug) {
            game.debug.body(ball);
            for(var i in players) {
                game.debug.body(players[i]);
            }
        }
    }
};

var GameState = {
    create: function() {

        game.add.sprite(0, 0, 'sprite');



        //game.physics.startSystem(Phaser.Physics.ARCADE);
        //game.physics.arcade.gravity.y = 250;

        /*
         block = game.add.sprite(0,0,'block');
         block.exists = false;

         background = game.add.tileSprite(0, 0, game.world.width, game.world.height, 'soil');
         background.fixedToCamera = true;

         gems = game.add.group();
         platforms = game.add.group();
         rocks = game.add.group();

         this.text();

         mummy = game.add.sprite(0, game.world.height - block.height*6, 'mummy');
         mummy.name = 'mummy';
         mummy.lifes = 3;
         mummy.hit = 0;

         mummy.animationSpeed = 15;
         mummy.walkSpeed = 5;
         mummy.jumpSpeed = 150;

         //Here we add a new animation called 'walk'
         //Because we didn't give any other parameters it's going to make an animation from all available frames in the 'mummy' sprite sheet
         mummy.animations.add('walk');

         game.physics.arcade.enable(mummy);
         mummy.anchor.setTo(.5,.5);
         mummy.body.bounce.y = 0.05;
         mummy.body.setSize(mummy.width*0.5,mummy.height,0,0);
         mummy.body.collideWorldBounds = true;
         mummy.body.maxVelocity.set(30, 10000);

         game.camera.follow(mummy);

         drawPlatform(game, block, platformData[0], game.world.height - block.height*6);
         */
    },
    update: function() {
        /*
         if (gameover) {

         message.setText("Game Over!");

         mummy.body.velocity.x = 0;
         mummy.body.velocity.y = 0;
         mummy.body.angularVelocity = 0;
         mummy.body.allowGravity = false;
         mummy.body.immovable = true;
         mummy.animations.stop();

         rocks.forEach(function(e) {
         e.body.velocity.x = 0;
         e.body.velocity.y = 0;
         e.body.angularVelocity = 0;
         e.body.allowGravity = false;
         e.body.immovable = true;
         });

         if (game.input.keyboard.isDown(Phaser.Keyboard.SPACEBAR) || game.input.activePointer.isDown) {
         this.restart();
         }
         }
         else {
         if (mummy.lifes <= 0) {
         gameover = true;
         }

         //gem "no-physics" collision
         if (gems != null) {
         gems.forEach(function(e) {
         if (e != undefined && e.exists && Phaser.Rectangle.intersects(mummy.getBounds(), e.getBounds())) {
         e.kill();
         points.p+=5;
         }
         });
         }

         //mummy collisions
         game.physics.arcade.collide(mummy, [platforms, rocks], function(mummy, o) {
         if (mummy != undefined && o != undefined) {
         if (o.name == "rock") {
         if (!mummy.hit) {
         mummy.lifes--;
         if (mummy.lifes > 0) {
         mummy.hit = 1;
         game.time.events.repeat(Phaser.Timer.SECOND * 0.15, 10, function() {
         mummy.visible = !mummy.visible;
         mummy.hit++;
         if (mummy.hit > 10) {
         mummy.hit = 0;
         mummy.visible = true;
         }
         }, this);
         }
         }
         }
         }
         });

         //rocks collisions
         game.physics.arcade.collide(rocks, [gems,platforms,rocks], function(rock, o) {
         if (rock != undefined && o != undefined) {
         if (o.name == "gem") {
         o.kill();
         }
         else if (o.name == "block") {
         o.kill();

         if (rock.particles == undefined) {
         rock.particles = game.add.emitter(0, 0, 100);
         rock.particles.makeParticles('dot');
         //rock.particles.scale.setTo(0.25,0.25);
         rock.particles.gravity = 250;
         }

         rock.particles.x = rock.x;
         rock.particles.y = rock.y;
         rock.particles.start(true, 2000, null, 4);
         rock.scale.setTo(rock.scale.x*0.8,rock.scale.y*0.8);
         rock.lifes--;
         if (rock.lifes <= 0) {
         rock.kill();
         }
         }
         }
         });


         //user input!
         var clickOnLeft = false;
         var clickOnRight = false;
         var clickOnTop = false;
         if (game.input.activePointer.isDown) {
         if (game.input.activePointer.x < game.width*0.5) {
         clickOnLeft = true;
         }
         else if (game.input.activePointer.x > game.width*0.5) {
         clickOnRight = true;
         }

         if (game.input.activePointer.y < game.height*0.5) {
         clickOnTop = true;
         }
         }

         if (clickOnLeft || game.input.keyboard.isDown(Phaser.Keyboard.LEFT)) {
         mummy.animations.play("walk",mummy.animationSpeed);
         mummy.scale.x = -Math.abs(mummy.scale.x); //flip the sprite

         mummy.body.velocity.x-= mummy.walkSpeed;
         }
         else if (clickOnRight || game.input.keyboard.isDown(Phaser.Keyboard.RIGHT)) {
         mummy.animations.play("walk",mummy.animationSpeed);
         mummy.scale.x = Math.abs(mummy.scale.x); //undo sprite flipping

         mummy.body.velocity.x+= mummy.walkSpeed;
         }
         else {
         mummy.body.velocity.x = 0;
         mummy.animations.stop();
         mummy.frame = 15;
         }

         if (!jumpPressed && (clickOnTop || game.input.keyboard.isDown(Phaser.Keyboard.SPACEBAR)) && mummy.body.touching.down) {
         jumpPressed = true;
         mummy.body.velocity.y-= mummy.jumpSpeed;
         }

         if (!game.input.keyboard.isDown(Phaser.Keyboard.SPACEBAR)) {
         jumpPressed = false;
         }

         //load next platforms!
         if (mummy.body.y+mummy.body.height > game.world.height - block.height*7) {
         var rnd;
         do {
         rnd = game.rnd.integerInRange(0,platformData.length-1);
         }
         while(lastRandomLevel == rnd);
         lastRandomLevel = rnd;

         drawPlatform(game, block, platformData[lastRandomLevel]);
         if (started) {
         points.p++;
         drawRocks(game, block);
         }
         game.world.setBounds(0,0,game.world.width, game.world.height+block.height*7);
         started = true;

         this.cleanUp();
         }
         }
         */
    },
    cleanUp: function() {
        /*
         //cleaning routines (remove lower rocks)
         rocks.forEachExists(function(e) {
         if (e != undefined && !e.inCamera && e.y+block.height > game.camera.y + game.camera.height) {
         e.kill();
         }
         });

         //cleaning routines (remove upper platforms)
         platforms.forEachExists(function (e) {
         if (e != undefined && !e.inCamera && e.y+block.height < game.camera.y*1.5) {
         e.kill();
         }
         });

         //cleaning routines (remove upper gems)
         gems.forEachExists(function (e) {
         if (e != undefined && !e.inCamera && e.y+block.height < game.camera.y*1.5) {
         e.kill();
         }
         });

         gems.forEach(function(e) {
         if (e != undefined) {
         if (!e.exists) {
         gems.remove(e);
         e.destroy();
         }
         }
         });
         rocks.forEach(function(e) {
         if (e != undefined) {
         if (!e.exists) {

         if (e.particles != undefined) {
         e.particles.destroy();
         }
         rocks.remove(e);
         e.destroy();
         }
         }
         });
         platforms.forEach(function (e) {
         if (e != undefined) {
         if (!e.exists) {
         platforms.remove(e);
         e.destroy();
         }
         }
         });
         */
    },
    restart: function() {
        /*
         started = false;
         gameover = false;
         jumpTimer = 0;
         jumpPressed = false;
         */

        game.state.start("game",true,false);
    },
    text: function() {
        /*
         //if (debug) {
         game.time.advancedTiming = true;
         fps = game.add.text(5, 2.5, '', { font: '20px Verdana', fill: '#FFFFFF', align: 'left' });
         fps.fixedToCamera = true;
         fps.update = function() {
         fps.setText(game.time.fps+' fps');
         }
         //}

         message = game.add.text(game.world.width*.4, 2.5, '', { font: '20px Verdana', fill: '#FFFFFF', align: 'left' });
         message.update = function() {
         var t = 'lives: ';
         for(var i = 0; i<mummy.lifes; i++) {
         t+= '*';
         }
         message.setText(t);
         }
         message.fixedToCamera = true;

         points = game.add.text(game.world.width-5, 2.5, '0 points', { font: '20px Verdana', fill: '#FFFFFF', align: 'left' });
         points.fixedToCamera = true;
         points.p = 0;
         points.update = function() {
         points.pivot.x = points.width;
         points.pivot.y = 0;
         points.setText(points.p+' points');
         }
         */
    }
};


game.state.add("boot", BootState, true);
game.state.add("preload", LoadingState, false);
game.state.add("game", GameState, false);

window.onkeypress = function(e) {
    if (e.keyCode == 114) {
        game.state.start("game",true,false);
    }
};





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