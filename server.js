const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

// データの状態
let queueData = {
  calling: [], // 呼び出し中
  waiting: []  // 待ち
};

io.on('connection', (socket) => {
  // 初期データの送信
  socket.emit('update', queueData);

  // 番号の発行（追加）
  socket.on('add-number', (number) => {
    if (!number) return;
    queueData.waiting.push(number);
    io.emit('update', queueData);
  });

  // 呼び出し（待ち -> 呼び出し中 へ移動）
  socket.on('call-number', (number) => {
    const index = queueData.waiting.indexOf(number);
    if (index !== -1) {
      queueData.waiting.splice(index, 1);
      queueData.calling.unshift(number); // 最新を先頭に
      io.emit('update', queueData);
      io.emit('play-audio', number); // 音声読み上げイベントを発火
    }
  });

  // 完了（呼び出し中リストから削除）
  socket.on('remove-calling', (number) => {
    queueData.calling = queueData.calling.filter(n => n !== number);
    io.emit('update', queueData);
  });

  // 待ちリストから手動削除
  socket.on('remove-waiting', (number) => {
    queueData.waiting = queueData.waiting.filter(n => n !== number);
    io.emit('update', queueData);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});