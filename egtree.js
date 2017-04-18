
var nextid = 1;
var nodesMap = new Map();

var RootNode = {
	depth: 0, x: 0, y: 0, children: new Set(), element: undefined
}

function TextNode(x, y, text, parent){
	this.text = text;
	this.x=x;
	this.y=y;
	this.parent = parent;
	this.parent.children.add(this);

	this.element = document.createElementNS("http://www.w3.org/2000/svg", 'text');
	this.element.setAttribute("x", x);
	this.element.setAttribute("y", y);
	this.element.innerHTML = text; //TODO: Parse Fitch syntax
	this.element.setAttribute("id", "node"+nextid);
	++nextid;
	this.element.addEventListener('click', function(event){
		//alert("clicked on: " +this.innerHTML);
		if(!event.shiftKey){
			clearSelection();
		}
		selectElement(this);
		event.stopPropagation();
		return false;
	});
	
	this.setX = function(x){
		this.x=x;
		this.element.setAttribute("x", x);
	};

	this.setY = function(y){
		this.y=y;
		this.element.setAttribute("y", y);
	};
	
	nodesMap.set(this.element, this);

//	rootnode.appendChild(this.element);
}

function CutNode(x, y, parent){
	this.children = new Set();
	this.x=x;
	this.y=y;
	this.parent = parent;
	this.depth = parent.depth + 1;
	parent.children.add(this);
	

	this.element = document.createElementNS("http://www.w3.org/2000/svg", 'rect');
	this.element.setAttribute("x", x);
	this.element.setAttribute("y", y);
	this.element.setAttribute("rx", 30);
	this.element.setAttribute("ry", 30);
	this.element.setAttribute("height", 64);
	this.element.setAttribute("width", 64);
	this.element.setAttribute("stroke", "black");
	this.element.setAttribute("stroke-width", 5);
	this.element.style.fill=["white","cyan"][this.depth%2];
	this.element.setAttribute("id", "node"+nextid);
	this.element.setAttribute("parent", parent.element.getAttribute('id'));
	++nextid;
	this.element.addEventListener('click', onClickConstructMode);
	this.element.addEventListener('contextmenu', function(event){scale(this, addEmptyCut(event.pageX, event.pageY,this)); event.preventDefault(); event.stopPropagation(); return false;});

	this.setX = function(x){
		this.x=x;
		this.element.setAttribute("x", x);
	};

	this.setY = function(y){
		this.y=y;
		this.element.setAttribute("y", y);
	};

	nodesMap.set(this.element, this);

}

function addVariable(name, x, y, parentElement){
	var child = new TextNode(x,y,name,nodesMap.get(parentElement));
	rootElement.appendChild(child.element);
	refresh(child);
	//First X, then Y:
	//Move siblings if necessary
	//Scale parent to accommodate this and/or moved siblings
	//Recurse

	return child;
}

function addEmptyCut(x,y,parentElement){
	var child = new CutNode(x,y,nodesMap.get(parentElement));
	rootElement.appendChild(child.element);
	refresh(child);
	return child;
}

//Repositions all nodes to accommodate this node.
function refresh(node){
	var pBox = node.element.getBBox();
	if(node instanceof CutNode) for(let child of node.children){
		var cBox = child.element.getBBox();
		//check for overlap in other direction?

		//if overlap, change width and height
		if(cBox.x+cBox.width > pBox.x+pBox.width+10){
			node.element.setAttribute("width", cBox.width + cBox.x - pBox.x + 10);
		}
		if(cBox.y+cBox.height > pBox.y+pBox.height+10){
			node.element.setAttribute("height", cBox.height + cBox.y - pBox.y + 10);
		}
	}
	for(let sibling of node.parent.children){
		var sBox = sibling.element.getBBox();
		if(sibling != node && sBox.y+sBox.height > pBox.y && pBox.y+pBox.height > sBox.y){ //If there is y-overlap
			if(sBox.x > pBox.x && sBox.x < pBox.x + pBox.width - 10){				
				//Put a recursive call to nudge here---this sibling being moved might in turn move others...
				sibling.setX(pBox.x + pBox.width + 10);
			}
		}
		if(sBox.x+sBox.width > pBox.x && pBox.x+pBox.width > sBox.x){ //If there is x-overlap
			if(sBox.y > pBox.y && sBox.y < pBox.y + pBox.height - 10){
				//nudgeY(sibling, delta);
				sibling.setY(pBox.y + pBox.height + 10);
			}
		}
	}
	if(node.parent != RootNode) refresh(node.parent);
}