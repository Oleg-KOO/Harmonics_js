function SetAttr(attr){
	for (let a in attr){
		if (!(a in this) && (a in this.style)) this.style[a] = attr[a];
		else this.setAttribute(a, attr[a]);
	}
}
	
function AddSVG(attr){
	let newSvg = this.appendChild(CreateSVG(attr.tag));
	if (attr.tag == 'text') { newSvg.innerHTML = attr.text; delete attr.text; }
	delete attr.tag; newSvg.SetAttr(attr);
	return newSvg;
}

function CreateSVG(tag){
	return document.createElementNS('http://www.w3.org/2000/svg', tag);
}
	
function CreatescaleLine (command, startPoint, stopPoint, step){
	if ( startPoint * stopPoint > 0){
		for (let i = startPoint; i <= stopPoint; i+= step) command(i);
		return;	
	}
	for (let i = -step; i >= startPoint; i-= step) command(i);
	for (let i =  step; i <= stopPoint;  i+= step) command(i);
}

function CreateGridLine(field, fieldData, majorDivisionsFormat, auxiliaryDivisionsFormat){
	let scale = fieldData.Scale;
	let gridLine = field.AddSVG({
		'tag': 'g', 
		'class': 
		'gridLine'
		});
	let majorLine = gridLine.AddSVG({
		'tag': 'g', 
		'class': 'majorLine'
		});
	let auxiliaryLine = gridLine.AddSVG({
		'tag': 'g', 
		'class': 'majorLine'
		});
		
	majorLine.SetAttr(majorDivisionsFormat);
	auxiliaryLine.SetAttr(auxiliaryDivisionsFormat);
	let maxX = scale.X(fieldData.maxX);
	let minX = scale.X(fieldData.minX);
	let maxY = scale.Y(fieldData.maxY);
	let minY = scale.Y(fieldData.minY);
	
	CreatescaleLine(function(i){
		let x = scale.X(i);
		auxiliaryLine.AddSVG({
			'tag': 'line', 
			'x1': x, 
			'y1': minY, 
			'x2': x, 
			'y2': maxY
			});
		}, fieldData.minX, fieldData.maxX, fieldData.auxiliaryDivisions);
	
	CreatescaleLine(function(i){
		let y = scale.Y(i);
		auxiliaryLine.AddSVG({
			'tag': 'line', 
			'x1': minX, 
			'y1': y, 
			'x2': maxX, 
			'y2': y
			});
		}, fieldData.minY, fieldData.maxY, fieldData.auxiliaryDivisions);
	
	CreatescaleLine(function(i){
		let x = scale.X(i);
		majorLine.AddSVG({
			'tag': 'line', 
			'x1': x, 
			'y1': minY, 
			'x2': x, 
			'y2': maxY
			});
		}, fieldData.minX, fieldData.maxX, fieldData.majorDivisions);
	
	CreatescaleLine(function(i){
		let y = scale.Y(i);
		majorLine.AddSVG({
			'tag': 'line', 
			'x1': minX, 
			'y1': y, 
			'x2': maxX, 
			'y2': y
			});
		}, fieldData.minY, fieldData.maxY, fieldData.majorDivisions);
	
}

function CreateAxisLine(field, fieldData, axisFormat, textFormat){
	let scale = fieldData.Scale;
	let axis = field.AddSVG({'tag': 'g', 'class': 'axis'});
	let axisLine = axis.AddSVG({
		'tag': 'g', 
		'class': 'axisLine'
		});
	axisLine.SetAttr(axisFormat)
	let def = axisLine.AddSVG({
		'tag': 'defs'
		});
	def.AddSVG({
		'tag': 'path', 
		'id': "markerArrowPath", 
		'd': 'M 0 0 L 0 6 L 30 0 L 0 -6 z'
		});
	axisLine.AddSVG({
		'tag': 'marker', 
		'id': "markerArrow", 
		'orient': 'auto', 
		'markerWidth': 100, 
		'markerHeight': 100, 
		'viewBox': '-30 -30 100 100', 
		'stroke-width': "1", 
		'markerUnits': "userSpaceOnUse"})
	markerArrow.AddSVG({
		'tag': 'use', 
		'href': "#markerArrowPath"
		});
	axisLine.AddSVG({
		'tag': 'line', 
		'x1': scale.X(fieldData.minX), 
		'y1': 0, 
		'x2': scale.X(fieldData.maxX), 
		'y2': 0
		});
	axisLine.AddSVG({
		'tag': 'line', 
		'x1': 0, 
		'y1': scale.Y(fieldData.minY), 
		'x2': 0, 
		'y2': scale.Y(fieldData.maxY)
		});
	let axisDivizion = axis.AddSVG({
		'tag': 'g', 
		'class': 'axisDivizion'
		});
	let textDivizion = axis.AddSVG({
		'tag': 'g', 
		'class': 'textDivizion'
		});
	axisDivizion.SetAttr(axisFormat);
	textDivizion.SetAttr(textFormat);
	textDivizion.AddSVG({
		'tag': 'text', 
		'text': 0, 
		'transform': 'translate(-10, 15)'
		});
	
	CreatescaleLine(function(i){
		let x = scale.X(i);
		axisDivizion.AddSVG({
			'tag': 'line', 
			'x1': x, 
			'y1': -5, 
			'x2': x, 
			'y2': 5
			});
		textDivizion.AddSVG({
			'tag': 'text', 
			'text': i, 
			'transform': 'translate(' + (x - 10) + ', 25)'
			});
		}, fieldData.minX, fieldData.maxX, fieldData.majorDivisions);
		
	CreatescaleLine(function(i){
		let y = scale.Y(i);
		axisDivizion.AddSVG({
			'tag': 'line', 
			'x1': -5, 
			'y1': y, 
			'x2': 5, 
			'y2': y
			});
		textDivizion.AddSVG({
			'tag': 'text', 
			'text': i, 
			'transform': 'translate(-40, ' + (y + 5) + ')'
			});
		}, fieldData.minY, fieldData.maxY, fieldData.majorDivisions);
}	

function GetShadowFilter(name, startX, startY, dx, dy, dev, color = false){
	let defs = CreateSVG('defs');
	let filter = defs.AddSVG({
		'tag': 'filter',
		'id': name,
		'filterUnits': 'userSpaceOnUse',
		'x': startX,
		'y': startY,
		
		'width': "100%", 
		'height': "100%"
		});
	filter.AddSVG({
		'tag': 'feOffset',
		'result': 'offOut',
		'in': color ? 'SourceGraphic' : 'SourceAlpha',
		'dx': dx, 
		'dy': dy 
		});
	filter.AddSVG({
		'tag': 'feGaussianBlur',
		'result': 'blurOut',
		'in': 'offOut',
		'stdDeviation': dev, 
		});
	filter.AddSVG({
		'tag': 'feBlend',
		'in': 'SourceGraphic',
		'in2': 'blurOut',
		'mode': 'normal', 
		});
	return filter;
}
