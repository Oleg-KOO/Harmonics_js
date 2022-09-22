
class FieldData{
	constructor(svgWidth, gridData){
		
		for (let item in gridData) this[item] = gridData[item]

		this.maxX = this.period / 2 + this.period * this.countPeriod;
		this.minX = - this.period / 2;
		this.width = this.maxX - this.minX;
		this.height = this.maxY - this.minY;
		
		this.svgWidth = svgWidth;
		this.scale = (this.svgWidth - 20) / this.width;
		this.svgHeight = this.scale * this.height + 15;
		
		this.zeroX = Math.abs(this.scale * this.minX) + 10 ;
		this.zeroY = this.svgHeight - Math.abs(this.scale * this.minY) - 5;
		this.Scale = new Scale(this.scale);
	}
	
	CheckX(x, last = false){
		x = Math.round(Math.trunc(x/this.scale/this.binding) * this.binding * 10000)/10000; 
		if (x < this.minX) return this.minX;
		if (x > -this.minX || last) return -this.minX;
		return x;
	}
	
	CheckY(y){
		y = Math.round(Math.trunc(-y/this.scale/this.binding) * this.binding * 10000)/10000;
		if (y < this.minY) return this.minY;
		if (y > this.maxY) return this.maxY;
		return y;
	}
}

class Scale{
	constructor(scale){
		this.scale = scale
		}
	X(val)   {return  val * this.scale;}
	Y(val)   {return -val * this.scale;}
	reX(val) {return  val / this.scale;}
	reY(val) {return -val / this.scale;}
}

class PointList{
	constructor(field, fieldData, svgBox){
		this.field = field;
		this.fieldData = fieldData;
		this.svgBox = svgBox;
		this.listPoint = this.GetPoint(fieldData.startPoints);
	}
	
	GetPoint(startPoints){
		let points = []
		for (let i = 0; i < startPoints.length; i++){
			let x = startPoints[i][0]; let y = startPoints[i][1];
			x = x > -this.fieldData.minX ? -this.fieldData.minX : x;
			x = x < this.fieldData.minX ? this.fieldData.minX : x;
			y = y > this.fieldData.maxY ? this.fieldData.maxY : y;
			y = y < this.fieldData.minY ? this.fieldData.minY : y;
			points[i] = new Point(this.field, this.fieldData, this.svgBox, x, y);
		}
		points[startPoints.length - 1].last = true;
		return points;
	}
}

class Point{
	constructor(field, fieldData, svgBox, x, y, last = false){
		this.box = field.AddSVG({
			'tag': 'g', 
			'id': "point"
			});
		this.point = this.box.AddSVG({
			'tag': 'circle', 
			'r': 3, 
			'fill': 'black'});
		this.marker = this.box.AddSVG({
			'tag': 'circle', 
			'r': 25, 
			'fill': 'silver', 
			'opacity': 0.25, 
			'stroke': 'none',
			'filter': "url(#shadowPoints)"
			});
		this.text = this.box.AddSVG({
			'tag': 'text', 
			'fill': 'black', 
			'stroke-width': 0.2, 
			'visibility': 'hidden'
			});
		this.last = last;
		this.fieldData = fieldData;
		this.svgBox = svgBox;
		this.SetHandlers(this.Handlers);
		this.Refresh(x, y);
	}
	
	Handlers = {
		pointerenter:	function(){
				this.marker.style.fill = 'black'
				this.marker.style.cursor = 'grab'
				this.text.style.visibility = 'visible';
		},
		pointerleave: function(){
				this.marker.style.fill = 'silver'
				this.marker.style.cursor = ''
				this.text.style.visibility = 'hidden';
		},
		pointerdown: function(event){
				this.marker.style.cursor = 'grabbing'
				this.MovePoint(event, this);
		},
	}
	
	SetHandlers(handlers){
		for (let handler in handlers){
			this.marker.addEventListener(handler, handlers[handler].bind(this));
		}
	}
	
	Refresh(x, y){
		this.x = x; this.y = y;
		let x1 = this.x * fieldData.scale; let y1 = -this.y * fieldData.scale;
		this.point.setAttribute('cx', x1);
		this.point.setAttribute('cy', y1);
		this.marker.setAttribute('cx', x1);
		this.marker.setAttribute('cy', y1);
		this.text.innerHTML = `x= ${x} y=${y}`;
		this.text.setAttribute('transform', `translate(${x1 + 5}, ${y1 - 20})`);
	}
	
