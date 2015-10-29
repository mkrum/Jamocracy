var twilio = require('twilio')('ACdc7d3faac00d72c93a830191947c999a', 'dccfe5571db0d393c727cee38b68a730');
var express = require('express');
//var compression = require('compression');
var bodyParser = require('body-parser');
var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extend: true}));

app.post('/SMS', function(req, res) {
	twilio.messages.create({
		body: 'test',
		to: '16304325433',
		from: '630581347'
	}, function(err, data){
		console.log("error");
	});
	console.log(req.body.Body);
	//res.send(req.body.Body);
	res.send("hello");
});

app.get('/', function(req, res) {
	res.send(":");
});

var port = process.env.PORT || 8080;

var server = app.listen(port, function() {
	console.log('running');
});

