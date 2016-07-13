const express = require('express'),
    cookieParser = require('cookie-parser'),
    bodyParser = require('body-parser'),
    app = express();

app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

module.exports = app;
