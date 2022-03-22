const {Server} = require("socket.io");

function socketServer(httpServer){
  const io = new Server(httpServer, {
    cors: {
      origin: "*"
    }
  });

  //Listener for establishing connection with a client - onConnect() listener
  io.on("connection", (socket) => {
    console.log("New socket has connected: " + socket.id);

    //Listening for joining the game
    socket.on("join_game", (message) => {
      console.log("New user is joining the room: " + message.roomId);

      const socketsConnectedToRoom = io.sockets.adapter.rooms.get(message.roomId);
      const roomsConnectedToSocket = Array.from(socket.rooms.values()).filter(r => r !== socket.id);
      if(socketsConnectedToRoom && socketsConnectedToRoom.size === 2){
        socket.emit("join_room_error", {"error":"Room is full!"});
      }else if (roomsConnectedToSocket.length > 0){
        socket.emit("join_room_error", {"error":"You are already connected to another room!"});
      }else{
        let figure, isActive;
        if(!socketsConnectedToRoom){
          figure = "X";
          isActive = true;
        }else{
          figure = "0";
          isActive = false;
        }
        const promise = new Promise((resolve, reject) => {
          socket.join(message.roomId);
          resolve();
        });
        promise.then(() => {
          socket.emit("join_room_success", {roomId: message.roomId, figure: figure,
                                            isActive: isActive});
          if(socketsConnectedToRoom.size === 2){
            io.to(message.roomId).emit("game_can_start");
          }
        });
      }
    });

    //Listening for new move
    socket.on("new_move", (data) => {
      //get the second socket, connected to the room, which the current socket is connected to
      const currentRoom = Array.from(socket.rooms).filter((room) => room !== socket.id)[0];
      const secondSocketID = Array.from(io.sockets.adapter.rooms.get(currentRoom)).filter((socket_id) => socket_id !== socket.id)[0];
      const secondSocket = io.sockets.sockets.get(secondSocketID);
      socket.emit("end_of_move");
      secondSocket.emit("start_of_move", {figure: data.figure, position: data.position, currentBoardState: data.gameBoard});
    });

    //Listening for getting a winner
    socket.on("winner", (data) => {
      const winner = data.winner;
      const socket_figure = data.figure;
      const currentRoom = Array.from(socket.rooms).filter((room) => room !== socket.id)[0];
      const secondSocketID = Array.from(io.sockets.adapter.rooms.get(currentRoom)).filter((socket_id) => socket_id !== socket.id)[0];
      const secondSocket = io.sockets.sockets.get(secondSocketID);

      if(winner === "draw"){
        io.to(currentRoom).emit("draw", {socketId: socket.id});
      }else{
        if(winner !== socket_figure){
          secondSocket.emit("win");
        }else{
          secondSocket.emit("lose");
        }
      }

      io.to(currentRoom).emit("erase_board");

    });


    //Listening for leaving the game
    socket.on("leave_game", (data) => {
      console.log("User is leaving the room: " + data.roomId);
      const promise = new Promise((res, rej) => {
        socket.leave(data.roomId);
        res();
      });
      promise.then(() => {
        socket.emit("leave_room_success", {message: "You successfully left the room"});
        io.to(data.roomId).emit("game_finished");
      });
    });
  });

  return io;
}

module.exports = socketServer;