	MovePoint(args){
		let target = args.target;
		target.setPointerCapture(event.pointerId);
		let clientRect = this.svgBox.getBoundingClientRect();
		let dx = args.offsetX * this.fieldData.svgWidth / clientRect.width - this.fieldData.zeroX - args.currentTarget.attributes.cx.value;
		let dy = args.offsetY * this.fieldData.svgWidth / clientRect.width - this.fieldData.zeroY - args.currentTarget.attributes.cy.value;
		
		function SetNewCoordinate(args){
			let x = args.offsetX * this.fieldData.svgWidth / clientRect.width - dx - this.fieldData.zeroX;
			let y = args.offsetY * this.fieldData.svgWidth / clientRect.width - dy - this.fieldData.zeroY;
			x = this.fieldData.CheckX(x, this.last);
			y = this.fieldData.CheckY(y);
			this.Refresh(x, y);
			this.box.dispatchEvent(new CustomEvent("movePoint", {detail:{ 'x': x, 'y': y,}}));
		}
		
		function ResetMove(args){
			target.onpointermove = null;
			target.style.cursor = 'grab';
			this.box.dispatchEvent(new CustomEvent("finishMove"));
		}
		target.onpointermove = SetNewCoordinate.bind(this);
		target.onpointerup = ResetMove.bind(this);
	}
}

class LineFunc{
	constructor(point1, point2, scale, htmlItem, numberPoint, shift){
		this.htmlItem = htmlItem
		this.point1 = point1;
		this.point2 = point2;
		this.scale = scale;
		this.numberPoint = numberPoint
		this.shift = shift;
		this.ratioList = new Map();
		this.text = '';
		this.SetParam();
		point1.box.addEventListener('movePoint', this.Refresh1.bind(this));
		point2.box.addEventListener('movePoint', this.Refresh2.bind(this));
	}
	y(x) { return this.a * x + this.b;}
	check(x) {return x => this.minX && x <= this.maxX;}
	
	SetParam(){
		let x1 = this.point1.x; let x2 = this.point2.x;
		let y1 = this.point1.y; let y2 = this.point2.y;
		if (this.numberPoint == 0) x1 = -x1;
		this.a = Math.round((y2 - y1) / (x2 - x1) * 10000) / 10000;
		this.b = Math.round((y1 - this.a * (x1 + this.shift)) * 10000) / 10000;
		this.maxX = Math.round(Math.max(x1, x2) * 10000) / 10000;
		this.minX = Math.round(Math.min(x1, x2) * 10000) / 10000;
		this.zeroX = Math.round(- this.b / this.a * 10000) / 10000;
		if (this.a != null && this.zeroX > this.minX && this.zeroX < this.maxX) this.zeroCrossX = true;
		else this.zeroCrossX = false;
		this.zeroCrossY = (this.minX * this.maxX) < 0;
		this.ratioList.clear();
		if (this.minX == this.maxX) this.text = 'x= ' + this.minX;
		else this.text = `[${this.minX}< x <${this.maxX}]: y= ${(this.a == 0 ? '': this.a) + (this.a == 0 ? '': '·x') + (this.b == 0 ? '': this.b < 0 ? '': this.a == 0 ? '': ' + ') + (this.b == 0 ? '': this.b)}`;
	}
 
	Refresh1(event){
		let x = event.detail.x; let y = event.detail.y;
		if (this.numberPoint == 0) x = -x;
		this.htmlItem.SetAttr({'x1': this.scale.X(x + this.shift), 'y1': this.scale.Y(y)});
		this.SetParam();
	}
	
	Refresh2(event){
		let x = event.detail.x; let y = event.detail.y;
		this.htmlItem.SetAttr({'x2': this.scale.X(x + this.shift), 'y2': this.scale.Y(y)});
		this.SetParam();
	}
	
