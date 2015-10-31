var twilio = require('twilio')('ACdc7d3faac00d72c93a830191947c999a', 'dccfe5571db0d393c727cee38b68a730');
var express = require('express');
var bodyParser = require('body-parser');
var queryString = require('querystring');
var app = express();

var clientID = '0095976fe9c24fc5a6e4a7559e01f37e';
var clientSecret = '967795bf432646f69797a1a7e7d97a0e';
var redirect_uri = 'http://jamocracy.herokuapp.com/auth';


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extend: true}));
app.use(express.static(__dirname + '/public'));


app.get('/login', function(req, res) {
	var scope = 'playlist-read-private playlist-read-colloborative playlist-modify-public playlist-modify-private user-read-private';
	res.redirect('https://accounts.spotify.com/authorize?' +
			queryString.stringify({
				response_type: 'code',
				client_id: client_id,
			    scope: scope,
			    redirect_uri: redirect_uri
    }));
});



app.post('/SMS', function(req, res) {
	twilio.messages.create({
		to: '+16304325433',
		from: '+16305818347',
		body: req.body.Body
	}, function(err, data){
		console.error(err);
	});

});

app.get('/', function(req, res) {
		//var btn = document.createElement('BUTTON');
		//var text = document.createTextNode("Log in");
		//btn.appendChild(text);
		//document.body.appendChild(btn);
});

var port = process.env.PORT || 8080;

var server = app.listen(port, function() {
	console.log('running');
});

