var twilio = require('twilio')('ACdc7d3faac00d72c93a830191947c999a', 'dccfe5571db0d393c727cee38b68a730');
var express = require('express');
var bodyParser = require('body-parser');
var queryString = require('querystring');
var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extend: true}));
app.use(express.static(__dirname + '/public'));


app.get('/auth', function(req, res) {
	res.sendFile(express.static(__dirname + '/public'));
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

var port = process.env.PORT || 8080;

var server = app.listen(port, function() {
	console.log('running');
});

