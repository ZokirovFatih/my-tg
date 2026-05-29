const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

const USERS = {
  'Gulsevar': '123456',
  'Fotih': '123456'
};

let onlineUsers = {};
let messages = [];

app.post('/login', (req, res) => {
  const { login, password } = req.body;
  if (USERS[login] && USERS[login] === password) {
    res.json({ success: true, login });
  } else {
    res.json({ success: false, message: 'Неверный логин или пароль' });
  }
});

app.get('/messages', (req, res) => {
  res.json(messages);
});

io.on('connection', (socket) => {
  socket.on('join', (login) => {
    socket.login = login;
    onlineUsers[login] = socket.id;
    io.emit('online_users', Object.keys(onlineUsers));
  });

  socket.on('message', (msg) => {
    const data = { from: socket.login, text: msg.text, time: msg.time };
    messages.push(data);
    if (messages.length > 200) messages.shift();
    io.emit('message', data);
  });

  socket.on('typing', () => {
    socket.broadcast.emit('typing', { from: socket.login });
  });

  socket.on('stop_typing', () => {
    socket.broadcast.emit('stop_typing');
  });

  socket.on('disconnect', () => {
    if (socket.login) {
      delete onlineUsers[socket.login];
      io.emit('online_users', Object.keys(onlineUsers));
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log('Chat running on port ' + PORT));
