var rootElement;

var selection;

window.onload=function(){
	rootElement = document.getElementById('node0');
	rootElement.addEventListener('click', onClickConstructMode);
	document.addEventListener('contextmenu', function(event){return false;});
	rootElement.addEventListener('contextmenu', function(event){addEmptyCut(event.pageX, event.pageY,this);return false;});
	RootNode.element = rootElement;
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

function onClickConstructMode(event){
	if(event.shiftKey){
		clearSelection();
		for(let node of elementsToNodes.get(this).children){
			selection.add(node);
			node.element.setAttribute("stroke", "red");
		}
	}else{
		var variableName = prompt("Enter name of variable");
		if(!variableName) return;
		var child = addVariable(variableName, event.pageX, event.pageY, this);
	}
	event.stopPropagation();
}

function onRightClickConstructMode(event){
	var child = addEmptyCut(event.pageX, event.pageY, this);
	event.stopPropagation();
	return false;
}

function handleKeyPress(event){
	//alert(event.key);
	if(event.key == "ArrowUp"){

	}
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