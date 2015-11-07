var express = require('express');
var bodyParser = require('body-parser');
var queryString = require('querystring');
var path = require('path');
var app = express();

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

var port = process.env.PORT || 8080;

var server = app.listen(port, function() {

});

