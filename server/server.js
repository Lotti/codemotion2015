function server(io) {
    var debug = true;
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

    function socketsInRoom (room) {
        return Object.keys(io.nsps["/"].adapter.rooms[room]).length;
    }

    function sendError(number, msg, socket, room) {
        if (room != undefined) {
            socket = socket.to(room);
        }
        socket.emit('error', {num: number, msg: msg});
    }

    io.on('connection', function(socket) {
        socket.on('host', function(data, ack) {
            var room = socket.id;
            if (debug) room = 1;
            hosts[room] = socket;
            socket.leave(socket.id, function(err) {
                if (!err) {
                    socket.join(room, function (err) {
                        if (!err) {
                            if (debug) socket.id = room;
                            ack({ rooms: socket.rooms });
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
            if (hosts[room] != undefined) {
                socket.leave(socket.rooms[0], function(err) {
                    if (!err) {
                        socket.join(room, function(err) {
                            if (!err) {
                                socket.join(room);
                                var players = socketsInRoom(room);
                                ack({ rooms: socket.rooms, playersCount: players });
                                log('client '+socket.id+' connected to host '+room+' ('+players+')');
                                io.to(room).emit('joined', { playersCount: players });
                            }
                            else {
                                log(err,'e');
                                sendError(5, "client: can't join room", socket);
                            }
                        });
                    }
                    else {
                        log(err,'e');
                        sendError(4, "client: can't leave room", socket);
                    }
                });
            }
            else {
                sendError(1, "host not found", socket, room);
            }
        });

        socket.on('disconnect', function(asd) {
            var room = socket.rooms[0];
            log('client '+socket.id+' disconnect');
            if (hosts[room] != undefined && room == socket.id) {
                hosts[room] = undefined;
                delete hosts[room];
                log('room destroyed');
                io.to(room).emit('disconnect'); //host leaved!!
            }
            else {
                io.to(room).emit('disconnect'); //player leaved!!
            }
        });
    });
}

module.exports = server;

//socket.volatile.emit(...)