const socket = io();

let offset = 0;

document.getElementById('play-song').addEventListener("click", () => {
  socket.emit('play', { songId: "3Ofmpyhv5UAQ70mENzB277", position_ms: offset})
})

document.getElementById('pause-song').addEventListener("click", () => {
  socket.emit('pause')
})