var rootElement;

var selection;
var startX, startY, dragging;

window.onload=function(){
	rootElement = document.getElementById('node0');
	rootElement.addEventListener('click', function(event){onClick(this, event);});
	document.addEventListener('contextmenu', function(event){return false;});
	rootElement.addEventListener('contextmenu', function(event){onRightClick(this, event); return false;});
	document.addEventListener('mouseup', handleDrag);
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
	event.stopPropagation();
	if(!dragging) return false;
	
	var deltaX = event.clientX - startX;
	var deltaY = event.clientY - startY;
	
	for(let node of selection){
		node.changeX(deltaX);
		node.changeY(deltaY);
		refresh(node);
	}
	dragging = false;
	return false;
}

function queryMode(){
	return document.querySelector('input[name="mode"]:checked').value;
}

function onClick(element, event){
	event.stopPropagation();
	if(dragging) return false;
	var mode = queryMode();
	console.log(mode);
	if(mode == "construct"){
		onClickConstructMode(element, event);
	}else if(mode == "inference"){
		onClickInferenceMode(element, event);
	}
}

function onClickConstructMode(element, event){
	if(event.shiftKey){
		clearSelection();
		selectAllChildren(elementsToNodes.get(element));
	}else{
		promptVariable(elementsToNodes.get(element), event.clientX, event.clientY);
	}
}

function onClickInferenceMode(element, event){

	var node = elementsToNodes.get(element);
	//Insertion
	if(node.depth%2 == 1 && node.fill == element) promptVariable(node, event.clientX, event.clientY);
}

function onRightClick(element, event){
	event.preventDefault();
	event.stopPropagation();
	var mode = queryMode();
	console.log(mode);
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
	var node = elementsToNodes.get(element);

	console.log("Clicked on object of depth "+node.depth);

	//Erasure (make sure not to erase fill of cut)
	if(node.depth%2 == 1 && node.element==element) node.deleteWithRecurse();

	//Remove double cut
	else if('children' in node && node.children.size == 1 && 'children' in node.children.values().next().value){
		node.children.values().next().value.deleteNoRecurse();
		node.deleteNoRecurse();
	}
}

function promptVariable(node, x, y){
	var variableName = prompt("Enter variable to insert");
	if(!variableName) return;
	//TODO parse Fitch syntax here
	addVariable(variableName, x, y, node);
}

function handleKeyPress(event){
	//alert(event.key);
	if(event.key == "Delete" && queryMode() == "construct"){
		console.log("trydelete");
		for(let node of selection){
			node.deleteNoRecurse();
		}
	}//else if(event.key == "ArrowUp"){

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
		if(sibling != node && sBox.y+sBox.height > pBox.y && pBox.y+pBox.height > sBox.y){ //If there is y-overlap
			if(sBox.x > pBox.x && sBox.x < pBox.x + pBox.width - 10){				
				//Put a recursive call to nudge here---this sibling being moved might in turn move others...
				sibling.changeX(pBox.x + pBox.width + 10 - sBox.x);
				pushSiblings(sibling);
			}
		}
		if(sBox.x+sBox.width > pBox.x && pBox.x+pBox.width > sBox.x){ //If there is x-overlap
			if(sBox.y > pBox.y && sBox.y < pBox.y + pBox.height - 10){
				//nudgeY(sibling, delta);
				sibling.changeY(pBox.y + pBox.height + 10 - sBox.y);
				pushSiblings(sibling);
			}
		}
	}
}