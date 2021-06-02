const socket = io();

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
}

document.getElementById('play-song').addEventListener("click", () => {
  const songId = document.getElementById('search-bar').value;
  socket.emit('play', { resume: false, songId })
});

document.getElementById('pause-song').addEventListener("click", () => {
  socket.emit('pause')
});

document.getElementById('resume-song').addEventListener("click", () => {
  socket.emit('play', { resume: true, songId: null })
});

document.getElementById('search-button').addEventListener("click", (e) => {
  e.preventDefault();
  fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(document.getElementById('search-bar').value)}&type=track&market=US&limit=5`, {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getCookie("spotify_access")}`
    }
  }).then(response => response.json())
      .then((data) => {
        data.tracks.items.forEach((track) => {
          const explicit = track.explicit ? "[Explicit] " : "";
          console.log(`${track.name} ${explicit}by ${track.artists[0].name} | ${track.id}`)
        });
      });
})
