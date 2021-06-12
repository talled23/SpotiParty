const socket = io();

let isPlaying = false;

// document.getElementById('play-song').addEventListener("click", () => {
//   const pause = document.getElementById('pause-song');
//   const songId = document.getElementById('search-bar').value;
//   socket.emit('play', { resume: false, songId })
//   pause.innerHTML = '<i class="fas fa-pause" aria-hidden="true"></i>';
//   isPlaying = true;
// });

function getAverageColor(img) {
  var canvas = document.createElement('canvas');
  var ctx = canvas.getContext('2d');
  var width = canvas.width = img.naturalWidth;
  var height = canvas.height = img.naturalHeight;

  ctx.drawImage(img, 0, 0);

  var imageData = ctx.getImageData(0, 0, width, height);
  var data = imageData.data;
  var r = 0;
  var g = 0;
  var b = 0;

  for (var i = 0, l = data.length; i < l; i += 4) {
    r += data[i];
    g += data[i+1];
    b += data[i+2];
  }

  r = Math.floor(r / (data.length / 4));
  g = Math.floor(g / (data.length / 4));
  b = Math.floor(b / (data.length / 4));

  return { r: r, g: g, b: b };
}

setInterval(() => {
  const slider = document.getElementById("customRange1");
  if (isPlaying) {
    slider.value = parseInt(slider.value) + 1;
  }
  if (parseInt(slider.value) === Math.floor(parseInt(slider.max))) {
    socket.emit('skip')
  }
}, 1000);

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

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
}

document.getElementById('search-button').addEventListener("click", (e) => {
  e.preventDefault();

  const albums = []
  const ids = []

  const d = document.getElementById("search-results-tracks")
  const de = document.getElementById("search-results-albums")
  d.innerHTML = "";
  de.innerHTML = "";

  //differentiate between buttons
  let cur = 0

  if(document.getElementById("search-bar").value !== document.getElementById('search-bar').defaultValue) {

    fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(document.getElementById('search-bar').value)}&type=album&market=US&limit=3`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getCookie("spotify_access")}`
      }
    }).then(response => response.json()).then((data) => {
      data.albums.items.forEach((album) => {
        albums.push(album.id)
        de.innerHTML += `<li><a><iframe src="https://open.spotify.com/embed/album/${album.id}" width="100%" height="170" style="border:0;" allowtransparency="true" allow="encrypted-media"></iframe><button id="button${cur}">play</button></a></li>`
      });
      const items = de.getElementsByTagName("li");
      for (let i = 0; i < albums.length; i++) {
        items[i].addEventListener("click", () => {
          document.getElementById("search-bar").value = albums[i];
          const pause = document.getElementById('pause-song');
          const albumId = document.getElementById('search-bar').value;

          // playing the song
          socket.emit('add_queue', {isCollection: true, id: albumId})
          setTimeout(() => {
            if (!isPlaying) {
              socket.emit('play', {resume: false, offset: 0})
              pause.innerHTML = '<i class="fas fa-pause" aria-hidden="true"></i>';
              isPlaying = true;
            }
          }, 250)
        })
      }
    });

    fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(document.getElementById('search-bar').value)}&type=track&market=US&limit=5`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getCookie("spotify_access")}`
      }
    }).then(response => response.json()).then((data) => {
      data.tracks.items.forEach((track) => {
        ids.push(track.id)
        d.innerHTML += `<li><a><iframe src="https://open.spotify.com/embed/track/${track.id}" width="300" height="80" style="border:0;" allowtransparency="false" allow="encrypted-media"></iframe><button>play</button></a></li>`
      });
      const items = d.getElementsByTagName("li");
      for (let i = 0; i < ids.length; i++) {
        items[i].addEventListener("click", () => {
          document.getElementById("search-bar").value = ids[i];
          const pause = document.getElementById('pause-song');
          const songId = document.getElementById('search-bar').value;
          // playing the song
          socket.emit('add_queue', {isCollection: false, id: songId})
          if (!isPlaying) {
            socket.emit('play', {resume: false, offset: 0})

            pause.innerHTML = '<i class="fas fa-pause" aria-hidden="true"></i>';
            isPlaying = true;
          }
        });
      }
    });
  }
});

document.getElementById("customRange1").addEventListener("click", () => {
  socket.emit('seek', document.getElementById("customRange1").value)
});

document.getElementById("rewind").addEventListener("click", () => {
  socket.emit('rewind')})

document.getElementById("skip").addEventListener("click", () => {
  socket.emit('skip')
})

document.getElementById("sync").addEventListener("click", () => {
  socket.emit('sync')
})

socket.on('image_url', (url) => {
  document.getElementById('track-pic').src = url;
  if(url != "https://i0.wp.com/www.furnacemfg.com/wp-content/uploads/2015/02/vinyl.png?fit=350%2C350&ssl=1"){
    const img = new Image();

    img.addEventListener('load', function()  {
      var rgb = getAverageColor(img);
      var rgbStr = 'rgb(' + rgb.r + ', ' + rgb.g + ', ' + rgb.b + ')';
      document.getElementsByTagName("SPAN")[1].style.backgroundColor = rgbStr;
    });

    img.crossOrigin = 'Anonymous';
    img.src = url;
  }
});

socket.on('song_duration_ms', (duration, val) => {
  const slider = document.getElementById("customRange1")
  slider.max = duration/1000;
  slider.value=val
});

socket.on('pause', () => {
  document.getElementById("track-pic").setAttribute('class', 'track-pic paused')
  document.getElementById('pause-song').innerHTML = '<i class="fas fa-play" aria-hidden="true"></i>';
  isPlaying = false;
})

socket.on('resume', () => {
  document.getElementById("track-pic").setAttribute('class', 'track-pic')
  document.getElementById('pause-song').innerHTML = '<i class="fas fa-pause" aria-hidden="true"></i>';
  isPlaying = true;
})

socket.on('added_queue', ( songId ) => {
  document.getElementById('queue').innerHTML += `<li><iframe src="https://open.spotify.com/embed/track/${songId}" width="250" height="80" style="border:0;" allowTransparency="false" allow="encrypted-media"></iframe></li>`
})

socket.on('queue_pos', (index, max) => {
  const queue = document.querySelectorAll('#queue li iframe');
  if (index > 0) {
    queue[index-1].style.border = 0;
  }
  if (index < max) {
    queue[index+1].style.border = 0;
  }
  queue[index].style.border = "#0ff solid 2px";
})