
var net      = require('net');
var Server   = require('ws').Server;
var WSStream = require('wsstream');

var wsPort   = 8081;
var server   = module.exports = new Server({port: wsPort});