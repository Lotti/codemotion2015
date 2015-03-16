function server(io) {
    var debug = true;

    var games = {};
    var clients = {};
    var hosts = {};

    function log(msg, type) {
        if (type == undefined) {
            type = 'l';
        }

        if (type == 'e') {
            console.error(msg);
        }
        else if (type == 'w') {
            if (debug) {
                console.warn(msg);
            }
        }
        else {
            if (debug) {
                console.log(msg);
            }
        }
    }

    function makeGameId() {
        return (0|Math.random()*9e6).toString(36);
    }

    function roomExists(room) {
        return io.nsps["/"].adapter.rooms[room] != undefined;
    }

    function getRoom(room) {
        return io.nsps["/"].adapter.rooms[room];
    }

    function socketsInRoom(room) {
        if (io == undefined) {
            log("io is undefined :\\",'e');
        }

        if (io.nsps["/"] == undefined) {
            log("/ namespace is undefined :\\",'e');
        }

        if (io.nsps["/"].adapter == undefined) {
            log("adapter is undefined :\\",'e');
        }

        if (io.nsps["/"].adapter.rooms == undefined) {
            log("rooms is undefined :\\",'e');
        }

        return Object.keys(getRoom(room));
    }

    function sendError(number, msg, socket, room) {
        try {
            if (room != undefined) {
                socket = socket.to(room);
            }
            socket.emit('errorMsg', {num: number, msg: msg});
        }
        catch(ex) {
            log(ex,'e');
        }
    }

    function startTimeOut(room, times) {
        if (times == undefined) {
            times = 0;
        }

        var players = socketsInRoom(room);

        var ticks = 0;
        for(var i in players) {
            var p = players[i];
            setTimeout(function () {
                io.to(p).emit('timeOut', times, function () {
                    ticks++;
                    if (ticks == 4) {
                        startTimeOut(room, ++times);
                    }
                });
            }, 1000);
        }
    }

    io.on('connection', function(socket) {
        clients[socket.id] = null;

        socket.on('error', function(data) {
            log(data,'e');
        });

        socket.on('host', function(data, ack) {
            var room = makeGameId();
            if (debug) room = 1;
            socket.leave(socket.id, function(err) {
                if (!err) {
                    clients[socket.id] = null;
                    socket.join(room, function (err) {
                        if (!err) {
                            games[room] = [];
                            games[room].push(socket.id);
                            clients[socket.id] = room;
                            hosts[socket.id] = true;
                            ack(room);
                            log('host '+socket.id+' connected');
                        }
                        else {
                            log(err,'e');
                            sendError(3, "host: can't join room", socket);
                        }
                    });
                }
                else {
                    log(err,'e');
                    sendError(2, "host: can't leave default room", socket);
                }
            });
        });

        socket.on('join', function(data, ack) {
            var room = data;
            if (debug) room = 1;
            if (roomExists(room)) {
                var c = socketsInRoom(room).length;
                if (c < 1) {
                    sendError(7, "that room doesn't exists", socket, room);
                }
                else if (c >= 4) {
                    sendError(8, "the room is full!", socket, room);
                }
                else {
                    socket.leave(socket.rooms[0], function (err) {
                        if (!err) {
                            clients[socket.id] = null;
                            socket.join(room, function (err) {
                                if (!err) {
                                    clients[socket.id] = room;
                                    var players = socketsInRoom(room);
                                    ack({ players: players, playersCount: players.length});
                                    log('client ' + socket.id + ' connected to host ' + room + ' (' + players + ')');
                                    io.to(room).emit('joined', {players: players, playersCount: players.length});
                                    if (players.length == 4) {
                                        startTimeOut(room);
                                    }
                                }
                                else {
                                    log(err, 'e');
                                    sendError(5, "client: can't join room", socket);
                                }
                            });
                        }
                        else {
                            log(err, 'e');
                            sendError(4, "client: can't leave room", socket);
                        }
                    });
                }
            }
            else {
                sendError(1, "that room doesn't exists", socket, room);
            }
        });

        socket.on('disconnect', function(asd) {
            var room = clients[socket.id];

            if (room != null) {
                if (clients[socket.id] == socket.id) {
                    log('room destroyed');
                    sendError(6, "host left the game", socket, room);
                }
                else {
                    var players = socketsInRoom(room);
                    io.to(room).emit('playerLeft', {playerLeft: socket.id, players: players, playersCount: players.length});
                }
            }

            clients[socket.id] = null;
            delete clients[socket.id];
        });

        //TODO: countdown inizio partita
    });
}

module.exports = server;

//socket.volatile.emit(...)