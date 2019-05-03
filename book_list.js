var request = require("request");
var cheerio = require("cheerio");
var rp = require("request-promise");
function Xinpei_url(searchkey){
	console.log("start xinpei url")
	var counter = 0;
	var options = {
			    uri: 'http://webpac.tphcc.gov.tw/toread/opac/search?',
			    qs: {
			        q:searchkey,
			        max:"2",
			        view:"CONTENT",
			        location:"0",
			    },
			    timeout:5000,
			    headers: {
			        'User-Agent': "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.94 Safari/537.36",
					"Accept-Language":"en-US,en;q=0.9",
					"Accept":"text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
					"Connection":"keep-alive"
			    },
			    json: true, // Automatically parses the JSON string in the response
				transform: function(body){
					return cheerio.load(body,{decodeEntities: false});
				}
			};
	var start = Date.now();
	const pr = rp(options)
	.then(function($){
		clearInterval(interval);
		var title;
		var	author;
		var json={};
		var cn = -1;
		var cnn="";
		$(".is_img").filter(function(){

				var data_title = $(this).find(".reslt_item_head").text().trim();
				var data_author = $(this).find(".crs_author").text().trim();
				var links = $(this).find(".reslt_item_head>a").attr("href");
				
				if(cn >= 0) cnn="_"+cn;
				cn++;
				var data_count = $(this).find("#MyPageLink_4"+cnn).text().trim();
				data_count = data_count.replace(" 本館藏 可借閱", "");
				var image = $(this).find("img").attr("src");
				
				if(image == '/toread/images/macheteicons/book.gif')
				{
					image = "http://webpac.tphcc.gov.tw/toread/images/macheteicons/book.gif";
				}
				

				
				data_title = data_title.replace("/","");
				json.title = data_title;
				json.img = image;
				json.author = data_author;
				json.xinpei_lib = data_count;
				json.link = "http://webpac.tphcc.gov.tw"+links;
				console.log(json);
				counter++;
		})
	})
	.catch(reason =>{
		console.log(reason);
	})

	var interval = setInterval(() => {
	  console.log("Waiting:",(Date.now() - start) / 1000);
	}, 1000)

	return Promise.all([pr]).then(()=>{
		console.log(counter);
	})
	
}
