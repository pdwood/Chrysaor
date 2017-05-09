var rootElement;

var selection;
var startX, startY;//, dragging;
var dragStartNode;

window.onload=function(){
	rootElement = document.getElementById('node0');
	rootElement.addEventListener('click', function(event){onClick(this, event);});
	document.addEventListener('contextmenu', function(event){return false;});
	rootElement.addEventListener('contextmenu', function(event){onRightClick(this, event); return false;});
	document.addEventListener('mouseup', handleDrag);
	document.addEventListener('mousedown', function(event){startX = event.clientX; startY = event.clientY;});
	RootNode.fill = rootElement;
	selection = new Set();
	elementsToNodes.set(rootElement, RootNode);
};

function onSelect(event){
	//alert("clicked on: " +this.innerHTML);
	if(!event.shiftKey && !(selection.size==1 && selection.has(elementsToNodes.get(this)))){
		clearSelection();
	}
	selectElement(this);
	event.stopPropagation();
	return false;
}

function selectElement(element){
	var node = elementsToNodes.get(element);
	if(selection.has(node)){
		selection.delete(node);
		node.element.setAttribute("stroke", "black"); 
	}else{
		selection.add(node);
		node.element.setAttribute("stroke", "red"); 
	}
}

function clearSelection(){
	selection.forEach(function(key, value, set){value.element.setAttribute("stroke", "black");});
	selection.clear();
}

function selectAllChildren(parent){
	if('children' in parent) for(let child of parent.children){
		selection.add(child);
		child.element.setAttribute("stroke", "red");
		selectAllChildren(child);
	}
}

function handleDrag(event){
	console.log("drag start");
	event.stopPropagation();
	if(!sufficientDragRadius(event)){
		dragStartNode = undefined;
		return;
	}
	
	var deltaX = event.clientX - startX;
	var deltaY = event.clientY - startY;
	if(queryMode()=="inference" && event.button == 2){
		console.log("try iteration");
		var targetNode = elementsToNodes.get(document.elementFromPoint(event.clientX, event.clientY));
		if('children' in targetNode && isDescendantOf(targetNode, dragStartNode.parent)){
			console.log("can iterate");
			//Deiterate
			if(event.shiftKey){
				console.log("deiterate");
				for(let child of targetNode.children){
					console.log("found child");
					//Sorted pegastrings uniquely identify subgraphs
					if(toPegaString(child) == toPegaString(dragStartNode)){
						console.log("removing child");
						child.deleteWithRecurse();
						break;
					}
				}
			}
			//Iterate
			else{
				console.log("iterate");
				//Don't iterate something into itself. This causes infinite recursion.
				if(!isDescendantOf(targetNode, dragStartNode)) copySubgraph(dragStartNode, targetNode, event.clientX, event.clientY);
			}
		}
	}else for(let node of selection){
		node.changeX(deltaX);
		node.changeY(deltaY);
		refresh(node);
	}

	dragStartNode = undefined;
	//dragging = false;
	return false;
}

function queryMode(){
	return document.querySelector('input[name="mode"]:checked').value;
}

function onClick(element, event){
	if(sufficientDragRadius(event)) return;
	event.stopPropagation();
	//if(dragging) return false;
	clearSelection();
	if(event.shiftKey){
		selectAllChildren(elementsToNodes.get(element));
	}else{
		var mode = queryMode();
		if(mode == "construct"){
			onClickConstructMode(element, event);
		}else if(mode == "inference"){
			onClickInferenceMode(element, event);
		}
	}
}

function onClickConstructMode(element, event){
	promptVariable(elementsToNodes.get(element), event.clientX, event.clientY);
}

function onClickInferenceMode(element, event){

	var node = elementsToNodes.get(element);
	//Insertion
	if(node.depth%2 == 1 && node.fill == element) promptVariable(node, event.clientX, event.clientY);
}

function onRightClick(element, event){
	console.log("orc start");
	if(sufficientDragRadius(event)) return;
	event.preventDefault();
	event.stopPropagation();
	var mode = queryMode();
	console.log("mode is "+mode);
	if(mode == "construct"){
		onRightClickConstructMode(element, event);
	}else if(mode == "inference"){
		onRightClickInferenceMode(element, event);
	}
}

function onRightClickConstructMode(element, event){
	var node = elementsToNodes.get(element);
	//only put child cut if fill was clicked
	if('fill' in node && node.fill == element) addEmptyCut(event.clientX, event.clientY, node);
}

function onRightClickInferenceMode(element, event){
	console.log("orcim start");
	var node = elementsToNodes.get(element);
	console.log(node);
	console.log(node.depth);
	//Erasure (make sure not to erase fill of cut)
	if(node.depth%2 == 1 && node.element==element) node.deleteWithRecurse();

	//Remove double cut
	else if(node != RootNode && 'children' in node && node.children.size == 1 && 'children' in node.children.values().next().value){
		console.log("DC remove");
		node.children.values().next().value.deleteNoRecurse();
		node.deleteNoRecurse();
	}

	console.log("orcim done");
}

