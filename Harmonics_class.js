class FieldData{
	constructor(width){
		this.width = width;
		this.scale = (this.width - 20) / gridData.width;
		this.height = this.scale * gridData.height + 15;
		this.zeroX = Math.abs(this.scale * gridData.minX) + 10 ;
		this.zeroY = this.height - Math.abs(this.scale * gridData.minY) - 5;
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

class Point{
	constructor(field, x, y, scale, last = false){
		this.box = field.AddSVG({
			'tag': 'g', 
			'id': "point"
			});
		this.point = this.box.AddSVG({
			'tag': 'circle', 
			'r': 3, 
			'fill': 'black'});
		this.selection = this.box.AddSVG({
			'tag': 'circle', 
			'r': 25, 
			'fill': 'silver', 
			'opacity': 0.25, 
			'stroke': 'none'
			});
		this.text = this.box.AddSVG({
			'tag': 'text', 
			'fill': 'black', 
			'stroke-width': 0.2, 
			'visibility': "hidden"
			});
		this.last = last;
		this.scale = scale;
		this.dependentElements = [];
		this.Refresh(x, y);
	}
	
	Refresh(x, y){
		this.x = x; this.y = y;
		let x1 = scale.X(this.x); let y1 = scale.Y(this.y)
		this.point.setAttribute('cx', x1);
		this.point.setAttribute('cy', y1);
		this.selection.setAttribute('cx', x1);
		this.selection.setAttribute('cy', y1);
		this.text.innerHTML = 'x=' +  x + ' y=' + y;
		this.text.setAttribute('transform', 'translate(' + (x1 + 5) + ', ' + (y1 - 20) + ')');
		for (let elem of this.dependentElements) elem[1].call(elem[0], x, y);
	}
	
	SetRefresh(refresh){
		this.dependentElements[this.dependentElements.length] = refresh;
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
		point1.SetRefresh([this, this.Refresh1]);
		point2.SetRefresh([this, this.Refresh2]);
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
		else this.text = '[' + this.minX + '< x <' + this.maxX + ']: y= ' + (this.a == 0 ? '': this.a) + (this.a == 0 ? '': '·x') + (this.b == 0 ? '': this.b < 0 ? '': this.a == 0 ? '': ' + ') + (this.b == 0 ? '': this.b);
	}
 
	Refresh1(x, y){
		if (this.numberPoint == 0) x = -x;
		this.htmlItem.SetAttr({'x1': this.scale.X(x + this.shift), 'y1': this.scale.Y(y)});
		this.SetParam();
	}
	
	Refresh2(x, y){
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
	constructor(field, points, gridData, scale){
		this.allLine = [];
		let countPeriod = gridData.linearFuncMapping ? gridData.countPeriod : 0;
		for (let j = 0; j <= countPeriod; j++){
			let point1 = points[points.length - 1];
			this.allLine[j] = [];			
			for (let i = 0; i < points.length; i++)
			{
				let x1 = point1.x; let y1 = point1.y;
				if  (i == 0) x1 = -x1;
				x1 = x1 + gridData.period * j;
				let x2 = points[i].x + gridData.period * j; let y2 = points[i].y 
				let item = field.AddSVG({
					'tag': 'line', 
					'x1': scale.X(x1), 
					'y1': scale.Y(y1), 
					'x2': scale.X(x2), 
					'y2': scale.Y(y2),
					});
				this.allLine[j][i] = new LineFunc(point1, points[i], scale, item, i, gridData.period * j);
				point1 = points[i];
			}
		}
		this.lineList = this.allLine[0];
	}
		
	GetHarmonicRatios(countPoint, period, harmonic){
		let ka = 0; let kb = 0;
		for (let line of this.lineList){
			let ratios = line.GetRatios(countPoint, period, harmonic);
			ka += ratios.ka;  kb += ratios.kb;
		}
		
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
		if (this.number == 0) return this.ka / this.period;
		return this.ka * Math.cos(Math.PI * this.number * x / this.period * 2)/ this.period * 2 +
			   this.kb * Math.sin(Math.PI * this.number * x / this.period * 2)/ this.period * 2;
	}
	
	Refresh(){
		let ratios = this.lineGraph.GetHarmonicRatios(this.countPoint, this.period, this.number);
		this.ka = ratios.ka;
		this.kb = ratios.kb;
		this.text = '';
		let textKoef = this.kb < 0 ? '': '+';
		if (this.ka != 0) this.text = this.text + this.ka.toPrecision(3) + '·cos(' + this.number + '·π·x/' + (this.period / 2) + ')';
		if (this.kb != 0) this.text = this.text + textKoef + this.kb.toPrecision(3) + '·sin(' + this.number + '·π·x/' + this.period / 2 + ')';
		if (this.number == 0) this.text = this.ka.toPrecision(3);
	}
	
	toString(){
		return this.text;
	}
}

class HarmonicGraph{
	
	constructor(mainField, harmonicsField, lineGraph, gridData, scale, initialHarmonicsCount, toRefresh){
		this.lineGraph = lineGraph;
		this.listHarmonic = [];
		this.gridData = gridData;
		this.scale = scale;
		this.harmonicsField = harmonicsField;
		this.toRefresh = toRefresh;
		this.harmonicsDisplay = new Map();

		this.harmonic = mainField.AddSVG({
				'tag': 'polyline', 
				});
		for (let i = 0; i <= initialHarmonicsCount; i++) this.AddHarmonic();
	}
	
	GetPointList(){
		let points = ''; 
		let step = (this.gridData.maxX - this.gridData.minX) / (this.gridData.countPoint * (this.gridData.countPeriod + 1) * this.listHarmonic.length);
		for (let x = this.gridData.minX; x <= this.gridData.maxX; x += step){
			let y = 0;
			for (let item of this.listHarmonic) y += item.y(x);
			points += this.scale.X(x) + ',' + this.scale.Y(y) + ' ';
		}
		return points;
	}
	
	GetHarmonic(number){
		let step = (this.gridData.maxX - this.gridData.minX) / (this.gridData.countPoint * (this.gridData.countPeriod + 1) * this.listHarmonic.length);
		let points = '';
		let item;
		for (let newItem of this.listHarmonic) if (newItem.number == number) {item = newItem; break;}
		for (let x = this.gridData.minX; x <= this.gridData.maxX; x += step){
			points += this.scale.X(x) + ',' + this.scale.Y(item.y(x)) + ' ';
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
		this.harmonicsDisplay.get(number).parentElement.removeChild(this.harmonicsDisplay.get(number));
		this.harmonicsDisplay.delete(number);
	}
	
	RefreshHarmonicDisplay(){
		for (let item of this.harmonicsDisplay){
			item[1].setAttribute('points', this.GetHarmonic(item[0]));
		}

	}
	
	AddHarmonic(){
		this.listHarmonic[this.listHarmonic.length] = new Harmonic(this.lineGraph, this.gridData.countPoint, this.gridData.period, this.listHarmonic.length);
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
		let points = this.GetPointList();
		if (points == '') return;
		this.harmonic.setAttribute('points', points);
		this.RefreshHarmonicDisplay();
		this.toRefresh(this);
	}
	
	RedrawCurrent(currentPointBox, x, y){
		currentPointBox.Refresh(x, y);
		if (this.listHarmonic.length <= 5) this.Refresh();
	}
	
	RedrawEnd(currentPointBox){
		if (this.listHarmonic.length > 5) this.Refresh();
	}
	
	toString(){
		let text1 = '';
		for (let item of this.listHarmonic)
			text1 += item.toString() + '<br/>';
		return text1;
	}
	
}

