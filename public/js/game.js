function Pong() {
    var self = this;
    var socket = io();
    socket.on('error', function(data) {
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
    var players = [];
    var sprites;
    var ball;

    var player = (debug == true ? 0 : -1);
    var master = false;//(player == 0);


    var colors = ["ff0000", "00ff00", "0000ff", "ffff00"];

    function demoMovements () {
        for (var i in players) {
            var p = players[i];
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

            players = [];
            players.push(sprites.create(game.width / 2, 5, 'pixel'));
            players.push(sprites.create(5, game.height / 2, 'pixel'));
            players.push(sprites.create(game.width / 2, game.height - 5, 'pixel'));
            players.push(sprites.create(game.width - 5, game.height / 2, 'pixel'));

            players[0].tint = 0xff0000;
            players[1].tint = 0x00ff00;
            players[2].tint = 0x0000ff;
            players[3].tint = 0xffff00;

            for (var i in players) {
                players[i].player = i;
                players[i].name = 'player' + (i + 1);
                if (i % 2 == 0) {
                    players[i].scale.setTo(50, 10);
                }
                else {
                    players[i].scale.setTo(10, 50);
                }
                players[i].anchor.setTo(0.5, 0.5);
                game.physics.enable([players[i]], Phaser.Physics.ARCADE);
                players[i].body.bounce.x = 1;
                players[i].body.bounce.y = 1;
                players[i].body.minBounceVelocity = 0;
                players[i].body.immovable = true;
            }

            sprites.setAll('body.collideWorldBounds', true);
        },
        update: function () {
            game.physics.arcade.collide(ball, players, function (ball, player) {
                ball.tint = player.tint;
            });

            demoMovements();
        }
    };

    //TODO: gestione countdown
    var SynchState = {
        players: 0,
        countdown: false,
        init: function (data) {
            console.log(data);
            this.players = data.playersCount;
            if (data.hosting) {
                host = true;
                socket.removeAllListeners('joined');
            }
            else {
                if (this.players < 4) {
                    socket.on('joined', function (data) {
                        this.players = parseInt(data.playersCount);
                        if (this.players == 4) {
                            socket.removeAllListeners("joined");
                        }
                    });
                }
            }
        },
        create: function () {
            var style = {font: "30px Arial", fill: "#ffffff", align: "center"};
            this.text = game.add.text(game.world.centerX, game.world.centerY, "Awaiting other players (" + this.players + "/4)", style);
            this.text.anchor.setTo(0.5, 0.5);
        },
        update: function () {
            game.physics.arcade.collide(ball, players, function (ball, player) {
                ball.tint = player.tint;
            });

            demoMovements();

            if (this.countdown) {
                this.text.text = "Starting in ";
            }
            else if (host || this.players == 4) {
                this.text.text = "Waiting for count down...";
            }
            else {
                this.text.text = "Awaiting other players (" + this.players + "/4)";
            }
        }
    };

    //TODO: gestire utente disconnesso
    //TODO: riscrivere gamestate per sfruttare sprite già presenti sulla scena
    //TODO: trasferimento dati
    //TODO: endgame?
    var GameState = {
        preload: function () {
            this.cursors = game.input.keyboard.createCursorKeys();
        },
        create: function () {
            if (master) {
                game.physics.startSystem(Phaser.Physics.ARCADE);
            }

            sprites = game.add.group();

            ball = sprites.create(game.width / 2, game.height / 2, 'pixel');
            ball.name = 'ball';
            ball.scale.setTo(10, 10);
            ball.anchor.setTo(0.5, 0.5);

            if (master) {
                game.physics.enable([this.ball], Phaser.Physics.ARCADE);
                ball.body.velocity.x = game.rnd.integerInRange(-200, 200);
                ball.body.velocity.y = game.rnd.integerInRange(-200, 200);
                ball.body.bounce.x = 1;
                ball.body.bounce.y = 1;
                ball.body.minBounceVelocity = 0;
                ball.player = -1;
            }

            players = [];
            players.push(sprites.create(game.width / 2, 5, 'pixel'));
            players.push(sprites.create(5, game.height / 2, 'pixel'));
            players.push(sprites.create(game.width / 2, game.height - 5, 'pixel'));
            players.push(sprites.create(game.width - 5, game.height / 2, 'pixel'));

            players[0].tint = 0xff0000;
            players[1].tint = 0x00ff00;
            players[2].tint = 0x0000ff;
            players[3].tint = 0xffff00;

            for (var i in this.players) {
                players[i].player = i;
                players[i].name = 'player' + (i + 1);
                if (i % 2 == 0) {
                    players[i].scale.setTo(50, 10);
                }
                else {
                    players[i].scale.setTo(10, 50);
                }
                players[i].anchor.setTo(0.5, 0.5);
                if (master) {
                    game.physics.enable([players[i]], Phaser.Physics.ARCADE);
                    players[i].body.bounce.x = 1;
                    players[i].body.bounce.y = 1;
                    players[i].body.minBounceVelocity = 0;
                    players[i].body.immovable = true;
                }
            }

            if (master) {
                sprites.setAll('body.collideWorldBounds', true);
            }

            var scoresPos = [
                {w: game.world.centerX, h: game.world.centerY - 100},
                {w: game.world.centerX - 100, h: game.world.centerY},
                {w: game.world.centerX, h: game.world.centerY + 100},
                {w: game.world.centerX + 100, h: game.world.centerY}
            ];

            for (var i in players) {
                var style = {font: "50px Arial", fill: "#" + colors[i], align: "center"};
                players[i].scoreLabel = game.add.text(scoresPos[i].w, scoresPos[i].h, "0", style);
                players[i].scoreLabel.anchor.setTo(0.5, 0.5);
            }
        },
        update: function () {
            if (master) {
                game.physics.arcade.collide(ball, players, function (ball, player) {
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
                    players[0].scoreLabel.text--;
                    scored = true;
                }
                else {
                    players[ball.player].scoreLabel.text++;
                }
            }
            else if (ball.body.y > game.world.height - ball.body.height - 1) {
                scored = true;
                if (ball.player == -1 || ball.player == 2) {
                    players[2].scoreLabel.text--;
                }
                else {
                    players[ball.player].scoreLabel.text++;
                }
            }
            else if (ball.body.x < 1) {
                scored = true;
                if (ball.player == -1 || ball.player == 1) {
                    players[1].scoreLabel.text--;
                }
                else {
                    players[ball.player].scoreLabel.text++;
                }
            }
            else if (ball.body.x > game.world.width - ball.body.width - 1) {
                scored = true;
                if (ball.player == -1 || ball.player == 3) {
                    players[3].scoreLabel.text--;
                }
                else {
                    players[ball.player].scoreLabel.text++;
                }
            }

            if (scored) { //reset ball position
                ball.body.position.setTo(game.world.centerX, game.world.centerY);
            }

            for (var i in players) {
                if (players[i].scoreLabel.text > 9) {
                    this.endGame(players[i]);
                }
            }
        },
        inputManagement: function () {
            var moveFactor = 2;
            if (this.cursors.left.isDown || this.cursors.up.isDown) {
                switch (player) {
                    case 0:
                    case 2:
                        players[player].position.x -= moveFactor;
                        break;
                    case 1:
                    case 3:
                        players[player].position.y -= moveFactor;
                        break;
                }
            }
            else if (this.cursors.right.isDown || this.cursors.down.isDown) {
                switch (player) {
                    case 0:
                    case 2:
                        players[player].position.x += moveFactor;
                    break;
                    case 1:
                    case 3:
                        players[player].position.y += moveFactor;
                    break;
                }
            }
            else {
                switch (player) {
                    case 0:
                    case 2:
                        if (game.input.activePointer.x > players[player].position.x) {
                            players[player].position.x += moveFactor;
                        }
                        else if (game.input.activePointer.x < players[player].position.x) {
                            players[player].position.x -= moveFactor;
                        }
                    break;
                    case 1:
                    case 3:
                        if (game.input.activePointer.y > players[player].position.y) {
                            players[player].position.y += moveFactor;
                        }
                        else if (game.input.activePointer.y < players[player].position.y) {
                            players[player].position.y -= moveFactor;
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
            for (var i in players) {
                players[i].body.x;
                players[i].body.y;
                players[i].scoreLabel.text;
            }
            ball.body.x;
            ball.body.y;
        },
        render: function () {
            if (debug) {
                game.debug.body(ball);
                for (var i in players) {
                    game.debug.body(players[i]);
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