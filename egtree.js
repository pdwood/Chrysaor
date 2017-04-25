
var nextid = 1;
var elementsToNodes = new Map();

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
	this.element.addEventListener('click', onSelect);
	this.element.addEventListener('mousedown', function(event){startX = event.clientX; startY = event.clientY; dragging = true; event.stopPropagation();});
	
	this.setX = function(x){
		this.x=x;
		this.element.setAttribute("x", this.x);
	}

	this.setY = function(y){
		this.y=y;
		this.element.setAttribute("y", this.y);
	}

	this.changeX = function(x){
		this.setX(this.x+x);
	};

	this.changeY = function(y){
		this.setY(this.y+y);
	};
	
	elementsToNodes.set(this.element, this);

//	rootnode.appendChild(this.element);
}

function CutNode(x, y, parent){
	this.children = new Set();
	this.x=x;
	this.y=y;
	this.parent = parent;
	this.depth = parent.depth + 1;
	parent.children.add(this);
	
	this.fill = document.createElementNS("http://www.w3.org/2000/svg", 'rect');
	this.fill.setAttribute("x", x);
	this.fill.setAttribute("y", y);
	this.fill.setAttribute("rx", 30);
	this.fill.setAttribute("ry", 30);
	this.fill.setAttribute("height", 64);
	this.fill.setAttribute("width", 64);
	this.fill.style.fill=["white","cyan"][this.depth%2];

	this.element = document.createElementNS("http://www.w3.org/2000/svg", 'rect');
	this.element.setAttribute("x", x);
	this.element.setAttribute("y", y);
	this.element.setAttribute("rx", 30);
	this.element.setAttribute("ry", 30);
	this.element.setAttribute("height", 64);
	this.element.setAttribute("width", 64);
	this.element.setAttribute("stroke", "black");
	this.element.setAttribute("stroke-width", 5);
	this.element.style.fill = "none";
	this.element.setAttribute("draggable", true);

	this.element.addEventListener('click', onSelect);
	//this.element.addEventListener('dragstart', 
	this.element.addEventListener('mousedown', function(event){startX = event.clientX; startY = event.clientY; dragging = true; event.stopPropagation();});

	this.fill.addEventListener('click', onClickConstructMode);
	this.fill.addEventListener('contextmenu', function(event){addEmptyCut(event.clientX, event.clientY,this); event.preventDefault(); event.stopPropagation(); return false;});

	this.setX = function(x){
		var delta = x - this.x;
		this.x=x;
		this.element.setAttribute("x", this.x);
		this.fill.setAttribute("x", this.x);
		for(let child of this.children) child.changeX(delta);
	}

	this.setY = function(y){
		var delta = y - this.y;
		this.y=y;
		this.element.setAttribute("y", this.y);
		this.fill.setAttribute("y", this.y);
		for(let child of this.children) child.changeY(delta);
	}

	this.changeX = function(x){
		this.setX(this.x+x);
	};

	this.changeY = function(y){
		this.setY(this.y+y);
	};

	this.setWidth = function(width){
		this.element.setAttribute("width", width);
		this.fill.setAttribute("width", width);
	}

	this.setHeight = function(height){
		this.element.setAttribute("height", height);
		this.fill.setAttribute("height", height);
	}

	elementsToNodes.set(this.element, this);
	elementsToNodes.set(this.fill, this);

}

function addVariable(name, x, y, parentElement){
	var child = new TextNode(x,y,name,elementsToNodes.get(parentElement));
	rootElement.appendChild(child.element);
	refresh(child);
	//First X, then Y:
	//Move siblings if necessary
	//Scale parent to accommodate this and/or moved siblings
	//Recurse

	return child;
}

function addEmptyCut(x,y,parentElement){
	var child = new CutNode(x,y,elementsToNodes.get(parentElement));
	rootElement.appendChild(child.fill);	
	rootElement.appendChild(child.element);
	refresh(child);
	return child;
}