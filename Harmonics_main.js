
SVGElement.prototype.SetAttr = SetAttr;
HTMLElement.prototype.SetAttr = SetAttr;
SVGElement.prototype.AddSVG = AddSVG;
HTMLElement.prototype.AddSVG = AddSVG;
SVGElement.prototype.CreateSVG = CreateSVG;

let gridData = new GridData();
let fieldData = new FieldData(1100, gridData);
let scale = new Scale(fieldData.scale);
let svgBox = document.getElementById('harmonic_svgBox');
let divBox = svgBox.AddSVG({
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
let defs = field.AddSVG({
	'tag': "defs"
	});
let grid = field.AddSVG({
	'tag': 'g', 
	'class': 'gridLine'
	});
let harmonics = field.AddSVG({
	'tag': 'g', 
	'class': 'harmonics',
	'filter': "url(#shadowHarmonics)"
	});
let lineFunc = field.AddSVG({
	'tag': 'g', 
	'class': 'lineFunc',
	'filter': "url(#shadowLineGraf)"
});
let harmonicFunc = field.AddSVG({
	'tag': 'g', 
	'class': 'harmonicFunc',
	'filter': "url(#shadowHarmonicGraf)",
	});
let pointsField = field.AddSVG({
	'tag': 'g', 
	'class': 'points',
	});
	
defs.appendChild(GetShadowFilter('shadowPoints', scale.X(gridData.minX), scale.Y(gridData.maxY), 5, 5, 5));
defs.appendChild(GetShadowFilter('shadowHarmonics', scale.X(gridData.minX), scale.Y(gridData.maxY), 3, 3, 4));
defs.appendChild(GetShadowFilter('shadowLineGraf', scale.X(gridData.minX), scale.Y(gridData.maxY), 5, 5, 5));
defs.appendChild(GetShadowFilter('shadowHarmonicGraf', scale.X(gridData.minX), scale.Y(gridData.maxY), 7, 7, 7));	

harmonics.SetAttr(harmonicsFormat);
lineFunc.SetAttr(lineFuncFormat);
harmonicFunc.SetAttr(harmonicFuncFormat);
CreateGridLine(grid, gridData, scale, majorDivisionsFormat, auxiliaryDivisionsFormat);
CreateAxisLine(grid, gridData, scale, axisFormat, textFormat);	

let buttonUp = document.getElementById('harmonic_up');
let buttonDown = document.getElementById('harmonic_down');
let harmonicCount = document.getElementById('harmonic_count');
let lineFunkText = document.getElementById('lineFunk');
let harmonicsText = document.getElementById('lineHarmonics');
let points = new PointList(pointsField, fieldData, divBox, gridData.startPoints);
let lineGraph = new LineGraph (lineFunc, points.listPoint, gridData, scale);
let iformBlock = new InformationBlock(lineFunkText, harmonicsText, Number(harmonicCount.innerHTML));
let harmonicGraph = new HarmonicGraph(harmonicFunc, harmonics, lineGraph, gridData, scale, Number(harmonicCount.innerHTML));

harmonicGraph.harmonic.addEventListener("refresh", function(){iformBlock.ToRefresh(harmonicGraph)});
iformBlock.harmonicsText.addEventListener("markerRemoved", function(event){harmonicGraph.AddHarmonicDisplay(event.detail.number)});
iformBlock.harmonicsText.addEventListener("markerRaised", function(event){harmonicGraph.RemoveHarmonicDisplay(event.detail.number)});
harmonicGraph.Refresh();

buttonUp.onclick = function(){
	iformBlock.AddCheckBox(harmonicGraph.listHarmonic.length);
	harmonicGraph.AddHarmonic();
	harmonicCount.innerHTML = harmonicGraph.listHarmonic.length == 0 ? '-': harmonicGraph.listHarmonic.length - 1;
};
buttonDown.onclick = function(){
	harmonicGraph.RemoveHarmonic();
	iformBlock.RemoveCheckBox(harmonicGraph.listHarmonic.length);
	harmonicCount.innerHTML = harmonicGraph.listHarmonic.length == 0 ? '-': harmonicGraph.listHarmonic.length - 1;
};
window.addEventListener("keydown", function(e) {
    if (e.key == "ArrowUp") buttonUp.click();
	if (e.key == "ArrowDown") buttonDown.click();
});

let title = document.getElementById('title');
let mainBox = document.getElementsByClassName('box')[0];
let boxFunk = document.getElementsByClassName('funk');
let boxFunk2 = document.getElementsByClassName('button_content')[0];
let boxFunk3 = document.getElementsByClassName('content')[0];

mainBox.addEventListener('pointermove', new ResizeBox(mainBox));
svgBox.addEventListener('pointermove', new ResizeBox(svgBox));
boxFunk[0].addEventListener('pointermove', new ResizeBox(boxFunk[0], true, true, false));
boxFunk[1].addEventListener('pointermove', new ResizeBox(boxFunk[1], true, true, false));
boxFunk2.addEventListener('pointermove', new ResizeBox(boxFunk2, true, true, false));
boxFunk3.addEventListener('pointermove', new ResizeBox(boxFunk3, true, true, false));
