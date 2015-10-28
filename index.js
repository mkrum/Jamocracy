var twilio = require('twilio')('ACdc7d3faac00d72c93a830191947c999a', 'dccfe5571db0d393c727cee38b68a730');
var express = require('express');
var bodyParser = require('body-parser'); 
var app = express();

app.use(express.urlencoded());

app.post('/recieveSMS', function(req, res) {
	console.log(req.body.Body);
	res.send(req.body.Body);
	res.send(" world");
});

app.get('/', function(req, res) {
	res.send("hello");
});


var server = app.listen(8000, function() {
	var host = server.address().address;
	var port = server.address().port;
});

