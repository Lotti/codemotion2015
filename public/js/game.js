function Pong() {
    var self = this;
    var socket = io();
    socket.on('disconnect', function(data) {
        var msg = 'Server went offline. Try again in few minutes!';
        console.error(msg+"\n"+data);
        window.alert(msg+"\n"+data);
        window.location.reload(true);
    });
    socket.on('error', function(data) {
        console.error(data);
        window.alert(data);
        window.location.reload(true);
    });
    socket.on('errorMsg', function(data) {
        console.error("[Error:"+data.num+"] "+data.msg);
        window.alert("Error "+data.num+"\n"+data.msg);
        window.location.reload(true);
    });

    var debug = true;

    var gameDiv = "game";
    var gameWidth = parseInt(document.getElementById(gameDiv).offsetWidth);
    var gameHeight = parseInt(document.getElementById(gameDiv).offsetHeight);

    var game = new Phaser.Game(gameWidth, gameHeight, debug ? Phaser.CANVAS : Phaser.AUTO, gameDiv, null, false, false);

    var host = false;
    var paddles = [];
    var sprites;
    var ball;

    var currentPlayer = -1;
    var master = false;
    var cursors;

    var colors = ["ff0000", "00ff00", "0000ff", "ffff00"];

    function demoMovements () {
        for (var i in paddles) {
            var p = paddles[i];
            var pH2 = p.body.height;
            var pW2 = p.body.width;
            switch (parseInt(i)) {
                case 0:
                case 2:
                    if (ball.body.x <= game.world.width - pW2) {
                        p.position.x = ball.position.x;
                    }
                    break;
                case 1:
                case 3:
                    if (ball.body.y <= game.world.height - pH2) {
                        p.position.y = ball.position.y;
                    }
                    break;
            }
        }
    }

    var BootState = {
        preload: function () {
            game.load.image('loadingBar', 'res/textures/loading.png');
        },
        create: function () {
            game.state.start('preload');
        }
    };

    var LoadingState = {
        preload: function () {
            this.loadingBar = game.add.sprite(0, 0, 'loadingBar');
            // Center the preload bar
            this.loadingBar.x = game.world.centerX - this.loadingBar.width / 2;
            this.loadingBar.y = game.world.centerY - this.loadingBar.height / 2;
            game.load.setPreloadSprite(this.loadingBar);

            game.load.image('pixel', 'res/sprites/pixel.png');
        },
        create: function () {
            this.loadingBar.destroy();

            game.physics.startSystem(Phaser.Physics.ARCADE);

            sprites = game.add.group();

            ball = sprites.create(game.width / 2, game.height / 2, 'pixel');
            ball.name = 'ball';
            ball.scale.setTo(10, 10);
            ball.anchor.setTo(0.5, 0.5);

            game.physics.enable([ball], Phaser.Physics.ARCADE);
            ball.body.velocity.x = game.rnd.integerInRange(-200, 200);
            ball.body.velocity.y = game.rnd.integerInRange(-200, 200);
            ball.body.bounce.x = 1;
            ball.body.bounce.y = 1;
            ball.body.minBounceVelocity = 0;
            ball.player = -1;

            paddles = [];
            paddles.push(sprites.create(game.width / 2, 5, 'pixel'));
            paddles.push(sprites.create(5, game.height / 2, 'pixel'));
            paddles.push(sprites.create(game.width / 2, game.height - 5, 'pixel'));
            paddles.push(sprites.create(game.width - 5, game.height / 2, 'pixel'));

            paddles[0].tint = 0xff0000;
            paddles[1].tint = 0x00ff00;
            paddles[2].tint = 0x0000ff;
            paddles[3].tint = 0xffff00;

            for (var i in paddles) {
                paddles[i].player = i;
                paddles[i].name = 'player' + (i + 1);
                if (i % 2 == 0) {
                    paddles[i].scale.setTo(50, 10);
                }
                else {
                    paddles[i].scale.setTo(10, 50);
                }
                paddles[i].anchor.setTo(0.5, 0.5);
                game.physics.enable([paddles[i]], Phaser.Physics.ARCADE);
                paddles[i].body.bounce.x = 1;
                paddles[i].body.bounce.y = 1;
                paddles[i].body.minBounceVelocity = 0;
                paddles[i].body.immovable = true;
            }

            sprites.setAll('body.collideWorldBounds', true);
        },
        update: function () {
            game.physics.arcade.collide(ball, paddles, function (ball, player) {
                ball.tint = player.tint;
            });

            demoMovements();
        }
    };

    var SynchState = {
        p: false,
        players: 0,
        countdown: false,
        init: function (data) {
            var self = this;
            self.p = data.playersCount -1;
            self.players = parseInt(data.playersCount);
            if (data.hosting) {
                host = true;
                socket.removeAllListeners('joined');
                socket.emit('startCounting', socket.id);
            }
            else {
                socket.on('joined', function (data) {
                    self.players = parseInt(data.playersCount);
                });
                socket.on('playerLeft', function (data) {
                    self.players = parseInt(data.playersCount);
                });
            }
            socket.on('timeOut', function(data, ack) {
                self.countdown = parseInt(data.times);
                ack(socket.id);
            });
        },
        preload: function () {
            cursors = game.input.keyboard.createCursorKeys();
        },
        create: function () {
            var style = {font: "30px Arial", fill: "#ffffff", align: "center"};
            this.text = game.add.text(game.world.centerX, game.world.centerY, "Awaiting other players (" + this.players + "/4)", style);
            this.text.anchor.setTo(0.5, 0.5);
        },
        update: function () {
            game.physics.arcade.collide(ball, paddles, function (ball, player) {
                ball.tint = player.tint;
            });

            if (!this.countdown || this.countdown < 0) {
                demoMovements();
            }
            else {
                initGame(this.countdown);
            }

            if (this.countdown) {
                this.text.text = "Starting in "+this.countdown+"...";
            }
            else if (host || this.players == 4) {
                this.text.text = "Waiting for count down...";
            }
            else {
                this.text.text = "Awaiting other players (" + this.players + "/4)";
            }
        },
        initGame: function(phase) {
            switch(phase) {
                case 1:
                    ball.position.setTo(game.width / 2, game,height / 2);
                    ball.tint = 0xffffff;
                    ball.player = -1;
                    ball.body.velocity.x = 0;
                    ball.body.velocity.y = 0;
                break;
                case 2:
                    this.text.text = "GO!";
                    paddles[0].position.setTo(game.width / 2, 5);
                    paddles[1].position.setTo(5, game.height / 2);
                    paddles[2].position.setTo(game.width / 2, game.height - 5);
                    paddles[3].position.setTo(game.width - 5, game.height / 2);
                break;
                case 3:
                    this.text.destroy();
                    game.state.start("game", false, false, { player: this.p });
                break;
            }
        }
    };

    //TODO: gestire utente disconnesso
    //TODO: riscrivere gamestate per sfruttare sprite già presenti sulla scena
    //TODO: trasferimento dati
    //TODO: endgame?
    var GameState = {
        init: function (data) {
            currentPlayer = data.player;
            master = data.player == 0;

            socket.on('update', function(data) {
                self.countdown = parseInt(data.times);
            });
            socket.on('input', function(data) {
                self.countdown = parseInt(data.times);
            });
        },
        create: function () {
            var scoresPos = [
                {w: game.world.centerX, h: game.world.centerY - 100},
                {w: game.world.centerX - 100, h: game.world.centerY},
                {w: game.world.centerX, h: game.world.centerY + 100},
                {w: game.world.centerX + 100, h: game.world.centerY}
            ];

            for (var i in paddles) {
                var style = {font: "50px Arial", fill: "#" + colors[i], align: "center"};
                paddles[i].scoreLabel = game.add.text(scoresPos[i].w, scoresPos[i].h, "0", style);
                paddles[i].scoreLabel.anchor.setTo(0.5, 0.5);
            }
        },
        update: function () {
            if (master) {
                game.physics.arcade.collide(ball, paddles, function (ball, player) {
                    ball.tint = player.tint;
                    ball.player = player.player;
                });
                this.checkScore();
                //this.updateServer();
            }
            this.inputManagement();
        },
        checkScore: function () {
            var scored = false;
            if (ball.body.y < 1) {
                scored = true;
                if (ball.player == -1 || ball.player == 0) {
                    paddles[0].scoreLabel.text--;
                    scored = true;
                }
                else {
                    paddles[ball.player].scoreLabel.text++;
                }
            }
            else if (ball.body.y > game.world.height - ball.body.height - 1) {
                scored = true;
                if (ball.player == -1 || ball.player == 2) {
                    paddles[2].scoreLabel.text--;
                }
                else {
                    paddles[ball.player].scoreLabel.text++;
                }
            }
            else if (ball.body.x < 1) {
                scored = true;
                if (ball.player == -1 || ball.player == 1) {
                    paddles[1].scoreLabel.text--;
                }
                else {
                    paddles[ball.player].scoreLabel.text++;
                }
            }
            else if (ball.body.x > game.world.width - ball.body.width - 1) {
                scored = true;
                if (ball.player == -1 || ball.player == 3) {
                    paddles[3].scoreLabel.text--;
                }
                else {
                    paddles[ball.player].scoreLabel.text++;
                }
            }

            if (scored) { //reset ball position
                ball.body.position.setTo(game.world.centerX, game.world.centerY);
                ball.tint = 0xffffff;
                ball.body.velocity.x = game.rnd.integerInRange(-200, 200);
                ball.body.velocity.y = game.rnd.integerInRange(-200, 200);
            }

            for (var i in paddles) {
                if (paddles[i].scoreLabel.text > 9) {
                    this.endGame(paddles[i]);
                }
            }
        },
        inputManagement: function () {
            var moveFactor = 2;
            if (this.cursors.left.isDown || this.cursors.up.isDown) {
                switch (currentPlayer) {
                    case 0:
                    case 2:
                        paddles[currentPlayer].position.x -= moveFactor;
                        break;
                    case 1:
                    case 3:
                        paddles[currentPlayer].position.y -= moveFactor;
                        break;
                }
            }
            else if (this.cursors.right.isDown || this.cursors.down.isDown) {
                switch (currentPlayer) {
                    case 0:
                    case 2:
                        paddles[currentPlayer].position.x += moveFactor;
                    break;
                    case 1:
                    case 3:
                        paddles[currentPlayer].position.y += moveFactor;
                    break;
                }
            }
            else {
                switch (currentPlayer) {
                    case 0:
                    case 2:
                        if (game.input.activePointer.x > paddles[currentPlayer].position.x) {
                            paddles[currentPlayer].position.x += moveFactor;
                        }
                        else if (game.input.activePointer.x < paddles[currentPlayer].position.x) {
                            paddles[currentPlayer].position.x -= moveFactor;
                        }
                    break;
                    case 1:
                    case 3:
                        if (game.input.activePointer.y > paddles[currentPlayer].position.y) {
                            paddles[currentPlayer].position.y += moveFactor;
                        }
                        else if (game.input.activePointer.y < paddles[currentPlayer].position.y) {
                            paddles[currentPlayer].position.y -= moveFactor;
                        }
                    break;
                }
            }
        },
        endGame: function (player) {
            ball.body.velocity.setTo(0, 0);
            var style = {font: "50px Arial", fill: "#ffffff", align: "center"};
            var text = game.add.text(game.world.centerX, game.world.centerY, player.name + " wins!", style);
            text.anchor.setTo(0.5, 0.5);
        },
        updateServer: function () {
            for (var i in paddles) {
                paddles[i].body.x;
                paddles[i].body.y;
                paddles[i].scoreLabel.text;
            }
            ball.body.x;
            ball.body.y;
        },
        render: function () {
            if (debug) {
                game.debug.body(ball);
                for (var i in paddles) {
                    game.debug.body(paddles[i]);
                }
            }
        }
    };

    game.state.add("boot", BootState, true);
    game.state.add("preload", LoadingState, false);
    game.state.add("sync", SynchState, false);
    game.state.add("game", GameState, false);

    this.switchToSync = function(data) {
        game.state.start("sync", false, false, data);
    };

    this.getSocket = function() {
        return socket;
    };

    return this;
}

Pong.prototype.getSocket = function () {
    return this.getSocket();
};
Pong.prototype.sync = function(data) {
    this.switchToSync(data);
};