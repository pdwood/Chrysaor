var rootElement;

var selection;

var graphTree;

window.onload=function(){
	rootElement = document.getElementById('node0');
	rootElement.addEventListener('click', onClickConstructMode);
	document.addEventListener('contextmenu', function(event){return false;});
	rootElement.addEventListener('contextmenu', function(event){addEmptyCut(event.pageX, event.pageY,this);return false;});
	RootNode.element = rootElement;
	selection = new Set();
	elementsToNodes.set(rootElement, RootNode);
	graphTree = new Set();
	graphMap = new Map();
	graphMap.set(rootElement, graphTree);
};

function scale(parent, child){
	if(!graphMap.get(parent) || !graphMap.get(parent).has(child)) return;	

	var pBox = parent.getBBox();
	var cBox = child.getBBox();

	if(pBox.x+pBox.width < cBox.x+cBox.width){
		var delta = (cBox.x+cBox.width-pBox.x + 10)-pBox.width;
		parent.setAttribute('width', pBox.width + delta);
		for(let sibling of graphMap.get(parentOf(parent))){
			var sBox = sibling.getBBox();
			if(sBox.y+sBox.height > pBox.y && pBox.y+pBox.height > sBox.y){ //If there is y-overlap
				if(sBox.x > pBox.x && sBox.x < pBox.x + pBox.width - 10){
					nudgeX(sibling, delta);
				}
			}
		}
	}
	if(pBox.y+pBox.height < cBox.y+cBox.height){
		var delta = (cBox.y+cBox.height-pBox.y + 10)-pBox.height;
		parent.setAttribute('height', pBox.height + delta);
		for(let sibling of graphMap.get(parentOf(parent))){
			var sBox = sibling.getBBox();
			if(sBox.x+sBox.width > pBox.x && pBox.x+pBox.width > sBox.x){ //If there is x-overlap
				if(sBox.y > pBox.y && sBox.y < pBox.y + pBox.height - 10){
					nudgeY(sibling, delta);
				}
			}
		}
	}

	scale(document.getElementById(parent.getAttribute("parent")), parent);
	//}
}

function nudgeX(node, delta){
	console.log("Nudging: "+node.getAttribute("id"));
	var pBox = node.getBBox();
	node.setAttribute('x', pBox.x+delta);
	if(node.tagName != 'text') for(let child of graphMap.get(node)) nudgeX(child, delta);

	for(let sibling of graphMap.get(parentOf(node))){
		var sBox = sibling.getBBox();
		if(sibling != node && sBox.y+sBox.height > pBox.y && pBox.y+pBox.height > sBox.y){ //If there is y-overlap
			if(sBox.x > pBox.x && sBox.x < pBox.x + pBox.width - 10){
				nudgeX(sibling, delta);
			}
		}
	}
}

function nudgeY(node, delta){
	var pBox = node.getBBox();
	node.setAttribute('y', pBox.y+delta);
	if(node.tagName != 'text') for(let child of graphMap.get(node)) nudgeY(child, delta);
	
	for(let sibling of graphMap.get(parentOf(node))){
		var sBox = sibling.getBBox();
		if(sibling != node && sBox.x+sBox.width > pBox.x && pBox.x+pBox.width > sBox.x){ //If there is x-overlap
			if(sBox.y > pBox.y && sBox.y < pBox.y + pBox.height - 10){
				nudgeY(sibling, delta);
			}
		}
	}
}


function onSelect(event){
	//alert("clicked on: " +this.innerHTML);
	if(!event.shiftKey){
		clearSelection();
	}
	selectElement(this);
	event.stopPropagation();
	return false;
}


function selectElement(element){
	var node = elementsToNodes.get(element);
	selection.add(node);
	node.element.setAttribute("stroke", "red"); 
}

function clearSelection(){
	selection.forEach(function(){this.element.setAttribute("stroke", "black");});
	selection.clear();
}

function onClickConstructMode(event){
	var variableName = prompt("Enter name of variable");
	if(!variableName) return;
	var child = addVariable(variableName, event.pageX, event.pageY, this);
	//if(parent != rootElement) scale(this, child);
	event.stopPropagation();
}

function onRightClickConstructMode(event){
	var child = addEmptyCut(event.pageX, event.pageY, this);
	//if(parent != rootElement) scale(this, child);
	event.stopPropagation();
	return false;
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