	GetRatios(countPoint, period, harmonic){
		let maxX = this.maxX; let minX = this.minX;
		if (maxX == minX) return {'ka': 0, 'kb': 0};
		
		let ratio = this.ratioList.get(harmonic);
		if (ratio !== undefined) return ratio;
		
		let zeroX = this.zeroX;
		let zeroCrossX = this.zeroCrossX; 
		let zeroCrossY = this.zeroCrossY;
		let y = this.y;

		function GetArea(x1, x2, y1, y2){
			let dx   = Math.abs(Math.abs(x1) - Math.abs(x2));
			let dy   = Math.abs(Math.abs(y1) - Math.abs(y2));
			let minY = Math.min(Math.abs(y1), Math.abs(y2));
			let val  = dx * minY + dx * dy / 2;
			if ((Math.abs(y1) > 0.001 && y1 < 0) || (Math.abs(y2) > 0.001 && y2 < 0)) val = -val;
			return val;
		}
		
		function GetInterval(){

			function GetPeriod(x1, x2){
				if (harmonic == 0) return (x2 - x1)
				let count = Math.round((x2 - x1) / period * countPoint);
				if (count == 0) count = 1;
				let interval = 	Math.round((x2 - x1) / (count * harmonic * 10) * 1000000) / 1000000;
				if (interval < 0.000001) interval = 0.000001;
				return interval;
			}
			
			if (zeroCrossX && zeroCrossY && zeroX != 0){
				if (zeroX > 0) return [[minX, 0, GetPeriod(minX, 0)], [0, zeroX, GetPeriod(0, zeroX)], [zeroX, maxX, GetPeriod(zeroX, maxX)]];
				else return [[minX, zeroX, GetPeriod(minX, zeroX)], [zeroX, 0, GetPeriod(zeroX, 0)], [0, maxX, GetPeriod(0, maxX)]];
			}
			if (zeroCrossX) return [[minX, zeroX, GetPeriod(minX, zeroX)], [zeroX, maxX, GetPeriod(zeroX, maxX)]];
			if (zeroCrossY)return [[minX, 0, GetPeriod(minX, 0)], [0, maxX, GetPeriod(0, maxX)]];
			return [[minX, maxX, GetPeriod(minX, maxX)]];
		}
		
		function СalculateRatios(item){
			let pointList = GetInterval();
			let ka = 0; let kb = 0; let x1;
			
			for (let interval of pointList){
				x1 = interval[0];
				for (let x2 = interval[0] + interval[2]; x2 <= interval[1] + 0.0001; x2 += interval[2]){
					
					let ka1 = 1; let ka2 = 1; let kb1 = 1; let kb2 = 1;
					if (harmonic > 0){
						ka1 = Math.cos(Math.PI * harmonic * x1 / period * 2);
						ka2 = Math.cos(Math.PI * harmonic * x2 / period * 2);
						kb1 = Math.sin(Math.PI * harmonic * x1 / period * 2);
						kb2 = Math.sin(Math.PI * harmonic * x2 / period * 2);
					}
					ka += GetArea(x1, x2, y.call(item, x1) * ka1, y.call(item, x2) * ka2);
					kb += GetArea(x1, x2, y.call(item, x1) * kb1, y.call(item, x2) * kb2);
					x1 = x2;
				}
			}
			return {'ka': ka, 'kb': kb};
		}
		
		ratio = СalculateRatios(this);
		this.ratioList.set(harmonic, ratio);
		
		return ratio;
	}

	toString(){
		return this.text;
	}
}

class LineGraph{
	constructor(field, points, fieldData){
		this.allLine = [];
		let countPeriod = fieldData.linearFuncMapping ? fieldData.countPeriod : 0;
		for (let j = 0; j <= countPeriod; j++){
			let point1 = points[points.length - 1];
			this.allLine[j] = [];			
			for (let i = 0; i < points.length; i++)
			{
				let x1 = point1.x; let y1 = point1.y;
				if  (i == 0) x1 = -x1;
				x1 = x1 + fieldData.period * j;
				let x2 = points[i].x + fieldData.period * j; let y2 = points[i].y 
				let item = field.AddSVG({
					'tag': 'line', 
					'x1': fieldData.Scale.X(x1), 
					'y1': fieldData.Scale.Y(y1), 
					'x2': fieldData.Scale.X(x2), 
					'y2': fieldData.Scale.Y(y2),
					});
				this.allLine[j][i] = new LineFunc(point1, points[i], fieldData.Scale, item, i, fieldData.period * j);
				point1 = points[i];
			}
		}
		this.pointList = points;
		this.lineList = this.allLine[0];
	}
		
