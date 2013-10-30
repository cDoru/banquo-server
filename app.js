
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var http = require('http');
var path = require('path');
var banquo = require('../banquo/src/banquo.js');
var config = require('./config.json');

var app = express();



// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/users', user.list);


function whiteListHost(domain){
	domain = domain.replace(':' + app.get('port'), '');
	return (config.host_whitelist.indexOf(domain) != -1) ? true : false;
}

function errorResponse(res, type, more_info){
	more_info = (more_info) ? more_info : ''
	res.jsonp(500, { error: config.error_msgs[type] + more_info })
	return false;
}

function assembleSettings(opts){
	opts = opts.split('&');
	var settings = {};
	for(var i = 0; i < opts.length; i++){
		 var opt_arr = opts[i].split('=');
		if (config.opts_whitelist.indexOf(opt_arr[0]) != -1){
			settings[opt_arr[0]] = opt_arr[1];
		}else{
			return {status: false, error: opt_arr[0]};
		}
	}
	return {status: true, settings: settings};

}

app.enable("jsonp callback");
app.get("/:opts*", function(req, res) {
	if (whiteListHost(req.get('host'))){
		var result = assembleSettings(req.params.opts);

		if (result.status){
			banquo.capture(result.settings, function(image_data){
				res.jsonp(200, {image_data: image_data})
			});
		}else{
			errorResponse(res, 'opts', result.error);
		}

	}else{
		errorResponse(res, 'domain');
		console.log('Attempt from unauthorized domain: ' + req.get('host'));
	}
});


http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});