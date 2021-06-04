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
          d.innerHTML += `<li><a><iframe src="https://open.spotify.com/embed/track/${track.id}" width="300" height="80" frameborder="0" allowtransparency="false" allow="encrypted-media"></iframe></a></li>`
        });
        const items = d.getElementsByTagName("li");
        for (let i = 0; i < ids.length; i++) {
          items[i].addEventListener("click", () => {
            document.getElementById("search-bar").value = ids[i];
            const pause = document.getElementById('pause-song');
            const songId = document.getElementById('search-bar').value;
            // playing the song
            socket.emit('play', { resume: false, songId, offset:0 })
            pause.innerHTML = '<i class="fas fa-pause" aria-hidden="true"></i>';
            isPlaying = true;
          });
        }
      });
});

document.getElementById("customRange1").addEventListener("click", () => {
  socket.emit('seek', document.getElementById("customRange1").value)
});

socket.on('image_url', (url) => {
  document.getElementById('track-pic').src = url;
});

socket.on('song_duration_ms', (duration) => {
  document.getElementById("customRange1").max = duration/1000;
});