	GetHarmonicRatios(countPoint, period, harmonic){
		let ka = 0; let kb = 0;
		for (let line of this.lineList){
			let ratios = line.GetRatios(countPoint, period, harmonic);
			ka += ratios.ka;  kb += ratios.kb;
		}
		ka = ka / period * 2; kb = kb / period * 2;
		ka = Math.round(ka * 100000) / 100000;
		kb = Math.round(kb * 100000) / 100000;
		
		return {'ka': ka, 'kb': kb};
	}
}

class Harmonic{
	constructor(lineGraph, countPoint, period, harmonicNumber){
		this.number = harmonicNumber;
		this.lineGraph = lineGraph;
		this.countPoint = countPoint;
		this.period = period;
		this.Refresh();
	}
	
	y(x){
		if (this.number == 0) return this.ka / 2;
		return  this.ka * Math.cos(Math.PI * this.number * x / this.period * 2) +
			this.kb * Math.sin(Math.PI * this.number * x / this.period * 2);
	}
	
	Refresh(){
		let ratios = this.lineGraph.GetHarmonicRatios(this.countPoint, this.period, this.number);
		this.ka = ratios.ka;
		this.kb = ratios.kb;
		this.text = '';
		let textKoef = this.kb < 0 ? '': '+';
		if (this.ka != 0) this.text = this.text + this.ka.toPrecision(3) + '·cos(' + this.number + '·π·x/' + (this.period / 2) + ')';
		if (this.kb != 0) this.text = this.text + textKoef + this.kb.toPrecision(3) + '·sin(' + this.number + '·π·x/' + this.period / 2 + ')';
		if (this.number == 0) this.text = (this.ka / 2).toPrecision(3);
	}
	
	toString(){
		return this.text;
	}
}

class HarmonicGraph{
	
	constructor(mainField, harmonicsField, lineGraph, fieldData, initialHarmonicsCount){
		this.lineGraph = lineGraph;
		this.listHarmonic = [];
		this.fieldData = fieldData;
		this.scale = scale;
		this.harmonicsField = harmonicsField;
		this.harmonicsDisplay = new Map();

		this.harmonic = mainField.AddSVG({
				'tag': 'polyline',
				});
		for (let i = 0; i <= initialHarmonicsCount; i++) this.AddHarmonic();
		for (let point of lineGraph.pointList){
			point.box.addEventListener('movePoint', this.RedrawCurrent.bind(this));
			point.box.addEventListener('finishMove', this.RedrawEnd.bind(this));
		}
	}
	
	GetPointList(){
		let points = ''; 
		let step = (this.fieldData.maxX - this.fieldData.minX) / (this.fieldData.countPoint * (this.fieldData.countPeriod + 1) * this.listHarmonic.length);
		for (let x = this.fieldData.minX; x <= this.fieldData.maxX; x += step){
			let y = 0;
			for (let item of this.listHarmonic) y += item.y(x);
			points += this.fieldData.Scale.X(x) + ',' + this.fieldData.Scale.Y(y) + ' ';
		}
		return points;
	}
	
	GetHarmonic(number){
		let step = (this.fieldData.maxX - this.fieldData.minX) / (this.fieldData.countPoint * (this.fieldData.countPeriod + 1) * this.listHarmonic.length);
		let points = '';
		let item;
		for (let newItem of this.listHarmonic) if (newItem.number == number) {item = newItem; break;}
		for (let x = this.fieldData.minX; x <= this.fieldData.maxX; x += step){
			points += this.fieldData.Scale.X(x) + ',' + this.fieldData.Scale.Y(item.y(x)) + ' ';
		}
		return points;
	}
	
	AddHarmonicDisplay(number){
		let newHarmonic = this.GetHarmonic(number);
		let color = colorList[number % colorList.length];
		let htmlItem = this.harmonicsField.AddSVG({
			'tag': 'polyline',
			'stroke': color,
			'points': newHarmonic
			});
		this.harmonicsDisplay.set(number, htmlItem);
	}
	
	RemoveHarmonicDisplay(number){
		if (!this.harmonicsDisplay.has(number)) return;
		this.harmonicsDisplay.get(number).remove();
		this.harmonicsDisplay.delete(number);
	}
	
	RefreshHarmonicDisplay(){
		for (let item of this.harmonicsDisplay){
			item[1].setAttribute('points', this.GetHarmonic(item[0]));
		}

	}
	
	AddHarmonic(){
		this.listHarmonic[this.listHarmonic.length] = new Harmonic(this.lineGraph, this.fieldData.countPoint, this.fieldData.period, this.listHarmonic.length);
		this.Refresh();
	}
	
