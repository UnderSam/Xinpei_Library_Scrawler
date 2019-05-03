# Basic Web Scrawler With Javascript

## Require skill
1. Javascript
2. HTML DOM
3. Jquery
4. promise
5. curiosity
## Packages
1. Cheerio
2. Request

## What

嘗試做一個爬蟲程式來搜尋[新北市立圖書館](http://webpac.tphcc.gov.tw/toread/opac/search?)的藏書資訊系統，並且能夠根據搜尋到的書去做更進一步的查詢。
## How

首先我們要先分析這個網站是怎麼樣去處理查詢系統的，先找到查詢的首頁，並且觀察網址，網址如下:

`http://webpac.tphcc.gov.tw/toread/opac/search?`

然後我們搜尋一本書，在記錄其網址，會變成如下:

```
http://webpac.tphcc.gov.tw/toread/opac/search?q=app&max=&view=CONTENT&location=
```

顯然的，這個網頁搜尋是用GET來傳輸request，還不懂GET、POST這些的可以參考[這個網址](https://www.wibibi.com/info.php?tid=235)，也可以打開開發者視窗(F12)來找到NetWork，並且找到你的url，找到會如下(這邊用app為關鍵字做搜尋)

![](https://i.imgur.com/0KRejwD.png)

再往下一點可以看到QueryString這個參數，因為GET跟POST都可以傳遞參數，只是差在會不會放在URL上面，所以兩個在傳參還是會把PARAMS丟到PAYLOAD裡面，這邊可以觀察有幾個參數是server需要的 : 

![](https://i.imgur.com/9DgV4QT.png)

想要理解參數可以幹嘛的，因為是GET傳輸所以你可以直接去改url，例如把location改成1就是變成顯示第二頁，改掉max就是改預設最大顯示數量。

現在萬事俱備，開始架構我們的蒐書系統。
## Construct our Scrawler

假設今天要搜尋的是有關app的書，那我們肯定要先有個書單，把書單傳給client後再由client選一本書來回傳資訊，可是我們這個url只能搜尋到書單阿!怎麼辦呢?這時候就可以去看書單的html有沒有什麼端倪 : 

1. 先找到一本書，我們以愛的APP為範本 : 

![](https://i.imgur.com/UOOQ0OV.png)

2. 對著裡面看到的任何一個地方右鍵並且 [檢查]
3. 我們會得到如下的html原始碼 : 

![](https://i.imgur.com/2BGsE0Z.png)

竟然有附上這本書的URL，那事情就好辦多了，我們只要先取得書單，並且儲存起來等待client需要某本書再去搜尋就好了。既然現在有架構了，就來撰寫程式吧 !

## Programming

### BookList 
首先去回顧之前書單上面的原始碼，可以在上面找到標題、圖片連結、作者、藏書、連結。再來我們打開一個檔案取名為book.js，並引入幾個package
```
var request = require("request");
var cheerio = require("cheerio");
var rp = require("request-promise");
```
首先先把剛剛搜尋後的URL
```
http://webpac.tphcc.gov.tw/toread/opac/search?q=app&max=&view=CONTENT&location=
```
去掉搜尋串得到
```
http://webpac.tphcc.gov.tw/toread/opac/search?
```
從request-promise的document中可以得到，用法是先宣告一個options，裡面先放入url,qs,header...等資訊，塞入後會變成這樣
```
	var options = {
			    uri: 'http://webpac.tphcc.gov.tw/toread/opac/search?',
			    qs: {
			        q:searchkey,
			        max:"",
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
```
uri為我們的搜尋basis-url，而qs就是queryString，我們要從之前的那張圖片照著格式放進來，timeout為過幾秒後reject，而header為向server表明user-agent的身分(不然有些會擋掉無user-agent的爬蟲)，最後由transform將response直接轉成cheerio的格式。

接下來就專注在把拿到的html弄成我們要的資訊，我們繼續觀察原始碼

![](https://i.imgur.com/Kxb3Mow.png)

每一本書都用class(is_img)來隔開，那要取得每個is_img底下的資料我們可以使用jquery的filter，如下
```
$(".is_img").filter(function(){
    /...
    code here
    .../
})
```
那抓到了每本書的Parent後，我們現在就要來找我們要的資訊放在哪個Children，繼續打開母TAG後會得到

![](https://i.imgur.com/CDpmBIZ.png)

這邊直接幫大家整理 : 
1. 標題 : 放在reslt_item_head底下
2. 作者 : 放在crs_author底下
3. 連結 : 放在reslt_item_head底下的a的href屬性
4. 圖片 : img tag的src屬性
5. 館藏 : 這邊看到第一本書的館藏在id['MyPageLink_4']底下，可是寫完去跑又發現其他本書都沒有資料，這時候打開其他本的也一起比較

![](https://i.imgur.com/z6L3WSz.png)

原來後面還有_+number，這邊我們就用迴圈一起來處理，第n本書就append n-1到id後面去抓資料

現在tag也有了，我們直接來寫剩下的邏輯部分 : 
```
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
```
最後，再return我們的request-promise
```
return Promise.all([pr]).then(()=>{
		console.log(counter); //show books count
	})
```
全部兜在一起之後會變成
```
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
```
接下來執行這個function，並且帶入app這個關鍵字，會跑出結果 : 
```
start xinpei url
Waiting: 1.007
Waiting: 2.007
{ title: '愛的APP ',
  img: '/toread/covers.svc?h=140&rid=574942&t=m&w=99',
  author: '法蘭柯 ((Frankel, Laurie)); 陳佳琳',
  xinpei_lib: '4',
  link: 'http://webpac.tphcc.gov.tw/toread/opac/bibliographic_view/574942?location=0&mps=50&ob=desc&q=app&sb=relevance&start=0&view=CONTENT' }
{ title: 'Apples',
  img: 'http://static.findbook.tw/image/book/9780521752398/large',
  author: '',
  xinpei_lib: '1',
  link: 'http://webpac.tphcc.gov.tw/toread/opac/bibliographic_view/408225?location=0&mps=50&ob=desc&q=app&sb=relevance&start=0&view=CONTENT' }
{ title: 'APP之繼承 : 以APP開發創業的故事 ',
  img: '/toread/covers.svc?h=140&rid=702097&t=m&w=99',
  author: '林廣維',
  xinpei_lib: '8',
  link: 'http://webpac.tphcc.gov.tw/toread/opac/bibliographic_view/702097?location=0&mps=50&ob=desc&q=app&sb=relevance&start=0&view=CONTENT' }
{ title: 'The appeal',
  img: 'http://static.findbook.tw/image/book/9780440243816/large',
  author: 'Mississippi; Wall Street (New York, N.Y.); Grisham,, John',
  xinpei_lib: '1',
  link: 'http://webpac.tphcc.gov.tw/toread/opac/bibliographic_view/403400?location=0&mps=50&ob=desc&q=app&sb=relevance&start=0&view=CONTENT' }
  .
  .
  .
  .
  .
  .
{ title: 'L\'appart : the delights and disasters of making my Paris home ',
  img: 'http://static.findbook.tw/image/book/9780804188388/large',
  author: 'Lebovitz, David.; Lebovitz, David; Paris (France); Paris (France)',
  xinpei_lib: '3',
  link: 'http://webpac.tphcc.gov.tw/toread/opac/bibliographic_view/772016?location=0&mps=50&ob=desc&q=app&sb=relevance&start=0&view=CONTENT' }
```
之後有了這個JSON後，我們就可以弄個美美的介面給使用者選擇，並且根據他想要的書去幫他爬囉 !

各自書本的資料爬蟲我也會一起放上Github，邏輯是一樣的，大家可以試試看喔><

參考資料 : 

1. [document of request-promise](https://github.com/request/request-promise)
