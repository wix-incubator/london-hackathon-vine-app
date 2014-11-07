var express = require('express');
var Authentication = require('./app/authentication.js');
var routes = require('./app/routes.js');
var app = express();

app.use(express.static(__dirname + '/public'));

app.use('/bower_components',  express.static(__dirname + '/bower_components'));

app.set('views', __dirname+ '/app/views');
app.set('view engine', 'ejs');

//API
app.get('/vine/popular/:size', routes.vinePopular);
app.get('/vine/search/:q/:size', routes.vineSearch);
app.get('/vine/:videoId', routes.vineGetVideo);

//Templates
app.get('/widget', authenticate, routes.widget);
app.get('/settings', authenticate, routes.settings);


function authenticate(req, res, next) {
    if (req.query.debug) {
        next();
    } else {
        var authentication = new Authentication();
        authentication.authenticate(req, res, next);
    }
}

app.listen(process.env.PORT || 3010);
console.log('Express app started on port %d', process.env.PORT || 3010);
