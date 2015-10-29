var twilio = require('twilio')('AC4b9bc22f0815b2447d7b82ad5faf8102', '5bbd3357d6fe47a146ec77516d0555b2');
var express = require('express');
//var compression = require('compression');
var bodyParser = require('body-parser');
var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extend: true}));

app.get('/SMS', function(req, res) {
	console.log(req.body.Body);
	//res.send(req.body.Body);
	res.send("hello");
});

app.get('/', function(req, res) {
	twilio.messages.create({
		to: '6304325433',
		from: '630581347',
		body: 'test'
	}, function(err, data){
		console.log("error");
	});
	res.send(":");
});

var port = process.env.PORT || 8080;

var server = app.listen(port, function() {
	console.log('running');
});

