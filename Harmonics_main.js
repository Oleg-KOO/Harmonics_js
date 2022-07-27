function HandlerToMovePoint(args, point){

	let clientRect = divBox.getBoundingClientRect();
	let dx = args.offsetX * fieldData.width / clientRect.width - fieldData.zeroX - args.currentTarget.attributes.cx.value;
	let dy = args.offsetY * fieldData.width / clientRect.width - fieldData.zeroY - args.currentTarget.attributes.cy.value;
	
	function SetNewCoordinate(args){
		let x = args.offsetX * fieldData.width / clientRect.width - dx - fieldData.zeroX;
		let y = args.offsetY * fieldData.width / clientRect.width - dy - fieldData.zeroY;
		x = fieldData.CheckX(x, point.last);
		y = fieldData.CheckY(y);
		harmonicGraph.RedrawCurrent(point, x, y);
	}
	
	function ResetMove(args){
		divBox.onmousemove = null;
		harmonicGraph.RedrawEnd();
		divBox.onmouseup = null;
	}
	
	divBox.onmousemove = SetNewCoordinate;
	divBox.onmouseup = ResetMove;
}

function ToRefresh(graf){
		let text1 = '';
		for (let item of graf.lineGraph.lineList)   
			text1 += item.toString() + '<br/>';
		lineFunkText.innerHTML = text1;
		
		for (let i = 0; i < graf.listHarmonic.length; i++){
			if (!checkBoxList.has(i)) continue;
			checkBoxList.get(i).childNodes[1].innerHTML = graf.listHarmonic[i].toString();
		}			
}
 
function AddCheckBox(number, checkBoxList){
 	 let box = harmonicsText.appendChild(document.createElement('div'));
	 let checkbox = box.appendChild(document.createElement('input'));
	 checkbox.SetAttr({
		 'type': "checkbox", 
		 'name': 'harmonic#' + number
	 });
	 
	 let label = box.appendChild(document.createElement('label'));
	 label.SetAttr({
		 'for': 'harmonic#' + number
	 });
	 label.innerHTML = 'harmonic#' + number;
	 checkBoxList.set(number, box)
	 checkbox.onclick = function(e){CheckHandler(number, checkBoxList);}
}

function RemoveCheckBox(number, checkBoxList){
	if (!checkBoxList.has(number)) return;
	checkBoxList.get(number).parentElement.removeChild(checkBoxList.get(number));
	checkBoxList.delete(number);
	harmonicGraph.RemoveHarmonicDisplay.call(harmonicGraph, number);
}
 
function CheckHandler(number, checkBoxList){
	let checkBox = checkBoxList.get(number).childNodes[0];
	if(checkBox.checked == true) harmonicGraph.AddHarmonicDisplay.call(harmonicGraph, number);
	else harmonicGraph.RemoveHarmonicDisplay.call(harmonicGraph, number);
}

function AddStartCheckBox(){
	for (let i = 0; i <= harmonicCount.innerHTML; i++) AddCheckBox(i, checkBoxList);
}

SVGElement.prototype.SetAttr = SetAttr;
HTMLElement.prototype.SetAttr = SetAttr;
SVGElement.prototype.AddSVG = AddSVG;
HTMLElement.prototype.AddSVG = AddSVG;

let gridData = new GridData();
let fieldData = new FieldData(1100, gridData);
let scale = new Scale(fieldData.scale);
let box = document.getElementById('harmonic_svgBox');
let divBox = box.AddSVG({
	'tag': 'svg', 
	'width': '100%', 
	'height': '100%', 
	'viewBox': '0 0 ' + fieldData.width + ' ' + fieldData.height
	});
let field = divBox.AddSVG({
	'tag': "g", 
	'class': "field", 
	'stroke': "black", 
	'stroke-width': "1", 
	'fill': "none", 
	'transform': 'translate(' + fieldData.zeroX + ', ' + fieldData.zeroY + ')'
	});

let grid = field.AddSVG({
	'tag': 'g', 
	'class': 'gridLine'
	});
let harmonics = field.AddSVG({
	'tag': 'g', 
	'class': 'harmonics'
	});
let lineFunc = field.AddSVG({
	'tag': 'g', 
	'class': 'lineFunc'
	});

let harmonicFunc = field.AddSVG({
	'tag': 'g', 
	'class': 'harmonicFunc'
	});
	

let pointHandlers = {
	mouseenter:	function(){
			this.selection.SetAttr({
				'fill': 'black', 
				'cursor' : 'grab'
				});
			this.text.setAttribute('visibility', "visible");
	},
	mouseleave: function(){
			this.selection.SetAttr({
				'fill': 'silver', 
				'cursor' : ''
				});
			this.text.setAttribute('visibility', "hidden");
	},
	mousedown: function(event){
			this.selection.SetAttr({
				'cursor' : 'grabbing'
				});
			HandlerToMovePoint(event, this);
	},
	mouseup: function(){
			this.selection.SetAttr({
				'cursor' : 'grab'
				});
	}
}

let points = GetPointArray(field, gridData.startPoints, scale, pointHandlers);
	
let lineGraph = new LineGraph (lineFunc, points, gridData, scale);
let buttonUp = document.getElementById('harmonic_up');
let buttonDown = document.getElementById('harmonic_down');
let harmonicCount = document.getElementById('harmonic_count');
let lineFunkText = document.getElementById('lineFunk');
let harmonicsText = document.getElementById('lineHarmonics');
let checkBoxList = new Map();

harmonics.SetAttr(harmonicsFormat);
lineFunc.SetAttr(lineFuncFormat);
harmonicFunc.SetAttr(harmonicFuncFormat);
CreateGridLine(grid, gridData, scale, majorDivisionsFormat, auxiliaryDivisionsFormat);
CreateAxisLine(grid, gridData, scale, axisFormat, textFormat);
AddStartCheckBox();
 
let harmonicGraph = new HarmonicGraph(harmonicFunc, harmonics, lineGraph, gridData, scale, Number(harmonicCount.innerHTML), ToRefresh);


buttonUp.onclick = function(){
	AddCheckBox(harmonicGraph.listHarmonic.length, checkBoxList);
	harmonicGraph.AddHarmonic.call(harmonicGraph);
	harmonicCount.innerHTML = harmonicGraph.listHarmonic.length == 0 ? '-': harmonicGraph.listHarmonic.length - 1;
};

buttonDown.onclick = function(){
	harmonicGraph.RemoveHarmonic.call(harmonicGraph);
	RemoveCheckBox(harmonicGraph.listHarmonic.length, checkBoxList);
	harmonicCount.innerHTML = harmonicGraph.listHarmonic.length == 0 ? '-': harmonicGraph.listHarmonic.length - 1;
};

window.addEventListener("keydown", function(e) {
    if (e.key == "ArrowUp") buttonUp.click();
	if (e.key == "ArrowDown") buttonDown.click();
});
