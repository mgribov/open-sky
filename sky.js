var ctx;
var tool;
var console;
var windowSize;
var starSet, skylineSet, obslineSet, compassSet, labelSet;

var stopMoving = false;
var moveIndex;
var drawingObject;

function Tool() {
	this.secO = this.secN = 60;
	this.countFrame = 0;
	this.frame;

	this.fps = function() {
		this.time = new Date();
		this.secO = this.secN;
		this.secN = this.time.getSeconds();
		if(this.secO == this.secN) {
			this.countFrame++
		} else {
			this.frame = this.countFrame;
			this.countFrame = 0;
		}
		return "fps = " + this.frame;
	}
	this.performance = function(hipfm) {
		if(hipfm) {
//			if(this.fps < 10) {
				starSet.checkEachVisible(4);
				skylineSet.visible = false;
				obslineSet.visible = false;
//			}
		}
	}
	this.resizeHandler = function() {
		windowSize = new WindowSize();
		ctx.canvas.width = windowSize.width;
		ctx.canvas.height = windowSize.height;
		if(console.fullMap) console.forceSetScale(windowSize.getFullBall());
		else console.setScale(windowSize.getRadius());
	}
}
function currentTime() {
	time = new Date();
	hourTime = time.getHours();
	minTime = time.getMinutes();
	secTime = time.getSeconds();
	msecTime = time.getMilliseconds();
	// getDay, getDate, getMonth, getYear
	return (60*minTime + secTime + msecTime/1000)%360;
}
function WindowSize() {
	this.width = window.innerWidth;
	this.height = window.innerHeight;
	this.halfWidth = Math.floor(this.width/2);
	this.halfHeight = Math.floor(this.height/2);

	this.getRadius = function() {
		this.radius = Math.sqrt(Math.pow(this.width, 2) + Math.pow(this.height, 2));
		this.radius *= 1.125/2;
		this.radius = Math.floor(this.radius);
		return this.radius;
	}
	this.getFullBall = function() {
		this.radius = (this.width < this.height) ? this.width : this.height;
		this.radius *= 0.950/2;
		return this.radius;
	}
}

