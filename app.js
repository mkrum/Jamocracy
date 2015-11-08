var twillio = require('twilio')('ACdc7d3faac00d72c93a830191947c999a', 'dccfe5571db0d393c727cee38b68a730');
var express = require('express');
var bodyParser = require('body-parser');
var queryString = require('querystring');
var path = require('path');
var app = express();
var port = process.env.PORT || 8080;
var server = app.listen(port);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extend: true}));
app.use(express.static(__dirname + '/public'));


app.get('/auth', function(req, res) {
	res.sendFile(path.join(__dirname+'/public/info.html'));
});

app.get('/', function(req, res) {
	res.sendFile(path.join(__dirname+'/public/index.html'));
});

app.post('/SMS', function(req, res) {
	console.log(req.body.Body);
});

app.get('/create', function(req, res) {
	res.sendFile(path.join(__dirname+'/public/success.html'));
});


app.post('/create', function(req, res) {
	twilio.messages.create({
		to: "+16304325433",
		from: "+16305818347",
		body: 'test'
	}) function(err, message) {
		process.stdout.write(message.sid);
	});
});


