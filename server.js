var http=require("http"),
	fs=require("fs"),
	path=require("path"),
	ws=require("websocket-server"),
	url=require("url"),
	redis=require("redis"),
	clientPut=redis.createClient(),
	clientGet=redis.createClient(),
	paths={"/reg":function(req,res){
		console.log("reg run");
		req.addListener("data",function(data){
			var dataStr=data.toString('utf8',0,data.length).match(/[^=]+=([^=&]+)/)[1];//data is a buffer object;
			clientPut.publish("chatroom",dataStr+" join the chatroom");
			res.writeHead(200,{"Content-Type":"text/html","Connection":"close"});
			fs.createReadStream("public/chat.html",{
				'flags':'r',
				'encoding':'binary',
				'mode':0666,
				'bufferSize':4*1024
			}).addListener("data",function(data){
				res.write(data);	
			}).addListener("end",function(){
				res.end();	
			})
		})
		},
		"/chat":function(req,res,params){
			
			clientPut.publish("chatroom",params.query.data);
			res.write("success");
			res.end();
		},
		"/":function(req,res){
			console.log("run");
			res.writeHead(200,{"Content-Type":"text/html","Connection":"close"});
			fs.createReadStream("public/index.html",{
			'flags':'r',
			'encoding':'binary',
			'mode':0666,
			'bufferSize':4*1024
			}).addListener("data",function(data){
				res.write(data,"binary");
			}).addListener("end",function(){
				res.end();	
			})
		}
}
clientPut.on("error",function(err){
	console.log("Error "+err);			
});
clientGet.on("error",function(err){
	console.log("Error "+err);
});

clientGet.subscribe("chatroom");
clientGet.on("message",function(channel,message){
	server.broadcast(message);		
})
var httpServer=http.createServer(function(req,res){
	var params=url.parse(req.url,true)
	if(paths[params.pathname]){
		paths[params.pathname].call(this,req,res,params);
	}
});
var server=ws.createServer({
	debug:true,
	server:httpServer
});
server.listen("8000");
