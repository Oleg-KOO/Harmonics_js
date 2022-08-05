class GridData{
	maxY = 2.5;
	minY = -2.5;
	period = 4;
	countPeriod = 1;
	majorDivisions = 0.5;
	auxiliaryDivisions = 0.1;
	binding = 0.05;
	countPoint = 30;
	linearFuncMapping = true;
	startPoints = [[-1.5, -2], [-1.1, 2], [-0.5, 2], [1.5, -2], [this.period / 2, -2]];
	constructor(){
		this.maxX = this.period / 2 + this.period * this.countPeriod;
		this.minX = - this.period / 2;
		this.width = this.maxX - this.minX;
		this.height = this.maxY - this.minY;
	}
}

let axisFormat = {
	'stroke': "black", 
	'stroke-width': "2",
	//'marker-end': "url(#markerArrow)"
}

let textFormat = {
	'stroke': "black", 
	'stroke-width': "0.5",
	'font-size': '100%',
	'fill': 'black',
	
}

let lineFuncFormat = {
	'stroke': "blue", 
	'stroke-width': "3",
	'opacity': 0.8,
}

let harmonicFuncFormat = {
	'stroke': "red", 
	'stroke-width': "3",
}

let harmonicsFormat = {
	'stroke-width': "1",
	'opacity': 0.6,
}

let majorDivisionsFormat = {
	'stroke': "gray", 
	'stroke-width': "1"
}

let auxiliaryDivisionsFormat = {
	'stroke': "silver", 
	'stroke-width': "0.5"
}

let colorList = [
	'#FF0000',
	'#FF00FF',
	'#800080',
	'#800000',
	'#808000',
	'#00FF00',
	'#008000',
	'#00FFFF',
	'#0000FF',
	'#008080',
	'#808080',
]