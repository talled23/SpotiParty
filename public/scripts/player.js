const socket = io();

document.getElementById('play-song').addEventListener("click", () => {
  socket.emit('play', { resume: false, songId: "3Ofmpyhv5UAQ70mENzB277" })
});

document.getElementById('pause-song').addEventListener("click", () => {
  socket.emit('pause')
});

document.getElementById('resume-song').addEventListener("click", () => {
  socket.emit('play', { resume: true, songId: null })
});
