var fileNameList;
var fileNameWithParent;

var RQ4 = [
           "3c1adf7f6af0dff9bda74f40dabe8cf428a62003",
           "ace6bd2418cba892f793e9e3666ac02a541074c7",
		   "65b17b80ba353d3c21ab392d711d347bcbcce42b",
		   "f5cce14fe7749183a766e6335ee511d8918a81d4",
		   "ea9ad4ee9bd6604fe57f73004bf375c7c4cd7be3",
	       "3646138247488c9832a7f325401fe0b12fcdbebf",
	       "33d31d073ee451a3848192a4737cc06ab83cbfd6",
	       "77471444ec81ad9452ebde7ca2b58db58a1f77d1",
	       "1c312e85a9c6f868f76e886386621ebd3555a7d7",
	       "8c37ad7ac5034faed74cb53fd37b9865adfd56a5",];


function getFileFromServer(url,commitID,name,type) {
	var content;
	$.ajaxSettings.async = false;
	$.post(url,{commitId:commitID,fileName:name,SrcOrDstOrJson:type}, function(data) {
		content = data;
	});
	return content;
}

function getMetaFileFromServer(url,commitURL) {
	var content;
	$.ajaxSettings.async = false;
	$.post(url,{commit_url:commitURL}, function(data) {
		content = data;
	});
	return content;
}

function getFileByCommitUrl() {	
	init();
	var listGroup = document.getElementById("fileList");
	listGroup.innerHTML="";
	var commitUrl = document.getElementById("commitUrl").value.trim();
	var json = getMetaFileFromServer("TestServlet/",commitUrl);
	json = eval("("+json+")");
	var parents = json.parents;
	var files = json.files;
	fileNameWithParent = new Object();
	for(var i=0;i<files.length;i++) {
		var parent_commit = files[i]["parent_commit"];
		var file_name = files[i]["file_name"];
		if(parent_commit in fileNameWithParent) {
			fileNameWithParent[parent_commit].push(file_name);
		}
		else {
			var array = new Array();
			array.push(file_name);
			fileNameWithParent[parent_commit] = array;
		}		
	}
	for(var attribute in fileNameWithParent){  
		if(fileNameWithParent[attribute] != undefined) {
			var dividerDiv = document.createElement("li");
			dividerDiv.className = "dropdown-header";
			dividerDiv.innerHTML="diff with parent commit id : " + attribute;
			dividerDiv.style = "color:#000079";
			listGroup.appendChild(dividerDiv);
			for(var file=0;file<fileNameWithParent[attribute].length;file++) {
				var li = document.createElement("li");
				li.parentId = attribute;
				li.innerHTML="<a onclick = 'getContentByFileNameAndParentId(this)'>"+fileNameWithParent[attribute][file]+"</a>";
				listGroup.appendChild(li);
			}
		}			
	}
	listGroup.style.display = "inline";
//	var last=JSON.stringify(fileNameWithParent); //将JSON对象转化为JSON字符
//	alert(last);
}

function getContentByFileNameAndParentId(file) {
	var activeList = document.querySelectorAll("#fileList .active");
	for(var i=0;i<activeList.length;i++) {
		activeList[i].classList.remove("active");
	}
	file.classList.add("active");
	var fileName = file.innerHTML.trim();
	var parentId = file.parentNode.parentId;
//	alert(parentId+fileName);
}


function getCommitByRQ(button) {	
	init();	
	var listGroup = document.getElementById("commitList");
	listGroup.innerHTML="";
	
	var activeList = document.querySelectorAll("#RQList .active");
	for(var i=0;i<activeList.length;i++) {
		activeList[i].classList.remove("active");
	}
	button.classList.add("active");
	var RQ = $(button).contents().filter(function() { return this.nodeType === 3; }).text().trim();
	
	var commits;
	(RQ == "RQ3") ? commits = RQ3 : commits = RQ4;
	var inner ="";
	for(var i=0;i<commits.length;i++) {
		inner += "<button type='button' class='list-group-item' onclick='getFileByCommit(this)'>" +
				"<span class='badge' style='float: left; margin-right: 6px'>"+(i+1)+"</span>"+commits[i]+"</button>";
	}
	listGroup.innerHTML = inner;
	
	listGroup = document.getElementById("fileList");
	listGroup.innerHTML="";
	document.querySelector(".original-in-monaco-diff-editor").innerHTML="";
	document.querySelector(".modified-in-monaco-diff-editor").innerHTML="";
}