function Sky(rotation) {
	this.rotation = rotation;

	this.position = function(xy) {
		this.radec = [];
		this.xyz = [0, 0, 0];
		this.ref = [0, 0, 0];

		this.xyz[0] = xy[0];
		this.xyz[2] = xy[1];
		this.xyz[1] = Math.sqrt(Math.pow(console.scale, 2) - Math.pow(this.xyz[0], 2) - Math.pow(this.xyz[2], 2));
		if(isNaN(this.xyz[1])) return;

		this.xyz = ezGL.rotateX(this.xyz, -console.altitude);
		this.xyz = ezGL.rotateY(this.xyz, -console.azimuth);
		this.xyz = ezGL.scale(this.xyz, 1/console.scale);

		if(this.rotation) {
			this.xyz = ezGL.rotateX(this.xyz, -console.latitude);
			this.xyz = ezGL.rotateZ(this.xyz, -moveIndex); // rotate sky by celestial-pole-axis.
		} else {
			this.xyz = ezGL.rotateX(this.xyz, -90);
		}
		this.ref = ezGL.rotateZ(this.xyz, 90); // create ref point at 90 degree ahead

		this.xyz = ezGL.rotateY(this.xyz, -180); // flip real-world-coordinate to computer-coordinate.
		this.ref = ezGL.rotateY(this.ref, -180); // flip real-world-coordinate to computer-coordinate.

		this.rDec = Math.asin(this.xyz[2]);
		this.rRA =  Math.asin(this.xyz[0] / Math.cos(this.rDec));

		this.refDec = Math.asin(this.ref[2]);
		this.refRA =  Math.asin(this.ref[0] / Math.cos(this.refDec));

		this.radec[0] = this.rRA*12/Math.PI;
		this.radec[1] = this.rDec*180/Math.PI;;
		
		this.refRA = this.refRA*12/Math.PI;

		if(this.refRA < 0) {
			this.radec[0] = 12 - this.radec[0];
		} else {
			if(this.radec[0] < 0) this.radec[0] = 24 + this.radec[0];
		}
		if(isNaN(this.radec[0])) this.radec[0] = 0;
		if(!this.rotation) {
			this.radec[0] = (36 - this.radec[0])%24;
			this.radec[0] *= 15;
		}
		return this.radec;
	}
	this.stringPosition = function(xy) {
		if(!this.position(xy)) return;
		this.radec = this.position(xy);
		if(this.rotation) { // ra dec
			this.text = "RA " + this.toDegree(this.radec[0], false);
			this.text += ",   Dec " + this.toDegree(this.radec[1], true);
		} else { // atz, att
			this.text = this.toDegree(this.radec[0], true);
			this.text += ",   " + this.toDegree(this.radec[1], true);
		}
		return this.text;
	}
	this.toDegree = function(decimal, type) {
		if(type) this.separator = ["d ", "' ","\""]; // !!!!!!!!!!!! need degree symbol (small o)
		else this.separator = ["h ", "m ", "s"];

		this.minusSign = false
		this.text = "";
		if(decimal < 0) {
			decimal = -decimal;
			this.minusSign = true;
		}
		this.abc = [];
		this.abc[0] = Math.floor(decimal);
		this.abc[1] = decimal - this.abc[0];
		this.abc[1] *= 60;
		this.abc[2] = this.abc[1];
		this.abc[1] = Math.floor(this.abc[1]);
		this.abc[2] = this.abc[2] - this.abc[1];
		this.abc[2] *= 60
		this.abc[2] = Math.floor(this.abc[2]*10)/10;

		if(!(this.abc[0] == 0 && this.abc[1] == 0 && this.abc[2] == 0) && this.minusSign) this.text += "-";
		// !!!!!!!!!!!!!!!!! seriously, how to compare Each value in array???
		for(i = 0; i < 3; i++) {
			this.text += this.abc[i] + this.separator[i];
		}
		return this.text;
	}
}
function Star(name, ra, dec, mag) {
	this.name = name;
	this.ra = ra;
	this.dec = dec;
	this.mag = mag;
	this.xy = [];

	this.visible = true;
	this.nameable = false;
	this.selectable = false;
	this.mouseOn = false;

	this.shape = 0;
	this.coulor = "darkblue";

// ======= calculation section ==========
	this.rRA = this.ra*Math.PI/12;
	this.rDec = this.dec*Math.PI/180;
	this.cartesian = [Math.sin(this.rRA)*Math.cos(this.rDec),
					  Math.cos(this.rRA)*Math.cos(this.rDec),
					  Math.sin(this.rDec)];
	this.getRadius = function() {
		this.radius = (6 - this.mag > 1) ? 6 - this.mag : 1;
		return this.radius;
	}
	this.plotPosition = function(skyRotation) {
		// =========== init sky section ============
		xyz = this.cartesian;
		xyz = ezGL.toRealWorldCoordinate(xyz);
		if(skyRotation) {
			xyz = ezGL.rotateZ(xyz, moveIndex); // rotate sky by celestial-pole-axis. -- use 20 to see orion
			xyz = ezGL.rotateX(xyz, console.latitude);
		} else {
			xyz = ezGL.rotateX(xyz, 90);
		}
		if(console.lockUnderFeet) {
			if(xyz[1] + 0.1 < 0) return false; // draw star above earth surface only.
		}

		// =========== show sky section ============
		xyz = ezGL.scale(xyz, console.scale);
		xyz = ezGL.rotateY(xyz, console.azimuth);
		xyz = ezGL.rotateX(xyz, console.altitude);
		if(xyz[1] < 0) return false;

		if(!this.checkOnScreen(xyz[0], xyz[2])) return false; // draw on screen only
		this.xy = [xyz[0], xyz[2]];
		return true;
	}
	this.plot = function(skyRotation) {
		if(!this.visible) return;
		if(!this.plotPosition(skyRotation)) return;
		this.checkMouseOver()
		if(this.mag != -10) {
			this.plotStar();
		} else {
			ctx.fillText(this.name, this.xy[0], this.xy[1]);
		}

		drawingObject++;
	}
	this.plotName = function() {
		if(this.nameable) {
			ctx.fillText(this.name, this.xy[0] + 2, this.xy[1] - 6);
//			ctx.fillText(this.shape, this.xy[0] -5, this.xy[1] - 6); // get star info here
		}
	}
	this.plotStar = function() {
		ctx.save();
		ctx.translate(this.xy[0], this.xy[1]);
		ctx.scale(this.getRadius(),this.getRadius());
		ctx.fillStyle = this.coulor;
		switch(this.shape) {
			case 0:
				ctx.beginPath();
				ctx.arc(0,0, 1, 0, 2*Math.PI);
				ctx.fill();
				break;
			case 1:
				ctx.beginPath();
				ctx.moveTo(-3, 0);
				ctx.lineTo(3, 0);
				ctx.lineTo(-2, 2);
				ctx.lineTo(0, -2);
				ctx.lineTo(2, 2);
				ctx.fill();
		}
		ctx.restore();
	}

	this.checkMouseOver = function() {
		if(!this.selectable) return;
		overSize = 2.5;
		mouseX = mouse.oxy[0] - this.xy[0];
		mouseY = mouse.oxy[1] - this.xy[1];

		if(Math.sqrt(Math.pow(mouseX, 2) + Math.pow(mouseY, 2)) < overSize*this.getRadius()) {
			this.mouseOn = true;
			this.coulor = "yellow";
			this.plotName();
		} else {
			this.mouseOn = false;
			this.coulor = "red";
		}
	}
	this.checkOnScreen = function(x, y) {
		overSize = 1.025;
		if(x > overSize*windowSize.halfWidth || x < -overSize*windowSize.halfWidth ||
		   y > overSize*windowSize.halfHeight || y < -overSize*windowSize.halfHeight)
			return false;
		return true;
	}
	this.checkVisible = function(min_mag) {
		if(this.mag > min_mag) this.visible = false;
		else this.visible = true;
	}
	this.checkSignificant = function(min_mag) {
		if(this.mag > min_mag) {
			this.nameable = false;
			this.selectable = false;
		} else {
			this.nameable = true;
			this.selectable = true;
		}
	}
}
function Console() {
	this.longtitude; // !!!!!!!!!!!!!!!!!!! emergency !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
	this.latitude;

	this.scale;
	this.azimuth;
	this.altitude;

	this.sw_scale;
	this.sw_azimuth;
	this.sw_altitude;

	this.fullMap = false;
	this.forceZoom = false;
	this.trackStar = false;
	this.lockUnderFeet = true;

	this.setLatitude = function(latitude) {
		this.latitude = latitude;
	}

	this.setScale = function(scale) {
		if(scale < windowSize.getRadius()) return;
		this.scale = scale;
	}
	this.forceSetScale = function(scale) { // use this to show full sky chart (full ball)
		this.scale = scale;
		this.setAzimuth(180);
		this.setAltitude(90);
	}
	this.setAzimuth = function(azimuth) {
		this.azimuth = 180 - azimuth;
	}
	this.setAltitude = function(altitude) {
		if(altitude < 0 || altitude > 90) return;
		this.altitude = altitude - 90;
	}

	this.save = function() {
		this.sw_scale = this.scale;
		this.sw_azimuth = this.azimuth;
		this.sw_altitude = this.altitude;
	}
	this.restore = function() {
		if(windowSize.getRadius() > this.sw_scale) {
			this.scale = windowSize.getRadius();
		} else {
			this.scale = this.sw_scale;
		}
		this.azimuth = this.sw_azimuth;
		this.altitude = this.sw_altitude;
	}

	this.addScale = function(zoom) {
		if(this.fullMap) return;
		maxZoom = 20000;  // !!!!!!!!!!! what's max?????????????????
		if(this.scale + zoom < windowSize.getRadius()) this.scale = windowSize.getRadius();
		else if(this.scale + zoom > maxZoom) this.scale = maxZoom;
		else this.scale += zoom;
	}
	this.forceAddScale = function(zoom) {
		this.scale += zoom;
	}
	this.addAzimuth = function(angle) {
		if(this.fullMap) return;
		this.azimuth += angle;
	}
	this.addAltitude = function(angle) {
		if(this.fullMap) return;
		if(this.altitude + angle < -90) this.altitude = -90;
		else if(this.altitude + angle > 0) this.altitude = 0;
		else this.altitude += angle;
	}

	this.panFactor = function() {
		angle = 1.5*windowSize.getRadius()/this.scale;
		return angle;
	}
	this.changeFullMap = function() {
		this.fullMap = !this.fullMap;
		mouse.changeControl();
		ground.changeFullMap();
	}
	this.starTraking = function() {
		this.trackStar = !this.trackStar;
	}
	this.changeLockUnderFeet = function() {
		this.lockUnderFeet = !this.lockUnderFeet;
	}
}
function PlotSet(plotSet, rotation) {
	this.plotSet = plotSet;
	this.visible = true;
	this.nameable = true;
	this.rotation = rotation;

	this.plotSky = function() {
		if(!this.visible) return;
		for(i = 0; i < this.plotSet.length; i++) {
			if(this.plotSet[i] == null) continue;
			this.plotSet[i].plot(this.rotation);

			if(this.nameable)
				this.plotSet[i].plotName();


		}
	}

	this.changeVisible = function() {
		this.visible = !this.visible;
	}
	this.changeNameable = function() {
		this.nameable = !this.nameable;
	}
	this.checkEachVisible = function(min_mag) {
		for(i = 0; i < this.plotSet.length; i++) {
			if(this.plotSet[i] == null) continue;
			this.plotSet[i].checkVisible(min_mag);
		}
	}
	this.checkEachNameable = function(min_mag) {
		for(i = 0; i < this.plotSet.length; i++) {
			if(this.plotSet[i] == null) continue;
			this.plotSet[i].checkSignificant(min_mag);
		}
	}
	this.changeEachShape = function() {
		for(i = 0; i < this.plotSet.length; i++) {
			if(this.plotSet[i] == null) continue;
			this.plotSet[i].shape++
			this.plotSet[i].shape %= 2
		}
	}
}
function LineSet(lineSet, rotation) { // ???
	this.lineSet = lineSet;
	this.visible = true;
	this.nameable = true;
	this.rotation = rotation;

	this.plotLine = function() {
		if(!this.visible) return;
		for(i = 0; i < this.plotLine.length; i++) {
			if(this.plotLine[i] == null) continue;
			if(!this.plotLine[i].visible) continue; // show only selected magnitute

			// =========== init sky section ============
			xyz = this.plotLine[i].cartesian;
			xyz = ezGL.toRealWorldCoordinate(xyz);
			if(this.rotation) {
				xyz = ezGL.rotateZ(xyz, moveIndex); // rotate sky by celestial-pole-axis. -- use 20 to see orion
				xyz = ezGL.rotateX(xyz, console.latitude);
			} else {
				xyz = ezGL.rotateX(xyz, 90);
			}
			if(console.lockUnderFeet) {
				if(xyz[1] + 0.1 < 0) continue; // draw star above earth surface only.
			}

			// =========== show sky section ============
			xyz = ezGL.scale(xyz, console.scale);
			xyz = ezGL.rotateY(xyz, console.azimuth);
			xyz = ezGL.rotateX(xyz, console.altitude);
			if(xyz[1] < 0) continue;

			if(!this.checkOnScreen(xyz[0], xyz[2])) continue; // draw on screen only

			if(plotLine[i].mag != -10) {
				ctx.beginPath();
				ctx.arc(xyz[0], xyz[2], plotLine[i].getRadius(), 0, 2*Math.PI);
				ctx.fill();
			} else {
				ctx.fillText(this.plotLine[i].name, xyz[0], xyz[2]);
			}
			if(this.nameable && plotLine[i].nameable) ctx.fillText(this.plotLine[i].name, xyz[0]+3, xyz[2]+7);

			drawingObject++;
		}
	}
}

