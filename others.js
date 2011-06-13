var skyline = [];
var obsline = [];
var compass = [];
var label = [];

//var line = [];
//for(i = 0; i < 88; i++) {
//	line[i] = [];
//}

function initOthersPlot() {
// ==================== Draw Poor Sky Line ========================
	for(j = 0; j < 48 ;j++) {
		for(i = 2; i <= 34; i++) {
//			if(j%2 != 0 && (i == 34 || i == 2)) continue
//			if(j%2 != 0 && (i == 32 || i == 4)) continue
//			if(i == 33 || i == 3) continue
			k = 36*j + i;
			lnSymb = "";
			if(i == 18) lnSymb = "-- " + j/2 + " --"; // higlight celestial equator
			skyline[k] = new Star(lnSymb, j/2, 90 - 5*i, -10, "#005500");
		}
	}
// ============== Draw Poor Observer Line ========================
	for(j = 0; j <= 47 ;j++) {
		for(i = 1; i <= 35; i++) {
			if(j%2 != 0 && i == 1 || i == 2) continue
			k = 36*j + i;
			lnSymb = "^";
			obsline[k] = new Star(lnSymb, j/2, -90 + 5*i, -10, "#005500");
		}
	}
// ======================= compass ========================
	compassName = ["S", "SE", "E", "NE", "N", "NW", "W", "SW"]
	for(i = 0; i < 8; i++) {
		compass[i] = new Star(compassName[i], 3*i, 0.00000000001, -10, "#ffff00");
	}
	compass[8] = new Star("Z", 0, 90, -10, "#ffff00");
// ======================= Orion ============================
	label[0] = new Star("Betelgeuse", 5.919525, 7.407027777777775, -10);
	label[1] = new Star("Rigel", 5.242297777777778, -8.364166666666666, -10);
	label[2] = new Star("Bellatrix", 5.4188527777777775, 6.349722222222222, -10);
	label[3] = new Star("Mintaka", 5.533444444444444, -0.299166666666664, -10);
	label[4] = new Star("Alnilam", 5.603555555555555, -1.201916666666667, -10);
	label[5] = new Star("Anitak", 5.679305555555556, -1.942777777777777, -10);
	label[6] = new Star("Saiph", 5.795944444444444, -9.669722222222223, -10);
	label[7] = new Star("Meissa", 5.585633333333333, 9.934155555555556, -10);
// ===================== Usar Minor =========================
	label[8] = new Star("Polaris", 2.5297444444444444, 89.26413888888889, -10);
	label[9] = new Star("Kochab", 14.845111111111111, 74.15547222222222, -10);
	label[10] = new Star("Pherkad", 15.345486111111111, 71.83397222222223, -10);
	label[11] = new Star("Yildun", 17.536916666666666, 86.58633333333333, -10);
	label[12] = new Star("Urodelus", 16.766155555555557, 82.03725, -10);
	label[13] = new Star("Alifa al Farkadain", 15.734294444444444, 77.7945, -10);
	label[14] = new Star("Anwar al Farkadain", 16.291805555555555, 75.75469444444444, -10);
// ================ test line ========================
//	line[0][0] = new Line(1852, [1,2,3]);
//	line[0][1] = new Line(1713, [0]);
//	line[0][2] = new Line(2061, [0]);
//	line[0][3] = new Line(1790, [0]);
//	line[0][4] = new Line(2004, [5]);
//	line[0][5] = new Line(1903, [4, 8]);
//	line[0][8] = new Line(1948, [5]);
}