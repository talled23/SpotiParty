const socket = io();

let isPlaying = false;

// document.getElementById('play-song').addEventListener("click", () => {
//   const pause = document.getElementById('pause-song');
//   const songId = document.getElementById('search-bar').value;
//   socket.emit('play', { resume: false, songId })
//   pause.innerHTML = '<i class="fas fa-pause" aria-hidden="true"></i>';
//   isPlaying = true;
// });

document.getElementById('pause-song').addEventListener("click", () => {
  const pause = document.getElementById('pause-song');

  if (isPlaying) {
    socket.emit('pause')
    pause.innerHTML = '<i class="fas fa-play" aria-hidden="true"></i>';
    isPlaying = false;
  } else {
    socket.emit('play', { resume: true, songId: null })
    pause.innerHTML = '<i class="fas fa-pause" aria-hidden="true"></i>';
    isPlaying = true;
  }
});

// document.getElementById('resume-song').addEventListener("click", () => {
//   socket.emit('play', { resume: true, songId: null })
// });
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
}


document.getElementById('search-button').addEventListener("click", (e) => {
  e.preventDefault();
  let ids = []
  const d = document.getElementById("search-results")
  d.innerHTML = "";
  fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(document.getElementById('search-bar').value)}&type=track&market=US&limit=5`, {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getCookie("spotify_access")}`
    }
  }).then(response => response.json()).then((data) => {
        data.tracks.items.forEach((track) => {
          ids.push(track.id)
          const explicit = track.explicit ? "[Explicit] " : "";
          // console.log(`${track.name} ${explicit} by ${track.artists[0].name} | ${track.id}`)
          d.innerHTML += `<li><a>${track.name} ${explicit} by ${track.artists[0].name} | ${track.id}</a></li>`
        });
        const items = d.getElementsByTagName("li");
        for (let i = 0; i < ids.length; i++) {
          items[i].addEventListener("click", () => {
            document.getElementById("search-bar").value = ids[i];
            const pause = document.getElementById('pause-song');
            const songId = document.getElementById('search-bar').value;
            socket.emit('play', { resume: false, songId })
            pause.innerHTML = '<i class="fas fa-pause" aria-hidden="true"></i>';
            isPlaying = true;
          })
        }
      });
})

socket.on('image_url', (url) => {
  document.getElementById('track-pic').src = url;
})