const express = require('express');
const path = require('path');
const socketio = require('socket.io');
const http = require('http');
const { generateMessage, generateLocationMessage } = require('./utils/message');
const {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom,
} = require('./utils/users');

const port = process.env.PORT || 4000;
const publicDirectoryPath = path.join(__dirname, '../public');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.use(express.static(publicDirectoryPath));

io.on('connection', socket => {
  console.log('New WebSocket Connection Established!!');

  // join(listen)
  socket.on('join', ({ username, room }, callback) => {
    const { error, user } = addUser({
      id: socket.id,
      username,
      room,
    });

    if (error) {
      return callback(error);
    }

    socket.join(user.room);
    socket.emit(
      'message',
      generateMessage('Admin', `Welcome ${user.username}.`)
    );
    socket.broadcast
      .to(user.room)
      .emit(
        'message',
        generateMessage('Admin', `${user.username} just joined.`)
      );

    io.to(user.room).emit('roomData', {
      room: user.room,
      users: getUsersInRoom(user.room),
    });

    callback();
  });

  socket.on('disconnect', () => {
    const user = removeUser(socket.id);
    if (user) {
      io.to(user.room).emit(
        'message',
        generateMessage('Admin', `${user.username} left.`)
      );

      io.to(user.room).emit('roomData', {
        room: user.room,
        users: getUsersInRoom(user.room),
      });
    }
  });

  socket.on('sendMessage', (message, callback) => {
    const user = getUser(socket.id);
    socket.broadcast
      .to(user.room)
      .emit('message', generateMessage(user.username, message));
    callback();
  });

  socket.on('sendLocation', ({ latitude, longitude }, callback) => {
    const user = getUser(socket.id);
    socket.broadcast
      .to(user.room)
      .emit(
        'messageLocation',
        generateLocationMessage(
          user.username,
          `https://www.google.com/maps?q=${latitude},${longitude}`
        )
      );
    callback();
  });
});

server.listen(port, () => console.log(`App running on ${port}....`));
