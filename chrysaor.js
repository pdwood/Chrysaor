var nextid = 1;
var rootnode;

window.onload=function(){
	rootnode = document.getElementById('node0');
	rootnode.addEventListener('click', onClickConstructMode);
	document.addEventListener('contextmenu', function(event){return false;});
	rootnode.addEventListener('contextmenu', function(event){addEmptyCut(event,this);return false;});
};

function addVariable(name, x, y, parent){
	var child = document.createElementNS("http://www.w3.org/2000/svg", 'text');
	child.setAttribute("x", x);
	child.setAttribute("y", y);
	child.innerHTML = name; //TODO: Parse Fitch syntax
	child.setAttribute("id", "node"+nextid);
	++nextid;
	child.addEventListener('click', function(event){
		alert("clicked on: " +this.innerHTML);
		event.stopPropagation();
		return false;
	});

	rootnode.appendChild(child);
	return child;
}

function scale(parent, child){
	if(!child || !parent) return;
	//if(parent.getBBox.width && parent.getBBox.height{ //if not at root scope
	if(parent.getBBox().x+parent.getBBox().width < child.getBBox().x+child.getBBox().width){
		parent.setAttribute('width', child.getBBox().x+child.getBBox().width-parent.getBBox().x + 10);
	}
	if(parent.getBBox().y+parent.getBBox().height < child.getBBox().y+child.getBBox().height){
		parent.setAttribute('height', child.getBBox().y+child.getBBox().height-parent.getBBox().y + 10);
	}

	scale(document.getElementById(parent.getAttribute("parent")), parent);
	//}
}

function onClickConstructMode(event){
	var variableName = prompt("Enter name of variable");
	if(!variableName) return;
	var child = addVariable(variableName, event.pageX, event.pageY, this);
	if(parent != rootnode) scale(this, child);
	event.stopPropagation();
}

function addEmptyCut(event, parent){
	var child = document.createElementNS("http://www.w3.org/2000/svg", 'rect');
	child.setAttribute("x", event.pageX);
	child.setAttribute("y", event.pageY);
	child.setAttribute("rx", 30);
	child.setAttribute("ry", 30);
	child.setAttribute("height", 64);
	child.setAttribute("width", 64);
	child.style.fill=(parent.style.fill=="cyan")?"white":"cyan";
	child.setAttribute("id", "node"+nextid);
	child.setAttribute("parent", parent.getAttribute('id'));
	++nextid;
	child.addEventListener('click', onClickConstructMode);
	child.addEventListener('contextmenu', function(event){scale(this, addEmptyCut(event,this)); event.stopPropagation(); return false;});
	rootnode.appendChild(child);
	return child;
}