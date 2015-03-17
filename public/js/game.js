function Pong() {
    var self = this;
    var socket = io();
    socket.on('disconnect', function(data) {
        var msg = 'Connection loss :\\';
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

    var pingTime;
    var ping;
    socket.on('pong', function () {
        latency = Date.now() - pingTime;
        ping = latency;
    });

    function measurePing() {
        setTimeout(function () {
            pingTime = Date.now();
            socket.emit('ping');
            measurePing();
        }, 2000);
    }
    measurePing();

    var debug = false;

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

    function demoMovements(inactivePlayers) {
        if (inactivePlayers == undefined) {
            inactivePlayers = {0:true, 1:true, 2:true, 3:true};
        }

        for (var i in paddles) {
            if (!inactivePlayers[i]) {
                continue;
            }

            var p = paddles[i];
            var pH2 = p.body.height/2;
            var pW2 = p.body.width/2;
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
            game.stage.disableVisibilityChange = true;

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

            ball = sprites.create(game.world.width / 2, game.world.height / 2, 'pixel');
            ball.name = 'ball';
            ball.scale.setTo(10, 10);
            ball.anchor.setTo(0.5, 0.5);

            game.physics.enable([ball], Phaser.Physics.ARCADE);
            var sign = game.rnd.integerInRange(0,1) == 0 ? 1 : -1;
            ball.body.velocity.x = game.rnd.integerInRange(100, 250) * sign;
            ball.body.velocity.y = game.rnd.integerInRange(100, 250) * sign;
            ball.body.bounce.x = 1;
            ball.body.bounce.y = 1;
            ball.body.minBounceVelocity = 0;
            ball.player = -1;

            paddles = [];
            paddles.push(sprites.create(game.world.width / 2, 5, 'pixel'));
            paddles.push(sprites.create(5, game.world.height / 2, 'pixel'));
            paddles.push(sprites.create(game.world.width / 2, game.world.height - 5, 'pixel'));
            paddles.push(sprites.create(game.world.width - 5, game.world.height / 2, 'pixel'));

            paddles[0].tint = 0xff0000;
            paddles[1].tint = 0x00ff00;
            paddles[2].tint = 0x0000ff;
            paddles[3].tint = 0xffff00;

            for (var i in paddles) {
                paddles[i].player = i;
                paddles[i].name = 'Player' + (parseInt(i) + 1);
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
            game.stage.disableVisibilityChange = true;

            var self = this;

            self.players = parseInt(data.playersCount);
            if (data.hosting) {
                self.p = 0;
                host = true;
                socket.emit('startCounting', socket.id);
            }
            else {
                self.p = data.playersCount -1;
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
                this.initGame(this.countdown);
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
                    ball.position.setTo(game.world.width / 2, game.world.height / 2);
                    ball.tint = 0xffffff;
                    ball.player = -1;
                    ball.body.velocity.x = 0;
                    ball.body.velocity.y = 0;
                case 2:
                    paddles[0].position.setTo(game.world.width / 2, 5);
                    paddles[1].position.setTo(5, game.world.height / 2);
                    paddles[2].position.setTo(game.world.width / 2, game.world.height - 5);
                    paddles[3].position.setTo(game.world.width - 5, game.world.height / 2);
                    this.text.text = "GO!";
                case 3:
                    socket.removeAllListeners('joined');
                    socket.removeAllListeners('timeOut');
                    socket.removeAllListeners('playerLeft');
                    this.text.destroy();
                    game.state.start("game", false, false, { player: this.p });
                break;
            }
        }
    };

    var GameState = {
        inactivePlayers: { 0:false, 1:false, 2:false, 3:false },
        init: function (data) {
            game.stage.disableVisibilityChange = true;

            var self = this;
            currentPlayer = data.player;
            master = data.player == 0;

            socket.on('playerLeft', function (data) {
                self.inactivePlayers[parseInt(data.playerLeft)] = true;
            });
            socket.on('clientUpdate', function(data) {
                self.updateClient(data);
            });
            socket.on('clientUpdateScores', function(data) {
                self.updateClientScores(data);
            });
            socket.on('clientUpdateBall', function (data) {
                self.updateClientBall(data);
            });
        },
        create: function () {
            if (!master) {
                ball.body.velocity.x = 0;
                ball.body.velocity.y = 0;
            }
            else {
                var sign = game.rnd.integerInRange(0,1) == 0 ? 1 : -1;
                ball.body.velocity.x = game.rnd.integerInRange(100, 250) * sign;
                ball.body.velocity.y = game.rnd.integerInRange(100, 250) * sign;
            }

            paddles[0].position.setTo(game.world.width / 2, 5);
            paddles[1].position.setTo(5, game.world.height / 2);
            paddles[2].position.setTo(game.world.width / 2, game.world.height - 5);
            paddles[3].position.setTo(game.world.width - 5, game.world.height / 2);

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
            for (var i in paddles) {
                if (paddles[i].scoreLabel.text > 9) {
                    this.endGame(paddles[i]);
                    return;
                }
            }

            if (master) {
                game.physics.arcade.collide(ball, paddles, function (ball, player) {
                    ball.tint = player.tint;
                    ball.player = player.player;

                    var data = { socketId: socket.id };
                    data['ballTint'] = ball.tint;
                    socket.emit('gameBall', data);
                });
                this.checkScore();
            }
            this.inputManagement();
            demoMovements(this.inactivePlayers);
            this.updateServer();
        },
        checkScore: function () {
            if (master) {
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
                    var data = { socketId: socket.id };
                    data['scores'] = [];
                    for(var i in paddles) {
                        data['scores'].push(parseInt(paddles[i].scoreLabel.text));
                    }
                    socket.emit('gameScores', data);

                    ball.body.position.setTo(game.world.centerX, game.world.centerY);
                    ball.player = -1;
                    ball.tint = 0xffffff;

                    var sign = game.rnd.integerInRange(0,1) == 0 ? 1 : -1;
                    ball.body.velocity.x = game.rnd.integerInRange(100, 250) * sign;
                    ball.body.velocity.y = game.rnd.integerInRange(100, 250) * sign;
                }
            }
        },
        inputManagement: function () {
            var moveFactor = 2;
            if (cursors.left.isDown || cursors.up.isDown) {
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
            else if (cursors.right.isDown || cursors.down.isDown) {
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
            var wonSentence = player.player == currentPlayer ? "You win!" : player.name + " wins!";
            var text = game.add.text(game.world.centerX, game.world.centerY, wonSentence, style);
            text.anchor.setTo(0.5, 0.5);

            socket.removeAllListeners('playerLeft');
            socket.removeAllListeners('clientUpdate');
            socket.removeAllListeners('clientUpdateScores');
            socket.removeAllListeners('clientUpdateBall');
            socket.removeAllListeners('disconnect');
            socket.disconnect();

            $("#endContainer").removeClass("hide");
            $("#connect").removeClass("hide").css("background-color", "transparent");
        },
        socketTiming: 0,
        socketDelay: 16,
        getSocketDelay: function() {
            return ping < this.socketDelay ? ping : this.socketDelay;
        },
        updateServer: function () {
            this.socketTiming+=game.time.elapsed;
            if (this.socketTiming < this.getSocketDelay()) {
                return;
            }
            this.socketTiming = 0;
            var data = { socketId: socket.id };

            if (master) {
                data['ball'] = true;
                data['ballX'] = parseFloat(ball.body.x).toFixed(2);
                data['ballY'] = parseFloat(ball.body.y).toFixed(2);
            }
            else {
                data['ball'] = false;
            }

            data['player'] = parseInt(currentPlayer);
            switch(data['player']) {
                case 0:
                case 2:
                    data['paddle'] = parseFloat(paddles[currentPlayer].body.x).toFixed(2);
                break;
                case 1:
                case 3:
                    data['paddle'] = parseFloat(paddles[currentPlayer].body.y).toFixed(2);
                break;
            }

            socket.emit('gameUpdate', data);
        },
        updateClient: function (data) {
            if (!master && data.ball == true) {
                ball.position.x = parseFloat(data.ballX);
                ball.position.y = parseFloat(data.ballY);
            }

            if (data.player != currentPlayer) {
                switch(parseInt(data.player)) {
                    case 0:
                    case 2:
                        paddles[data.player].position.x = parseFloat(data.paddle);
                    break;
                    case 1:
                    case 3:
                        paddles[data.player].position.y = parseFloat(data.paddle);
                    break;
                }
            }
        },
        updateClientScores: function(data) {
            if (!master) {
                ball.tint = 0xffffff;
                for(var i in data.scores) {
                    paddles[i].scoreLabel.text = parseInt(data.scores[i]);
                }
            }
        },
        updateClientBall: function(data) {
            if (!master) {
                ball.tint = data.ballTint;
            }
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