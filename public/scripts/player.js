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
  if (isPlaying) {
    socket.emit('pause')
  } else {
    socket.emit('play', { resume: true, songId: null })
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
  const playlists = []
  const ids = []

  const d = document.getElementById("search-results-tracks")
  const de = document.getElementById("search-results-albums")
  const dee = document.getElementById("search-results-playlists")
  d.innerHTML = ""; //tracks
  de.innerHTML = ""; //albums
  dee.innerHTML = ""; //playlists

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
        de.innerHTML += `<li><a><iframe src="https://open.spotify.com/embed/album/${album.id}" width="275" height="170" style="border:0;" allowtransparency="true" allow="encrypted-media"></iframe><button style="background-color:black; margin-bottom:20px" id="button${cur}"><img src="https://i.ibb.co/L8zNQK1/queue-pink.png" style="background-color:black" width = "30" height = "30"></button></a></li>`
      });
      const items = de.getElementsByTagName("li");
      for (let i = 0; i < albums.length; i++) {
        items[i].addEventListener("click", () => {
          document.getElementById("search-bar").value = albums[i];
          const pause = document.getElementById('pause-song');
          const albumId = document.getElementById('search-bar').value;

          // playing the song
          socket.emit('add_queue', {type: "album", id: albumId})
          setTimeout(() => {
            if (!isPlaying) {
              socket.emit('play', {resume: false, offset: 0})
              pause.innerHTML = '<img src = "https://i.ibb.co/m9KLYs7/pause.png" width = "30" height = "30">';
              isPlaying = true;
            }
          }, 250)
        })
      }
    });

    fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(document.getElementById('search-bar').value)}&type=playlist&market=US&limit=3`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getCookie("spotify_access")}`
      }
    }).then(response => response.json()).then((data) => {
      data.playlists.items.forEach((playlist) => {
        playlists.push(playlist.id)
        dee.innerHTML += `<li><a><iframe src="https://open.spotify.com/embed/playlist/${playlist.id}" width="275" height="170" style="border:0;" allowtransparency="true" allow="encrypted-media"></iframe><button style="background-color:black; margin-bottom:20px" id="button${cur}"><img src="https://i.ibb.co/L8zNQK1/queue-pink.png" style="background-color:black" width = "30" height = "30"></button></a></li>`
      });
      const items = dee.getElementsByTagName("li");
      for (let i = 0; i < playlists.length; i++) {
        items[i].addEventListener("click", () => {
          document.getElementById("search-bar").value = playlists[i];
          const pause = document.getElementById('pause-song');
          const playlistId = document.getElementById('search-bar').value;

          // playing the song
          socket.emit('add_queue', {type: "playlist", id: playlistId})
          setTimeout(() => {
            if (!isPlaying) {
              socket.emit('play', {resume: false, offset: 0})
              pause.innerHTML = '<img src = "https://i.ibb.co/m9KLYs7/pause.png" width = "30" height = "30">';
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
        d.innerHTML += `<li><a><iframe src="https://open.spotify.com/embed/track/${track.id}" width="275" height="80" style="border:0;" allowtransparency="false" allow="encrypted-media"></iframe><button style="background-color:black; margin-bottom:20px"><img src="https://i.ibb.co/L8zNQK1/queue-pink.png" style="background-color:black" width = "30" height = "30"></button></a></li>`
      });
      const items = d.getElementsByTagName("li");
      for (let i = 0; i < ids.length; i++) {
        items[i].addEventListener("click", () => {
          document.getElementById("search-bar").value = ids[i];
          const pause = document.getElementById('pause-song');
          const songId = document.getElementById('search-bar').value;
          // playing the song
          socket.emit('add_queue', {type: "track", id: songId})
          if (!isPlaying) {
            socket.emit('play', {resume: false, offset: 0})

            pause.innerHTML = '<img src = "https://i.ibb.co/m9KLYs7/pause.png" width = "30" height = "30">';
            isPlaying = true;
          }
        });
      }
    });
  }
});

document.getElementById('bg-button').addEventListener("click", (e) => {
  e.preventDefault();
  var linky = document.getElementById("pog").value;
  if (linky == ""){
    linky = "https://wallpapercave.com/wp/wp2336997.jpg"
  }
  socket.emit("bg", linky);
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

document.getElementById('clear').addEventListener("click", () => {
  socket.emit('clear')
})

document.getElementById('save').addEventListener('click', () => {
  socket.emit('save')
})

socket.on('image_url', (url) => {
  document.getElementById('track-pic').src = url;
  if(url !== "https://i0.wp.com/www.furnacemfg.com/wp-content/uploads/2015/02/vinyl.png?fit=350%2C350&ssl=1"){
    const img = new Image();

    img.addEventListener('load', function()  {
      let rgb = getAverageColor(img);
      document.getElementsByTagName("SPAN")[1].style.backgroundColor = 'rgb(' + rgb.r + ', ' + rgb.g + ', ' + rgb.b + ')';
    });

    img.crossOrigin = 'Anonymous';
    img.src = url;
  }
  document.querySelector('#user-profile h1').innerHTML = '<h1>Logged in</h1>'
});

socket.on('song_duration_ms', (duration, val) => {
  const slider = document.getElementById("customRange1")
  slider.max = duration/1000;
  slider.value=val
  document.querySelector('#user-profile h1').innerHTML = '<h1>Logged in</h1>'
});

socket.on('pause', () => {
  document.getElementById("track-pic").setAttribute('class', 'track-pic paused')
  document.getElementById('pause-song').innerHTML = '<img src = "https://i.ibb.co/ryMjBM8/play-pink.png" width = "30" height = "30">';
  isPlaying = false;
  document.querySelector('#user-profile h1').innerHTML = '<h1>Logged in</h1>'
});

socket.on('resume', () => {
  document.getElementById("track-pic").setAttribute('class', 'track-pic')
  document.getElementById('pause-song').innerHTML = '<img src = "https://i.ibb.co/m9KLYs7/pause.png" width = "30" height = "30">';
  isPlaying = true;
  document.querySelector('#user-profile h1').innerHTML = '<h1>Logged in</h1>'
});

socket.on('added_queue', ( songId ) => {
  document.getElementById('queue').innerHTML += `<li><iframe src="https://open.spotify.com/embed/track/${songId}" id="song${songId}" width="250" height="80" style="border:0;" allowTransparency="false" allow="encrypted-media"></iframe><i style="margin-left: 10px; margin-right: 10px;" class="fas fa-times" id="${songId}"></i></li>`
  document.querySelector('#user-profile h1').innerHTML = '<h1>Logged in</h1>'
});

socket.on('queue_pos', (index, max) => {
  const queue = document.querySelectorAll('#queue li iframe');
  if (index > 0) {
    queue[index-1].style.border = 0;
  }
  if (index < max - 1) {
    queue[index+1].style.border = 0;
  }
  queue[index].style.border = "#0ff solid 2px";
  document.querySelector('#user-profile h1').innerHTML = '<h1>Logged in</h1>'
});

socket.on('clear', () => {
  document.getElementById('queue').innerHTML = "";
  document.getElementsByClassName('ring')[0].style.backgroundColor = "yellow";
  document.querySelector('#user-profile h1').innerHTML = '<h1>Logged in</h1>'
});

socket.on('logs', (msg) => {
  const textarea = document.getElementById("texty")
  textarea.value += `\n${msg}`;
  if(textarea.selectionStart === textarea.selectionEnd) {
    textarea.scrollTop = textarea.scrollHeight;
  }
  document.querySelector('#user-profile h1').innerHTML = '<h1>Logged in</h1>'
});

socket.on('bg', (linky) =>{
  document.body.setAttribute("style", "background-image: url(" + linky + ")")
  document.querySelector('#user-profile h1').innerHTML = '<h1>Logged in</h1>'
})

socket.on('users', (users) => {
  const board = document.getElementById('users-ul')
  if (typeof(users) === "object") {
    board.value = "USERS:";
    for (let i = 0; i < users.length; i++) {
      board.value += `\n${users[i]}`;
    }
  } else {
    board.value += `\n${users}`;
  }
  document.querySelector('#user-profile h1').innerHTML = '<h1>Logged in</h1>'
})

socket.on('error', (msg) => {
  document.querySelector('#user-profile h1').innerHTML = `<h1 style="color:red; background-color: #14121b; margin-bottom: 30px; padding: 10px; box-shadow: 0px 0px 5px 5px #0ff;">${msg}</h1>`
})

window.onload = () => {
  socket.on('chat', (msg) => {
    document.querySelector('#user-profile h1').innerHTML = '<h1>Logged in</h1>'
    var textarea = document.getElementById("texty")
    textarea.value += `\n${msg}`;
    if(textarea.selectionStart === textarea.selectionEnd) {
      textarea.scrollTop = textarea.scrollHeight;
    }
  });

  document.getElementById('msg-button').addEventListener("click", (e) => {
    // alert('hello')
    e.preventDefault();
    if (document.getElementById('msg-input').value !== "") {
      socket.emit('chat', document.getElementById('msg-input').value);
      document.getElementById('msg-input').value = "";
    }
  });
};