function promptVariable(node, x, y){
	var variableName = prompt("Enter variable to insert");
	if(!variableName) return;

	createFromExpression(variableName, node, x, y);
}

function createFromExpression(ex, node, x, y){
	console.log("Creating from "+ex);
	if(ex[0]=='~'){
		var cut = addEmptyCut(x, y, node);
		createFromExpression(ex.slice(1), cut, x+10, y+10);
	}else if(ex[0]=='(' && ex[ex.length-1] == ')'){
		//strip parens
		createFromExpression(ex.slice(1, -1), node, x, y);
	}else if(ex[0]=='|'){
		var outCut = addEmptyCut(x, y, node);
		for(let s of tokenize(ex.slice(1))){
			var inCut = addEmptyCut(x+10,y+10,outCut);
			createFromExpression(s, inCut, x+32, y+32);
		}
	}else if(ex[0]=='&'){
		for(let s of tokenize(ex.slice(1))) createFromExpression(s, node, x, y);
	}else if(ex[0]=='$'){
		var outCut = addEmptyCut(x, y, node);
		var inCut = addEmptyCut(x+10, y+10, outCut);
		var tokens = tokenize(ex.slice(1));
		createFromExpression(tokens[1], inCut, x+32, y+32)
		createFromExpression(tokens[0], outCut, x+32, y+32);
	}else{
		addVariable(ex, x, y, node);
	}
}

function tokenize(s){
	s = s.trim();
	var out = [];
	var start=0;
	var parens=0;
	for(var i=0; i<s.length; ++i){
		if(s[i] == '(') ++parens;
		else if(s[i] == ')') --parens;
		else if(s[i] == ' ' && parens == 0){
			while(i<s.length && s[i] == ' '){
				++i;
			}
			if(i>start) out.push(s.slice(start, i).trim());
			--i; //compensate since the for loop will increment i
			start = i;
		}
	}
	out.push(s.slice(start, i).trim());
	return out;
}

function handleKeyPress(event){
	//alert(event.key);
	if(event.key == "Delete" && queryMode() == "construct"){
		for(let node of selection){
			node.deleteNoRecurse();
		}
	}//else if(event.key == "ArrowUp"){
	/*else if(event.key == "Enter" && queryMode() = "inference"){
		var minX = rootElement.getBBox().width;
		var minY = rootElement.getBBox().height;
		for(let node of selection){
			if(node.x < minX) minX = node.x;
			if(node.y < minY) minY = node.y;
		}
		var cut = addEmptyCut(minX, minY)
	}*/
	//}
}

//Repositions all nodes to accommodate this node.
function refresh(node){
	var pBox = node.element.getBBox();

	//Scale for children
	if(node instanceof CutNode) for(let child of node.children){
		var cBox = child.element.getBBox();
		//check for overlap in other direction?

		//if overlap, change width and height
		if(cBox.x+cBox.width > pBox.x+pBox.width-10){
			node.setWidth(cBox.width + cBox.x - pBox.x + 10);
		}
		if(cBox.y+cBox.height > pBox.y+pBox.height-10){
			node.setHeight(cBox.height + cBox.y - pBox.y + 10);
		}
	}

	pushSiblings(node);

	//Scale the parent
	if(node.parent != RootNode) refresh(node.parent);
}

function pushSiblings(node){
	var pBox = node.element.getBBox();

	for(let sibling of node.parent.children){
		var sBox = sibling.element.getBBox();

		if(sibling != node
					&& sBox.y+sBox.height>=pBox.y && pBox.y+pBox.height>=sBox.y //If there is y-overlap
					&& sBox.x+sBox.width >=pBox.x && pBox.x+pBox.width >=sBox.x
			){
			var deltaX = (sBox.x >= pBox.x) ? pBox.x + pBox.width - sBox.x + 10 : sBox.x + sBox.width - pBox.x - 10;
			var deltaY = (sBox.y >= pBox.y) ? pBox.y + pBox.height- sBox.y + 10 : sBox.y + sBox.height- pBox.y - 10;
			if(Math.abs(deltaX) <= Math.abs(deltaY)) sibling.changeX(deltaX);
			else sibling.changeY(deltaY);

			pushSiblings(sibling);
		}
	}
}

function toPegaString(node){
	var output="";
	if('children' in node){
		if(node != RootNode) output += '(';
		var childStrings = [];
		for(let child of node.children){
			childStrings.push(toPegaString(child));
		}
		childStrings.sort();
		for(var i=0; i<childStrings.length; ++i){
			output += childStrings[i];
			if(i != childStrings.length-1) output += '|';
		}
		/*for(let child of node.children){
			output+=toPegaString(child);
			output+='|';
		}
		if(output.length>0) output = output.slice(0, -1);*/
		if(node != RootNode) output += ')';
	}else output = node.element.innerHTML;

	return output;
}

function displayPegaString(){
	document.getElementById("pega").innerHTML = toPegaString(RootNode);
}

//Determines whether a mouse event should be classified as a drag
function sufficientDragRadius(event){
	return (event.clientX - startX)*(event.clientX - startX) + (event.clientY - startY)*(event.clientY - startY) > 20;
}