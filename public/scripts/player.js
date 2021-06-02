const socket = io();

document.getElementById('play-song').addEventListener("click", () => {
  socket.emit('play', { songId: "3Ofmpyhv5UAQ70mENzB277" })
})