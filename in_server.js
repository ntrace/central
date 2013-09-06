var assert = require('assert');
var net    = require('net');
var rpc    = require('rpc-stream');
var async  = require('async');
var db     = require('./db');
var key    = require('./key');

var server = module.exports = net.createServer(handleConnection);

function handleConnection(conn) {
  var server = rpc(interface);
  server.pipe(conn).pipe(server);
}

var interface = {
  result: result
};

function result(args, cb) {
  var doc = args[0];

  assert(doc, 'need result doc');

  assert(doc.id,     'need doc.id');
  assert(doc.run_id, 'need doc.run_id');
  assert(doc.repo,   'need doc.repo');
  assert(doc.commit, 'need doc.commit');
  assert(doc.stream, 'need doc.stream');
  assert(doc.data,   'need doc.data');
  assert(doc.when,   'need doc.when');

  var batch = [{
    prefix:  db.results,
    key:     key([doc.run_id, doc.stream, doc.when]),
    value:   doc.data,
    type:    'put'
  }];

  var creating = {};

  var k = key([doc.repo, doc.run_id]);
  db.runs.get(k, function(err, exists) {
    if (! exists && ! creating[doc.run_id]) {
      creating[doc.run_id] = true;

      var run = JSON.stringify({
        id:       doc.run_id,
        started:  doc.when,
        repo:     doc.repo,
        commit:   doc.commit
      });

      batch.push({
        prefix: db.runs,
        key:    k,
        value:  run,
        type:   'put'
      });

      batch.push({
        prefix: db.runsSorted,
        key:    key([doc.repo, doc.when]),
        value:  run,
        type:    'put'
      });
    }

    db.root.batch(batch, batchComplete);
  });

  function batchComplete(err) {
    delete creating[doc.run_id];
    cb(err);
  }

}

