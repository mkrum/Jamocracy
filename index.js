var twilio = require('twilio')('ACdc7d3faac00d72c93a830191947c999a', 'dccfe5571db0d393c727cee38b68a730');
var express = require('express');
var app = express();


app.post('/recieveSMS', function(req, res) {
	console.log(req.body.Body);
	res.send(req.body.Body);
	res.send(" world");
});

app.get('/', function(req, res) {
	res.send("hello");
	console.log("check");

});

var port = process.env.PORT || 8080;
var server = app.listen(port, function() {
	console.log('running');
});