function Ground() {
	this.fullMap = false;

	this.groundFill = "rgb(50, 0, 0)"//"rgba(15, 0, 5, 1)"; // change last value for alpha
	//	skyFill = "gray";

	this.plotGround = function() {
		ctx.save();
		ctx.fillStyle = this.groundFill;
		ctx.fillRect(-windowSize.halfWidth, -windowSize.halfHeight, windowSize.width, windowSize.height);
		ctx.restore();

		if(!this.fullMap || !console.fullMap)
			this.clipUnderground();
		else {
			ctx.beginPath();
			ctx.arc(0, 0, console.scale, 0, 2*Math.PI);
			ctx.clip();
		}
		ctx.clearRect(-windowSize.halfWidth, -windowSize.halfHeight, windowSize.width, windowSize.height);
	}
	this.clipUnderground = function() {
		xyz = [1, 0, 0]; // E
		xyz = ezGL.rotateY(xyz, 180);
		xyz = ezGL.rotateX(xyz, 90);
		xyz = ezGL.scale(xyz, console.scale);
		xyz = ezGL.rotateY(xyz, 90);
		xyz = ezGL.rotateX(xyz, console.altitude);
		a = console.scale;
		b = xyz[2];

		plotGroundSet = [];
		for(i = 0; i <= 40; i++) {
			x = (windowSize.halfWidth > console.scale) ? windowSize.halfWidth : console.scale;
			x *= (i-20)/20;
			y = b*Math.sqrt(1 - Math.pow(x/a, 2));
			plotGroundSet[i] = [x, y];
		}
		plotGroundSet[41] = [windowSize.halfWidth, -windowSize.halfHeight];
		plotGroundSet[42] = [-windowSize.halfWidth, -windowSize.halfHeight];

		ezGL.clipPolygon(plotGroundSet);
	}

	this.changeFullMap = function() {
		this.fullMap = !this.fullMap
	}
}

