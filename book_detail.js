var request = require("request");
var cheerio = require("cheerio");
var rp = require("request-promise");
function Xinpei(searchUrl){	
	var options = {
		    uri: searchUrl,
		    headers: {
		        'User-Agent': "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.94 Safari/537.36",
				"Accept-Language":"en-US,en;q=0.9",
				"Connection":"keep-alive"
		    },
		    json: true, // Automatically parses the JSON string in the response
			transform: function(body){
				// use decodeEntities to prevent wrong chinese
				return cheerio.load(body,{decodeEntities: false});
			}
		};
	const searchrp = rp(options).then(function($){
		var title, author, isbn, year, publisher, img;
		var json = {};
		var havaData = false;
		$(".reslt_item_head").filter(function(){       //title
			havaData = true;
			var data_title = $(this).text().trim();
			data_title = data_title.replace("/","");
			json.title = data_title;
		})
		$(".img_reslt").filter(function(){       //image
			havaData = true;
			var data_img = $(this).find("#Any_10").attr("src");
			json.img = data_img;
		})

		$(".bibViewTable").filter(function(){        //author, isbn, year, publisher
				havaData = true;
				var data_author="", data_isbn="", data_year="", data_publisher="";
				for(var i = 0 ; i<20;i++){
					var str="#For_"+i+">th";
					var ss =$(this).find(str).text().trim();
					//console.log(ss);
						if(ss.search("作者:")>=0) 	
							data_author = $(this).find("#For_"+i+">td").text().trim();
						else if(ss == "ISBN:")
							data_isbn = $(this).find("#For_"+i+">td").text().trim();
						else if(ss == "出版年:")
							data_year = $(this).find("#For_"+i+">td").text().trim();
						else if(ss == "出版者:")
							data_publisher = $(this).find("#For_"+i+">td").text().trim();
				}
				if(data_year=="")
				{
					if(data_publisher.search(",")>=0){
						data_publisher = data_publisher.split(",",2);
						data_year = data_publisher[1];
						data_publisher = data_publisher[0];
					}
					else if(data_publisher.search(";")>=0)
					{
						data_publisher = data_publisher.split(";",2);
						data_year = data_publisher[1];
						data_publisher = data_publisher[0];
					}
				}
				

				data_isbn = data_isbn.replace("平裝", "");
				data_isbn = data_isbn.replace("精裝", "");
				data_isbn = data_isbn.replace("()", "");
				data_isbn = data_isbn.replace(":", "");

				json.author = data_author;
				json.isbn = data_isbn;
				json.publish_year = data_year;
				json.publisher = data_publisher;
				json.links = searchUrl;
				json.searchState = "true";

				console.log(json);
		})
		if(!havaData)
		{
			console.log("data_author undefined");
		}
		
	})
	.catch(reason => {
		console.log("");
		console.log(reason);
	});
	
	Promise.all([searchrp]).then(()=>{
		console.log("finish");
	})
}