	RemoveHarmonic(){
		if (this.listHarmonic.length == 0) return;
		this.listHarmonic.splice(this.listHarmonic.length - 1, 1);
		this.RemoveHarmonicDisplay(this.listHarmonic.length);
		this.Refresh();
	}
	
	Refresh(){
		for (let item of this.listHarmonic) item.Refresh();
		this.harmonic.setAttribute('points', this.GetPointList());
		this.RefreshHarmonicDisplay();
		this.harmonic.dispatchEvent(new CustomEvent("refresh"));
	}
	
	RedrawCurrent(){
		if (this.listHarmonic.length <= 5) this.Refresh();
	}
	
	RedrawEnd(){
		if (this.listHarmonic.length > 5) this.Refresh();
	}
	
	toString(){
		let text1 = '';
		for (let item of this.listHarmonic)
			text1 += item.toString() + '<br/>';
		return text1;
	}
	
}

class ResizeBox{
	constructor(box, move = true, resize = true, proportional = true){
		this.box = box;
		this.move = move;
		this.resize = resize;
		this.proportional = proportional;
		box.onpointerdown = this.ChoiceOfAction.bind(this);
		box.onpointerout = this.Reset.bind(this);
		box.onpointerup = this.Reset.bind(this);
		this.process = '';
		let propList = ['position', 'margin', 'width', 'height', 'left', 'top', 'boxShadow'];
		this.properties = {};
		propList.forEach(item => this.properties[item] = box.style[item]);
	}
		
	handleEvent(event){
		if (event.target != this.box) 
			return;
		this.CheckBorder(event, this.box);
	}
	
	ChoiceOfAction(event){
		if (this.box != event.target) 
			return;
		let check = this.CheckBorder(event, this.box);
		if (check == 'm' && this.move){
			this.Move(event); this.process = 'move';
		}
		else if (check != '' && this.resize){
			this.Resize(event, check); this.process = 'resize'
		}
		else this.Reset(event);
	}
	
	Reset(){
			this.box.style.cursor = '';
			this.box.onpointermove = null;
			this.box.ondragstart = null;
			if (this.process == 'move' && this.CheckTargetParent()) this.ResetFixedPosition(this.box);
			this.process = '';
	}
	
	CheckBorder(event, box){
		let re = 15;
		let bottom = box.clientHeight - event.offsetY < re;
		let right = box.clientWidth - event.offsetX < re;
		let top = event.offsetY < re;
		let left = event.offsetX < re;
		
		if (bottom && left || top && right) { box.style.cursor = 'nesw-resize'; return bottom && left ? 'bl' : 'tr'; }
		if (bottom && right || top && left) { box.style.cursor = 'nwse-resize'; return top && left ? 'tl' : 'br';}
		if (right || left || bottom || top) { box.style.cursor = 'move'; return 'm';}
		box.style.cursor = ''; 
		
		return '';
	}
	
	SetFixedPosition(box){
		
		let clientRect = box.getBoundingClientRect();
	
		let newX = clientRect.x;
		let newY = clientRect.y;
	
		let w = clientRect.width;
		let h = clientRect.height;
		
		box.style.position = 'fixed';
		box.style.margin = '0px';
		box.style.width = w + 'px';
		box.style.width = (w + w - box.offsetWidth) + 'px';
		if (!this.proportional){
			box.style.height = h + 'px';
			box.style.height = (h + h - box.offsetHeight) + 'px';
		}

		box.style.left = newX + 'px';
		box.style.top = newY + 'px';	
	}
	
	ResetFixedPosition(box){
		this.box.parentElement.style.boxShadow = '';
		for (let item in this.properties) box.style[item] = this.properties[item];
	}
		
	Move(event){
	
		let box = this.box;
		box.ondragstart = function(){ return false;};
		box.setPointerCapture(event.pointerId);
		if (box.style.position != 'fixed') this.SetFixedPosition(box);
		let dx = event.clientX - Number(box.style.left.replace('px', ''));
		let dy = event.clientY - Number(box.style.top.replace('px', ''));
		
		box.onpointermove = function(event){
			let box = event.target;
			box.style.left = (event.clientX - dx) + 'px';
			box.style.top = (event.clientY - dy) + 'px';
			if (this.CheckTargetParent()) box.parentElement.style.boxShadow = '0 0 15px 2px green';
			else box.parentElement.style.boxShadow = '';
		}.bind(this);
	};
	