// +++++++++++++++++ chang parameters here to see what's going on +++++++++++++++++++
function initUtil() {
	tool = new Tool();

	mouse = new MouseControl();
	keyboard = new KeyboardControl();
}
function initConsole() {
	console = new Console();
	tool.resizeHandler();

	console.setLatitude(30); // where you live? ^__^
	console.setScale(windowSize.getRadius()); // old parameter = 750, need to be re calculate
	console.setAzimuth(90); // move mouse in vertical. parameter between 0 (north) round to 360
	console.setAltitude(20); // move mouse in horizental. parameter between 0 to 90 (zenith)
}
function initPlot() {
	ezGL = new EzGL();

	initStar();
	starSet = new PlotSet(star, true);

	sky = new Sky(true);
	observer = new Sky(false);
	ground = new Ground();

	initOthersPlot();
	skylineSet = new PlotSet(skyline, true);
	obslineSet = new PlotSet(obsline, false);
	compassSet = new PlotSet(compass, false);
//	labelSet = new PlotSet(label, true);

	starSet.checkEachVisible(5);
	starSet.checkEachNameable(3);
	starSet.nameable = false;

	obslineSet.visible = false;
}

function drawSky() {
	ctx.save();
	ctx.clearRect(0, 0, windowSize.width, windowSize.height);
	ctx.translate(windowSize.halfWidth, windowSize.halfHeight);

	// ===================== control handler ==================
	window.addEventListener("keydown", keyboard.keyControl, true);
//	document.addEventListener("click", mouse.right, false);

	// ==================== animation handler =================
	if(mouse.leftDown) mouse.drag();
	if(mouse.unclick) mouse.releaseHandler();
	if(mouse.dblGoto) mouse.gotoHandler();

	// ===================== skyyy ===========================
	if(!stopMoving) {
		moveIndex = -currentTime();
	}
	ctx.save(); // after clip, anything out there will be unseen (but still calculate)
	ground.plotGround();

	drawingObject = 0;
	starSet.plotSky();

	skylineSet.plotSky();
	obslineSet.plotSky();
//	labelSet.plotSky();
	compassSet.plotSky();

	ctx.restore(); // unclip

	if(true) {// ================ hud ========================

// Math.cos(\\\mouse\\\*Math.PI/windowSize.getRadius())

		ctx.beginPath();
		ctx.arc(0, 0, windowSize.getRadius()/2, 0, 2*Math.PI)
		ctx.stroke();
		ctx.closePath();

		ctx.fillText("mouse = " + sky.stringPosition(mouse.oxy), -500, 20);
		ctx.fillText("origin = " + sky.stringPosition([0, 0]), -500, 40);

		ctx.fillText("mouse = " + observer.stringPosition(mouse.oxy), -500, 70);
		ctx.fillText("origin = " + observer.stringPosition([0, 0]), -500, 90);

			ctx.fillText(mouse.oxy, -500, -50);
//			ctx.fillText(mouse.obsAltz, -500, -35);
			ctx.fillText(mouse.releaseSpeedFunction*1000, -500, -20);
			ctx.fillText(mouse.gotSpeed, -400, -50);
			ctx.fillText(mouse.nowSpeed, -400, -35);
			ctx.fillText(mouse.releaseSpeed, -400, -20);
			
			ctx.fillText(mouse.unclick, 500, -35);
			ctx.fillText(mouse.leftDown, 500, -20);
			ctx.fillText(mouse.dblGoto, 500, -5);
	}
	// ======================= dev zone =======================
//	ctx.fillText(console.scale, 0, 0); // use this to check where to debug
	ctx.fillText(tool.fps(), 525, -300);
//	ctx.fillText(keyboard.arrowDown, 400, -50);
//	ctx.fillText(keyboard.panning, 400, -35);

	ctx.fillText("object draw = " + drawingObject, -575, -280);
	ctx.fillText("draw complete!", -575, -300); // use this to check if canvas has no problems
	ctx.restore();
}

function init() {
//	alert(Math.E) // test somthing here!! (only 1 time alert)
	var canvas = document.getElementById("sky");
	if(canvas.getContext) {
		ctx = canvas.getContext("2d");
		initUtil()
		initConsole();
		initPlot();
		// todo: initRestore() for localStorage that save user's setting.
		setInterval("drawSky();", 15);
	}
}