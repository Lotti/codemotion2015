function server(io) {
    var debug = true;

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

    function getSocket(id) {
        return io.sockets.connected[id];
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

    function startTimeOut(room, playerCounter, times) {
        if (playerCounter == undefined) {
            playerCounter = 0;
        }

        if (times == undefined) {
            times = 0;
        }

        var players = socketsInRoom(room);

        if (times > 3) {
            return;
        }
        else if (playerCounter >= 4) {
            startTimeOut(room, 0, ++times);
        }
        else {
            var sid = players[playerCounter];
            var socket = io.sockets.connected[players[playerCounter]];
            //var socket = getSocket(sid);
            if (socket != undefined) {
                log('ticking... '+times+ sid);
                socket.emit('timeOut', {times: times}, function (socketId) {
                    log('ticking back... '+times+ socketId);
                    startTimeOut(room, ++playerCounter, times);
                });
            }
            else {
                log('socket not found :\\ '+sid,'e');
            }
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
            socket.join(room, function (err) {
                if (!err) {
                    clients[socket.id] = room;
                    hosts[socket.id] = true;
                    ack(room);
                    log('host '+socket.id+' connected');
                }
                else {
                    log(err,'e');
                    sendError(1, "host: can't join room", socket);
                }
            });
        });

        socket.on('join', function(data, ack) {
            var room = data;
            if (debug) room = 1;
            if (roomExists(room)) {
                var c = socketsInRoom(room).length;
                if (c < 1) {
                    sendError(4, "that room doesn't exists", socket, room);
                }
                else if (c >= 4) {
                    sendError(5, "the room is full!", socket, room);
                }
                else {
                    socket.join(room, function (err) {
                        if (!err) {
                            clients[socket.id] = room;
                            var players = socketsInRoom(room);
                            ack({ players: players, playersCount: players.length});
                            log('client ' + socket.id + ' connected to host ' + room + ' (' + players.length + ')');
                            io.to(room).emit('joined', {players: players, playersCount: players.length});
                        }
                        else {
                            log(err, 'e');
                            sendError(3, "client: can't join room", socket);
                        }
                    });
                }
            }
            else {
                sendError(2, "that room doesn't exists", socket, room);
            }
        });

        socket.on('startCounting', function(socketId) {
            var room = clients[socketId];
            var players = socketsInRoom(room);
            if (players.length == 4) {
                setTimeout(function () {
                    startTimeOut(room);
                }, 5000);
            }
            else {
                sendError(7, "players are not reachable :\\", socket, room);
            }
        });

        socket.on('disconnect', function() {
            var room = clients[socket.id];

            clients[socket.id] = null;
            delete clients[socket.id];

            if (room != null) {
                if (hosts[socket.id]) {
                    hosts[socket.id] = false;
                    delete hosts[socket.id];

                    log('room destroyed');
                    sendError(6, "host left the game", socket, room);
                }
                else {
                    var players = socketsInRoom(room);
                    io.to(room).emit('playerLeft', {playerLeft: socket.id, players: players, playersCount: players.length});
                }
            }
        });

        socket.on('update', function(data) {
            var room = clients[data.socketId];
            io.to(room).volatile.emit('update', data);
        });
    });
}

module.exports = server;