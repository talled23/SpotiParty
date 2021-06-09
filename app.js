/**
 * This is an example of a basic node.scripts script that performs
 * the Authorization Code oAuth2 flow to authenticate against
 * the Spotify Accounts.
 *
 * For more information, read
 * https://developer.spotify.com/web-api/authorization-guide/#authorization_code_flow
 */
const express = require("express"); // Express web server framework
const request = require("request"); // "Request" library
const cors = require("cors");
const querystring = require("querystring");
const cookieParser = require("cookie-parser");
const http = require('http');
const { Server } = require("socket.io");
const SpotifyWebApi = require('spotify-web-api-node')

require('dotenv').config()
const client_id = process.env.CLIENT_ID; // Your client id
const client_secret = process.env.CLIENT_SECRET; // Your secret
const redirect_uri = process.env.REDIRECT_URI; // Your redirect uri

/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
const generateRandomString = function(length) {
  let text = "";
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

const stateKey = "spotify_auth_state";

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname + '/public'))
   .use(cors())
   .use(cookieParser());

app.get('/login', function(req, res) {

  const state = generateRandomString(16);
  res.cookie(stateKey, state);

  // your application requests authorization
  const scope = "user-read-private user-read-email user-read-playback-state user-modify-playback-state";
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state
    }));
});

app.get('/callback', function(req, res) {
  const code = req.query.code || null;
  const state = req.query.state || null;
  const storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState) {
    res.redirect('/#' +
      querystring.stringify({
        error: 'state_mismatch'
      }));
  } else {
    res.clearCookie(stateKey);
    const authOptions = {
      url: "https://accounts.spotify.com/api/token",
      form: {
        code: code,
        redirect_uri: redirect_uri,
        grant_type: "authorization_code"
      },
      headers: {
        "Authorization": "Basic " + (new Buffer(client_id + ":" + client_secret).toString("base64"))
      },
      json: true
    };

    request.post(authOptions, function(error, response, body) {
      if (!error && response.statusCode === 200) {

        const access_token = body.access_token,
          refresh_token = body.refresh_token;

        const options = {
          url: "https://api.spotify.com/v1/me",
          headers: {"Authorization": "Bearer " + access_token},
          json: true
        };

        // use the access token to access the Spotify Web API
        request.get(options, function(error, response, body) {
          // console.log(body);
        });

        res.cookie("spotify_access", access_token);
        res.cookie("spotify_refresh", refresh_token);

        res.redirect('/');
      } else {
        res.redirect('/#' +
          querystring.stringify({
            error: 'invalid_token'
          }));
      }
    });
  }
});

app.get('/refresh_token', function(req, res) {

  // requesting access token from refresh token
  const refresh_token = req.query.refresh_token;
  const authOptions = {
    url: "https://accounts.spotify.com/api/token",
    headers: {"Authorization": "Basic " + (new Buffer(client_id + ":" + client_secret).toString("base64"))},
    form: {
      grant_type: "refresh_token",
      refresh_token: refresh_token
    },
    json: true
  };

  request.post(authOptions, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      const access_token = body.access_token;
      res.send({
        'access_token': access_token
      });
    }
  });
});

// responsible for server to maintain data on songs
let song_time_ms = 0;
let duration = 1;
let isPlaying = false;
let url = "https://i0.wp.com/www.furnacemfg.com/wp-content/uploads/2015/02/vinyl.png?fit=350%2C350&ssl=1"
const users = {};
const queue = []; // queue of songIds
let queue_pos = 0; // position in queue

setInterval(() => {
  if (isPlaying) {
    song_time_ms++;
  }
}, 1000)

