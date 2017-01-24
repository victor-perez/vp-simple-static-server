/* jshint node: true */
'use static';
var express     = require('express'),
    _           = require('underscore'),
    colors      = require('colors'),
    http        = require('http'),
    https       = require('https'),
    http2       = require('http2'),
    open        = require('open'),
    util        = require('util'),
    path        = require('path'),
    fs          = require('fs'),
	compression = require('compression');
/**
 * @param  {String|Object} configuration
 * @return {Object} express application
 */
module.exports = function (configuration)  {
    var config = configuration || {},
        app = express(),
        server, url;
    /**
     * Open URL in default browser
     * @param  {String} host
     * @param  {Number} port
     */
    function openUrl (host, port, proto) {
        //replace 0.0.0.0
        if (host === '0.0.0.0') {
            host = '127.0.0.1';
        }
        //open on default HTTP port
        if (port === 80 && proto === 'http') {
            open('http://' + host);
        //open on default HTTPS port
        } else if (port === 443 && proto === 'https') {
            open('https://' + host);
        } else {
            open(util.format('%s://%s:%s', proto, host, port));
        }
    }
    //set default values
    config = _.defaults(config, {
        root: './',
        static: {}, //http://expressjs.com/4x/api.html#express.static
        host: '0.0.0.0',
        port: 0,
        open: true,
        https: false,
        http2: false,
        compression: true
    });
    console.dir(config);
    //if HTTPS is true set default dummy key and cert
    if (config.https === true || config.http2 && !config.https) {
        config.https = {
            key: fs.readFileSync(path.normalize(__dirname + '/../ssl/127.0.0.1.key')),
            cert: fs.readFileSync(path.normalize(__dirname + '/../ssl/127.0.0.1.cert'))
        };
    }
	//set compression
	if (config.compression) {
		app.use(compression());
	}
    //set static path
    app.use(express.static(config.root, config.static));
    //create server
    if (config.https && !config.http2) {
        server = https.createServer(config.https, app);
        app.set('https', server);
    } else if (config.http2) {
        console.log('http2')
        server = http2.createServer(config.https, function () {
            app()
        });
        //app.set('https', server);
    } else {
        server = http.createServer(app);
        app.set('http', server);
    }
    //start listing
    server.listen({
        port: config.port,
        host: config.host
    }, function () {
        var host = server.address().address,
            port = server.address().port,
            proto = config.https ? 'https' : 'http';
        //set url
        url = util.format('%s://%s:%s', proto, host, port);
        //log
        console.log(colors.magenta('vp-simple-server') + ' listening at ' + colors.green(url));
        //open URL in default browser?²
        if (config.open) {
            openUrl(host, port, proto);
        }
    });
    //return the Express application
    return app;
};