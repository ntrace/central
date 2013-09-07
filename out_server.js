var assert     = require('assert');
var net        = require('net');
var DE         = require('duplex-emitter');
var liveStream = require('level-live-stream');
var WSStream   = require('wsstream');
var db         = require('./db');
var key        = require('./key');


/// Websocket Server

var wsServer = require('./ws_server');

wsServer.once('listening', function() {
  console.log('Web Socket Server listening to port %d'.green,
              wsServer._server.address().port);
});

wsServer.on('connection', onWsServerConnection);

function onWsServerConnection(socket) {
  var s = WSStream(socket);
  s.setEncoding('utf8');
  handleConnection(s);
}


/// TCP Server

var server   = module.exports = net.createServer(handleConnection);


/// Handle Connection

function handleConnection(conn) {
  console.log('handleConnection');
  var emitter = DE(conn);

  emitter.on('follow', follow.bind(emitter));
  emitter.on('unfollow', unfollow.bind(emitter));
  emitter.on('stream result', streamResult.bind(emitter, conn));

  emitter.follows = {
    repo: {},
    run:  {}
  };

  conn.once('end', function() {
    removeAllFollows.call(emitter);
  });
}


/// Follow

function follow(what) {
  var tail = what.tail !== false;
  if (what.run)  followRun .call(this, what.run, tail);
  if (what.repo) followRepo.call(this, what.repo, tail);
}

function followRepo(repo, tail) {
  var emitter = this;
  var live = emitter.follows.repo[repo];
  if (! live) {
    live = liveStream(db.runsSorted, {
      min:  repo + db.sep,
      tail: tail
    });
    emitter.follows.repo[repo] = live;

    live.on('data', function(d) {
      var run = d.value;
      try { run = JSON.parse(run); } catch(_) {};
      emitter.emit('run', repo, run);
    });
  }
}

function followRun(run, tail) {
  var emitter = this;
  var live = emitter.follows.run[run];
  if (! live) {
    live = liveStream(db.results, {
      min:  run + db.sep,
      tail: tail
    });
    emitter.follows.run[run] = live;

    live.on('data', function(d) {
      var keys = d.key.split(db.sep);
      var _run   = keys[0];
      if (run == _run) {
        var stream = keys[1];
        if (stream != 'result') {
          var when   = keys[2];
          emitter.emit('result', run, stream, d.value, when);
        }
      }
    });
  }
}


/// Unfollow

function unfollow(what) {
  if (what.repo) unfollowRepo.call(this, what.repo);
  if (what.run)  unfollowRun.call(this, what.run);
}

function unfollowRepo(repo) {
  var emitter = this;
  var live = emitter.follows.repo[repo];
  if (live) {
    live.destroy();
    delete emitter.follows.repo[repo];
  }
}

function unfollowRun(run) {
  var emitter = this;
  var live = emitter.follows.run[run];
  if (live) {
    live.destroy();
    delete emitter.follows.run[run];
  }
}

function removeAllFollows() {
  emitter = this;

  [emitter.follows.repo, emitter.follows.run].forEach(function(set) {
    Object.keys(set).forEach(function(k) {
      set[k].destroy();
      delete set[k];
    });
  });
}


/// Stream result

function streamResult(conn, owner, repo, run) {
  var emitter = this;

  var rs = db.results.createValueStream({
    start: key([run, 'result']),
    end:   key([run, 'result', 9999999999999])
  });

  rs.on('data', function(d) {
    emitter.emit('data', d);
  });

  rs.once('end', function() {
    emitter.emit('end');
    conn.end();
  });
}