io.on('connection', (connection) => {
  connection.on('logged_in', ({ access_token, display_name }) => {
    console.log("=============================================")
    console.log(`Socket ${connection.id} (${display_name}) has logged in with token ${access_token}`)
    console.log("=============================================")

    const spotifyApi = new SpotifyWebApi({
      clientId: client_id,
      clientSecret: client_secret,
      redirectUri: redirect_uri
    });

    spotifyApi.setAccessToken(access_token);

    users[connection.id] = {
      spotify_api: spotifyApi,
      access_token,
      display_name
    };

    if (isPlaying)
      connection.emit('resume')
    else
      connection.emit('pause')
    connection.emit("image_url", url)
    connection.emit("song_duration_ms", duration, song_time_ms)
  })

  connection.on('sync', async() => {
    for (const socket in users) {
      await users[socket].spotify_api.play({
        "uris": [`spotify:track:${queue[queue_pos]}`],
        "position_ms": song_time_ms * 1000
      });
    }

    if (isPlaying)
      connection.emit('resume')
    else {
      connection.emit('pause')
    }
    connection.emit("song_duration_ms", duration, song_time_ms)
  })

  connection.on('add_queue', async ({ isCollection, id }) => {
    if (isCollection) {
      await users[connection.id].spotify_api.getAlbum(id).then((data) => {
        data.body.tracks.items.forEach((track) => {
          queue.push(track.id)
        })
      })
    }
    else {
      queue.push(id);
    }
  })

  connection.on('play', async ({ resume, offset }) => {

    if (!resume) {
      await users[connection.id].spotify_api.getTrack(queue[queue_pos]).then((data)=> {
        url = data.body.album.images[0].url
        duration = data.body.duration_ms;
      });

      await io.emit('image_url', url);
      await io.emit('song_duration_ms', duration, 0)
      console.log(`User ${users[connection.id].display_name} has played song ${queue[queue_pos]}`);

      for (const socket in users) {
        await users[socket].spotify_api.play({
          "uris": [`spotify:track:${queue[queue_pos]}`],
          "position_ms": offset
        });
      }

      song_time_ms = 0;

    } else {
      console.log(`User ${users[connection.id].display_name} has resumed playback.`);
      await users[connection.id].spotify_api.play();
    }
    isPlaying = true;
    connection.emit('resume')
  })

  connection.on('pause', async () => {
    console.log(`User ${users[connection.id].display_name} has paused playback.`);

    for (const socket in users) {
      await users[socket].spotify_api.pause();
      connection.emit('pause')
    }
    isPlaying = false;
  });

  connection.on('seek', async(time) => {
    console.log(`User ${users[connection.id].display_name} moved the song to time: ${time}.`);
    let song_id;
    await users[connection.id].spotify_api.getMyCurrentPlayingTrack().then((data) => {
      song_id = data.body.item.id;
    })

    for (const socket in users) {
      await users[socket].spotify_api.play({
        "uris": [`spotify:track:${song_id}`],
        "position_ms": time * 1000
      })
    }
  })

  connection.on('rewind', async() => {
    if (queue_pos > 0) {
      console.log(`User ${users[connection.id].display_name} hit rewind.`);

      for (const socket in users) {
        await users[socket].spotify_api.play({
          "uris": [`spotify:track:${queue[--queue_pos]}`],
          "position_ms": 0
        })
      }

      await users[connection.id].spotify_api.getTrack(queue[queue_pos]).then((data) => {
        url = data.body.album.images[0].url
        duration = data.body.duration_ms;
      });

      io.emit('image_url', url);
      io.emit('song_duration_ms', duration, 0)
      song_time_ms = 0;
    }
  })

  connection.on('skip', async() => {
    if (queue_pos + 1 < queue.length) {
      console.log(`User ${users[connection.id].display_name} skipped the current song.`);

      for (const socket in users) {
        await users[socket].spotify_api.play({
          "uris": [`spotify:track:${queue[++queue_pos]}`],
          "position_ms": 0
        })
      }

      await users[connection.id].spotify_api.getTrack(queue[queue_pos]).then((data) => {
        url = data.body.album.images[0].url
        duration = data.body.duration_ms;
      });

      io.emit('image_url', url);
      io.emit('song_duration_ms', duration, 0)
      isPlaying = true;
      song_time_ms = 0;
    }
  })
});

const PORT = process.env.PORT || 8888;

server.listen(PORT, () => {
  console.log(`Server is now connected and listening on ${PORT}`);
});