	CheckTargetParent(){
		let v = this.box.style.visibility;
		this.box.style.visibility = 'hidden';
		let elemBelow = document.elementFromPoint(event.clientX, event.clientY);
		this.box.style.visibility = v;
		return (this.box.parentElement != null && this.box.parentElement == elemBelow)
	}
	
	Resize(event, check){
		
		let box = event.target;
		box.ondragstart = function(){ return false;};
		box.setPointerCapture(event.pointerId);
		if (box.style.position != 'fixed') this.SetFixedPosition(box);
		let dx = event.pageX - Number(box.style.left.replace('px', ''));
		dx = event.offsetX > box.offsetWidth / 2 ? dx - Number(box.style.width.replace('px', '')) : dx;
		
		let dy = event.pageY - Number(box.style.top.replace('px', ''));
		dy = event.offsetY > box.offsetHeight / 2 ? dy - Number(box.style.height.replace('px', '')) : dy ;

		let changeFunc = function(event1){this.ChangeSize(event1, check, {X: dx, Y: dy})};
		box.onpointermove = changeFunc.bind(this);
	}
	
	ChangeSize(event, check, start){
		let box = event.target;
		let l = Number(box.style.left.replace('px', ''));
		let t = Number(box.style.top.replace('px', ''));
		let w = Number(box.style.width.replace('px', ''));
		let h = Number(box.style.height.replace('px', ''));
		
		let startHeight = box.offsetHeight;
		let dWidth = event.clientX - start.X - l;
		
		switch (check) {
			case 'br':
				box.style.width = (event.clientX - start.X - l) + 'px';
				if (!this.proportional) box.style.height = (event.clientY - start.Y - t) + 'px';
				break;
			case 'bl':
				box.style.width = (w - dWidth) + 'px';
				box.style.left = (l + dWidth)  +'px';
				if (!this.proportional) box.style.height = (event.clientY - start.Y - t) + 'px';
				break;
			case 'tr':
				box.style.width = (event.clientX - start.X - l) + 'px';
				if (!this.proportional) box.style.height = (h - event.clientY + start.Y + t) + 'px';
				box.style.top = (t + startHeight - box.offsetHeight) + 'px';
				break;
			case 'tl':
				box.style.width = (w - dWidth) + 'px';
				box.style.left = (l + dWidth) +'px';
				if (!this.proportional) box.style.height = (h - event.clientY + start.Y + t) + 'px';
				box.style.top = (t + startHeight - box.offsetHeight) + 'px';
				break;
		}
	}
}

class InformationBlock{
	constructor(lineFuncText, harmonicsText, startCount){
		this.checkBoxList = new Map();
		this.lineFuncText = lineFuncText;
		this.harmonicsText = harmonicsText
		for (let i = 0; i <= startCount; i++) 
			this.AddCheckBox(i);
	}
	
	ToRefresh(graf){
		let text1 = '';
		for (let item of graf.lineGraph.lineList)   
			text1 += item.toString() + '<br/>';
		this.lineFuncText.innerHTML = text1;
		
		for (let i = 0; i < graf.listHarmonic.length; i++){
			if (!this.checkBoxList.has(i)) continue;
			this.checkBoxList.get(i).childNodes[1].innerHTML = graf.listHarmonic[i].toString();
		}			
	}
 
	AddCheckBox(number){
		let box = this.harmonicsText.appendChild(document.createElement('div'));
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
		this.checkBoxList.set(number, box);
		let checkBoxFunc = function(){this.CheckHandler(number)};
		checkbox.onclick = checkBoxFunc.bind(this);
	}

	RemoveCheckBox(number){
		if (!this.checkBoxList.has(number)) return;
		this.checkBoxList.get(number).parentElement.removeChild(this.checkBoxList.get(number));
		this.checkBoxList.delete(number);
	}
	 
	CheckHandler(number){
		let checkBox = this.checkBoxList.get(number).childNodes[0];
		if(checkBox.checked == true) this.harmonicsText.dispatchEvent(new CustomEvent("markerRemoved", {detail:{ 'number': number}}));
		else this.harmonicsText.dispatchEvent(new CustomEvent("markerRaised", {detail:{ 'number': number}}));
	}
}
