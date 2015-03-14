function server(io) {
    this.io = io;
    
    io.on('connection', function(socket){
      console.log('a user connected');
        socket.on('disconnect', function(){
            console.log('user disconnected');
        });
    });
}

server.prototype.checkRequest = function (id) {
	return { type: "a", id: id };
};


module.exports = server;