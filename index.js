var http = require('http');
var https = require('https');
var querystring = require('querystring');
var createHandler = require('gitlab-webhook-handler');
var toJandiHandler = createHandler({ path:'/gitlab-to-jandi'});
var config = require('./config.json');

http.createServer(function(req, res){
	toJandiHandler(req, res, function(err){
		res.statusCode = 404;
		res.end('no such location');
	})
}).listen(3030);

console.log('gitlab hook server runnting at http://localhost:3030/gitlab-to-jandi');

toJandiHandler.on('push', function(event){

	console.log('Received a push event for %s to %s', event.payload.repository.name, event.payload.ref);

	var hook = event.payload;
	var repo = hook.repository;
	var project = hook.project;
	var user_name = hook.user_name;

	var jandiParams = {};
	jandiParams.body = '[['+repo.name+']]('+repo.homepage+')에 @'+user_name+'님이 푸쉬하였습니다.(커밋 '+hook.commits.length+'건)';
	jandiParams.connectColor = '#FAC11B';
	jandiParams.connectInfo = new Array();
	
	var commitCount = hook.commits.length;
	for(var i = 0; i < commitCount; i++)
	{
		var commit = hook.commits[i];
		jandiParams.connectInfo.push({
			title: '[['+commit.id+']]('+commit.url+')',
			description: commit.message
		});
	}

	var req = https.request(config, function(res){
		res.setEncoding('utf8');
		res.on('data', function(chunk){
			console.log('response: '+chunk);
		});
	});
	
	req.write(JSON.stringify(jandiParams));
	req.end();
});

toJandiHandler.on('error', function(err){
	console.log('error > '+err);
});