function getFileByCommit(button) {
	init();	

	var listGroup = document.getElementById("fileList");
	listGroup.innerHTML="";
	
	document.querySelector(".original-in-monaco-diff-editor").innerHTML="";
	document.querySelector(".modified-in-monaco-diff-editor").innerHTML="";
	
	var activeList = document.querySelectorAll("#commitList .active");
	for(var i=0;i<activeList.length;i++) {
		activeList[i].classList.remove("active");
	}
	button.classList.add("active");
	var commitID = $(button).contents().filter(function() { return this.nodeType === 3; }).text().trim();
	commitId = commitID;
	$.ajaxSettings.async = false;
	var json = getFileFromServer("getfile",commitID,"","meta.json");
	json = eval("("+json+")");
	fileNameList = json.files;

	for(var i=0;i<fileNameList.length;i++) {
		var buttonDiv = document.createElement("button");
		buttonDiv.type="button";
		buttonDiv.className="list-group-item";
		buttonDiv.innerHTML=fileNameList[i];
		buttonDiv.onclick = getContentByFileName;
		listGroup.appendChild(buttonDiv);
	}

}

function getContentByFileName() {
	var activeList = document.querySelectorAll("#fileList .active");
	for(var i=0;i<activeList.length;i++) {
		activeList[i].classList.remove("active");
	}
	this.classList.add("active");
	var name = $(this).text().trim();
	var index = name.lastIndexOf("/");
	if(index >=0)
		name = name.substring(index+1,name.length);
	fileName = name;
//	alert(name);
	var activeCommit = document.querySelector("#commitList .active");
	var commitID = $(activeCommit).contents().filter(function() { return this.nodeType === 3; }).text().trim();
//	alert(commitID);
	
	refreshPage(commitID,name);
}

function getFileName(path) {
	var name;
	var index = path.lastIndexOf("/");
	if(index >=0)
		name = path.substring(index+1,path.length);
	return name;
}

function getLinkJson(commitID,fileCount) {
    otherFilelink = new Object();
    inFilelink.splice(0,inFilelink.length);
//	link json
	var json = getFileFromServer("getfile",commitID,"","link.json");
	json = eval("("+json+")");
	var links = json.links;

	for(var i=0;i<links.length;i++) {
		if(links[i]["file-name"] == fileName && links[i]["link-type"] == "one-file-link") {
			if(links[i].links.length > 0)
				inFilelink = links[i].links;
		}
		else if((links[i]["file-name"] == fileName)||(links[i]["file-name2"] == fileName) && links[i]["link-type"] == "two-file-link") {
			if(links[i].links.length > 0) {
				var thisIdx,otherFile;
				(links[i]["file-name"] == fileName) ? otherFile =links[i]["file-name2"]:otherFile = links[i]["file-name"];
//				otherFilelink[otherFile] = new Object();
//				otherFilelink[otherFile]["thisIdx"] = thisIdx;
//				otherFilelink[otherFile]["links"] = links[i].links;
				otherFilelink[otherFile] = links[i].links;
				if(fileCount ==1 && descriptions.length == 0) {
					(links[i]["file-name"] == fileName) ? thisIdx ="from":thisIdx = "to";
					var entry = new Object();					
					entry.id = links[i].links[0][thisIdx];
					entry.file = "dst";
					entry.range2 = [1,modifiedLines.length];	
					descriptions.splice(0,0,entry);
				}
			}
		}
	}
}
function parseLink(rangeStr) {
	var wholeRange = rangeStr.split(',');
	if(wholeRange.length == 2) {
		return [parseInt(wholeRange[0]),parseInt(wholeRange[1])];
	}
	else {
		alert("json error: link range :"+rangeStr);
		return [];
	}	
}

function getDescById(descArray,id) {
	for(var i=0;i<descArray.length;i++) {
		if(descArray[i].id == id) {
			desc = descArray[i];
//			alert("---------  "+obj.id);			
			return;
		}
		if(descArray[i].subDesc != undefined) {
			getDescById(descArray[i].subDesc,id);
		}
	}
}

function checkFileName() {
	
}