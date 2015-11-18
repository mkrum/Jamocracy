var twilio = require('twilio')('ACdc7d3faac00d72c93a830191947c999a', 'dccfe5571db0d393c727cee38b68a730');
var bodyParser = require('body-parser');
var path = require('path');
var express = require('express'); // Express web server framework
var request = require('request'); // "Request" library
var querystring = require('querystring');
var cookieParser = require('cookie-parser');

var client_id = '0095976fe9c24fc5a6e4a7559e01f37e'; // Your client id
var client_secret = '967795bf432646f69797a1a7e7d97a0e'; // Your client secret
var redirect_uri = 'http://jamocracy.herokuapp.com/callback'; // Your redirect uri

var stateKey = 'spotify_auth_state';

var app = express();
var port = (process.env.PORT || 8080);
var server = app.listen(port);

app.use(express.static(__dirname + '/public'))
   .use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({extend: true}));
// app.use(express.static(__dirname + '/public'));
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
var generateRandomString = function(length) {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};


app.get('/login', function(req, res) {

  var state = generateRandomString(16);
  res.cookie(stateKey, state);

  // your application requests authorization
  var scope = 'playlist-read-private playlist-modify-public playlist-modify-private user-read-private';
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
  //res.sendFile(path.join(__dirname+'/public/info.html'));
  // your application requests refresh and access tokens
  // after checking the state parameter

  var code = req.query.code || null;
  var state = req.query.state || null;
  var storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState) {
    res.redirect('/#' +
      querystring.stringify({
        error: 'state_mismatch'
      }));
  } else {
    res.clearCookie(stateKey);
    var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code: code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code'
      },
      headers: {
        'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
      },
      json: true
    };

    request.post(authOptions, function(error, response, body) {
      if (!error && response.statusCode === 200) {

        var access_token = body.access_token,
            refresh_token = body.refresh_token;

        var options = {
          url: 'https://api.spotify.com/v1/me',
          headers: { 'Authorization': 'Bearer ' + access_token },
          json: true
        };

        // use the access token to access the Spotify Web API
        request.get(options, function(error, response, body) {
          console.log(body);
        });

        // we can also pass the token to the browser to make requests from there
        // res.redirect('/#' +
        //   querystring.stringify({
        //     access_token: access_token,
        //     refresh_token: refresh_token
        //   }));
		
        app.get('/info' + 
				queryString.stringify({
					access_token: access_token,
					refresh_token: refresh_token
		}));
      } else {
        res.redirect('/#' +
          querystring.stringify({
            error: 'invalid_token'
          }));
      }
    });
  }
});

app.get('/info', function(req, res){
	res.render('info.html');
	console.log(req.query.authToken);
});

app.get('/refresh_token', function(req, res) {
  // requesting access token from refresh token
  var refresh_token = req.query.refresh_token;
  var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
    form: {
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    },
    json: true
  };

  request.post(authOptions, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      var access_token = body.access_token;
      res.send({
        'access_token': access_token
      });
    }
  });
});

app.post('/callback', function(req, res) {
    var phoneNumber = req.body.phoneNumber;
    var playlistName = req.body.playlistName;
    var authToken = req.body.authToken;
	var userId = req.body.userId;
	var url = 'https://api.spotify.com/v1/users/'+userId+'/playlists';
	request.post(url, {form:
		{
			headers: {
				'Authorization': 'Bearer' + authToken,
				'Content-Type': 'applicaiton/json'
			}
			'name':playlistName,
			'public':true
		}
	}, function(err, response, body){
		if (err){
			alert('There was an error. Try again.');
		} else {
			 res.redirect('/success.html');
		}
	});

});



// app.get('/auth', function(req, res) {
// 	var code = req.query.code || null;
// 	console.log(code);
// 	res.sendFile(path.join(__dirname+'/public/info.html'));
// });
//
// app.get('/', function(req, res) {
// 	res.sendFile(path.join(__dirname+'/public/index.html'));
// });
//
// app.post('/SMS', function(req, res) {
// 	console.log(req.body.Body);
// });
//
// app.get('/create', function(req, res) {
// 	res.sendFile(path.join(__dirname+'/public/success.html'));
// });
//
// app.post('/create', function(req, res) {
// 	twilio.messages.create({
// 		to: req.body.admin,
// 		from: "+16305818347",
// 		body: req.body.playlist
// 	}, function(err, message) {
// 		process.stdout.write(message.sid);
// 	});
//
// });
