// Electric Wind
// User interacts with a ball minigame as static to assemble a mosaic

let video, backgroundFrame; // Images to compare for motion detection
let currentRound; // minigame Round object
let pastRounds; // saved states
let inIntro, startGame; // whether intro is playing, if key was pressed

let roundVectors; // minigame round configuration
let playbackRatios; // speed to play each save state at
let frameStarted; // frame mosaic started

let BACKGROUNDC, FOREGROUNDC, HIGHLIGHTS; // Color palette

function setup() {
	
	BACKGROUNDC = color("#3D2645");
	FOREGROUNDC = color("#F0EFF4");
	HIGHLIGHTS = [color("#832161"), color("#DA4167"), color("#96C5B0"), color("#ADF1D2")];
	
	createCanvas(640, 480);
	pixelDensity(1);
	video = createCapture(VIDEO);
  video.size(640, 480);
  video.hide();
	
	roundVectors = [[createVector(500, 0), createVector(0, 130), createVector(0, height)],
									[createVector(width, 300), createVector(500, height), createVector(0, 0)],
									[createVector(400, 0), createVector(0, 300), createVector(width, 0)],
									[createVector(width, 130), createVector(400, height), createVector(width, height)]];
	
	pastRounds = [];
	currentRound = new Round(); // Creates an empty Round for the intro background
	inIntro = true;
}



function draw() {
	
	if (inIntro){ // Draws empty game and intro text
		currentRound.drawBackground();
		drawIntroScreen();
	}
	else if (currentRound != null) { // Draws current round
		currentRound.drawGame();
	}
	else { // End
		drawMosaic();
	}
	
	
	
	
	
function updateBackground() { // Resets difference detection
	backgroundFrame.copy(video, 0, 0, video.width, video.height, 0, 0, video.width, video.height);
}

function finishRound() { // Ends current round, saves states, and starts next
	pastRounds.push(currentRound);
	currentRound = null;
	
	if (pastRounds.length == 4) {
		startEndAnimation();
	}
	else {
		currentRound = new Round(roundVectors[pastRounds.length][0], roundVectors[pastRounds.length][1]);
	}
}

function keyPressed() { // For ending intro
	startGame = true;
}

function startEndAnimation() { // Finds playback ratios and starts mosaic
	
	playbackRatios = [];
	
	for (let i = 0; i < pastRounds.length; i ++) {
		playbackRatios.push(pastRounds[i].savedFrames.length / 400);
	}
	
	frameStarted = frameCount;
}
	
	
	
	
	function drawIntroScreen() { // Introduction text
	noStroke();
	fill(FOREGROUNDC);
	textAlign(CENTER, CENTER);
	textSize(26);
	
	if (millis() < 4000) {
		text("You are electric wind.", width/2, height/2);
	}
	else if (millis() < 8000) {
		text("Wave.", width/2, height/2);
	}
	else if (millis() < 13000) {
		text("Let's build a dancing mosaic by tossing the ball.", width/2, height/2);
	}
	else if (millis() < 17000) {
		text("Find a space with room to play.", width/2, height/2);
		startGame = false;
	}
	else if (!startGame) {
		text("Press any key to continue.", width/2, height/2);
	}
	else {
		currentRound = new Round(roundVectors[pastRounds.length][0], roundVectors[pastRounds.length][1]);
		inIntro = false;
	}
}
	
	
	function drawMosaic() { // Draw ending mosaic
		background(BACKGROUNDC);
		
		stroke(color("#1F1323")); // Dividing lines
		strokeWeight(5);
		for (let x = 0; x < 5; x ++){
			line((width/4)*x, 0, (width/4)*x, height);
			line(0, (height/4)*x, width, (height/4)*x);
		}
		
		
		for (let x = 0; x < 2; x ++) {
			for (let y = 0; y < 2; y ++) { // Repeat mosaic
				push();
				scale(.5);
				translate(width*x, height*y);
				
				for (let i = 0; i < pastRounds.length; i ++) {
					let index = int((frameCount-frameStarted)*playbackRatios[i]);
					while (index >= pastRounds[i].savedFrames.length) { // Loop each save state
						index -= pastRounds[i].savedFrames.length;
					}
					let frame = pastRounds[i].savedFrames[index];

					push();
					scale(.5);
					translate(roundVectors[i][2].x, roundVectors[i][2].y); // Place based on configuration

					noStroke();
					fill(BACKGROUNDC);
					if (roundVectors[i][1].x == 0) { // Draw holes over divider lines
						rect(		roundVectors[i][1].x - 15, 
										roundVectors[i][1].y - BALL_SIZE/2 - 10, 
										30, BALL_SIZE + 20);
					}
					else {
						rect(		roundVectors[i][1].x - BALL_SIZE/2 - 10, 
										roundVectors[i][1].y - 15, 
										BALL_SIZE + 20, 30);
					}
					

					for (let p = 0; p < frame.particles.length; p++) { // Draw static
						frame.particles[p].drawMirrored();
					}
					
					noStroke(); // Draw ball
					fill(HIGHLIGHTS[1]);
					circle(frame.ballX, frame.ballY, BALL_SIZE);

					pop();

				}
				
				pop();
			}
		}
	
	}
	
}






class Round { // A stage of the minigame

	constructor(startV, goalV) {
		this.timer = millis(); // when the game started
		this.particles = []; // contains all vectors on screen
		this.lastParticleCount = 0; // last frame's num of vectors
		
		this.start = startV; // pos of ball spawn
		this.end = goalV; // pos of ball goal
		this.arrowPos = 0; // offset of indicators
		this.arrowDir = 1; // direction of indicator animation

		this.savedFrames = []; // array recording state
	
		backgroundFrame = createImage(width, height); // starts difference detection
	}
	
	
	drawBackground() { // For Intro screen, draws just the static
		background(BACKGROUNDC);
		
		loadPixels();
		video.loadPixels();
		backgroundFrame.loadPixels();
		
		this.findMotion();
		this.connectParticles();
		
		if (this.particles.length > this.lastParticleCount + 25) {
			updateBackground();
		}
		
		this.lastParticleCount = this.particles.length;
		this.particles = [];
	}
	
	
	drawGame() {	// Full game drawn
		background(BACKGROUNDC);
		
		this.drawInfo();
		
		loadPixels();
		video.loadPixels();
		backgroundFrame.loadPixels();
		
		this.findMotion();
		this.connectParticles();
		
		if (this.particles.length > this.lastParticleCount + 25) {
			updateBackground();
		}
		
		this.lastParticleCount = this.particles.length;
		this.updateBall();

		this.particles = [];
		
		this.saveFrame();
	}
	
	
	
	drawInfo() { // Draws overlay of indicators and countdown
		
		if (this.timer + 2000 > millis()) { // Countdown
			textAlign(CENTER, CENTER);
			textSize(100);
			fill(FOREGROUNDC);
			text(int(map(millis(), this.timer, this.timer+3000, 3, -1))+1, width/2, height/2);
		}
		
		this.arrowIn(width - this.start.x, this.start.y); 
		this.arrowOut(width - this.end.x, this.end.y);
		
		
		if (this.arrowDir == 1 && this.arrowPos < 10) { // Arrow animation
			this.arrowPos += 1;
		}
		else {
			this.arrowDir = -1;
		}
		
		if (this.arrowDir == -1 && this.arrowPos > -10) {
			this.arrowPos -= 1;
		}
		else {
			this.arrowDir = 1;
		}
	
	}
	
	updateBall() { // updates ball object and checks for goal
		if (this.ball != null) {
			this.ball.update(this.particles);
			this.ball.draw();
			
			if (createVector(this.ball.p.x, this.ball.p.y).dist(this.end) < BALL_SIZE + 15) {
				
				if (this.ball.isAlive) {
					setTimeout(finishRound, 1000);		
				}
				
				this.ball.isAlive = false;
				
				textAlign(CENTER, CENTER);
				textSize(100);
				fill(FOREGROUNDC);
				text('Goal!', width/2, height/2);
			}
		}
		else if (this.timer + 3000 < millis()) { // creates ball if not there
			this.ball = new Ball(this.start.x, this.start.y);	 
		}
	}
	
	findMotion() { // difference detection
		for (let x = 0; x < width; x+=10) {
			for (let y = 0; y < height; y+=10) {
				let l = (x + y * width) * 4;
				if (l+2 < video.pixels.length){
					let diff = dist(backgroundFrame.pixels[l],
											 backgroundFrame.pixels[l+1],
											 backgroundFrame.pixels[l+2],
											 video.pixels[l],
											 video.pixels[l+1],
											 video.pixels[l+2]);
					
					if (diff > 90) {
							let p = new Particle(x, y, this.particles);
							this.particles.push(p);
					}
				}
			}
		}
	}
	
	connectParticles() { // links close changed pixels
		this.particles.sort((a, b) => {
			return a.v1.x - b.v1.x;
		});
		
		for (let i = 0; i < this.particles.length; i++) {
			this.particles[i].connect(this.particles.slice(i-20, i+21));
			this.particles[i].draw();
		}
	}
	
	saveFrame() { // records static and ball for save state
		if (this.ball != null && this.ball.isAlive) {
			this.savedFrames.push({
				particles: this.particles, 
				ballX: this.ball.p.x,
				ballY: this.ball.p.y
			});
		}
	}
	
	
	
	arrowIn(x, y) { // Draws start indicator
		if (y == 0) {
			this.arrow(x, y, x, y + BALL_SIZE);
		}
		else if (y == height) {
			this.arrow(x, y, x, y - BALL_SIZE);
		}
		else if (x == 0) {
			this.arrow(x, y, x + BALL_SIZE, y);
		}
		else if (x == width) {
			this.arrow(x, y, x - BALL_SIZE, y);
		}
	}
	
	arrowOut(x, y) { // Draws goal indicator
		if (y == 0) {
			this.arrow(x, y + BALL_SIZE, x, y);
		}
		else if (y == height) {
			this.arrow(x, y - BALL_SIZE, x, y);
		}
		else if (x == 0) {
			this.arrow(x + BALL_SIZE, y, x, y);
		}
		else if (x == width) {
			this.arrow(x - BALL_SIZE, y, x, y);
		}
	}
	
	arrow(x1, y1, x2, y2) { // Draws indicator from p1 to p2
		noStroke();
		fill(HIGHLIGHTS[3]);
		push();
		
		if (x1 == x2) {
			translate(0, this.arrowPos);
			triangle(x2, y2, x2 + 20, y1, x2 - 20, y1);
		}
		else {
			translate(this.arrowPos, 0);
			triangle(x2, y2, x1, y2 + 20, x1, y2 - 20);
		}
		
		pop();
	}

}




class Particle { // A vector of static
	constructor(x, y) {
		this.v2 = new createVector(x, y);
		this.v1 = new createVector(x, y);
	}
	
	draw() {
		stroke(HIGHLIGHTS[int(random(0, 4))]);
		strokeWeight(2);
		line(width - this.v1.x, this.v1.y, width - this.v2.x, this.v2.y-1);
	}
	
	drawMirrored() { // Draws dot for end mosaic
		stroke(HIGHLIGHTS[int(random(0, 4))]);
		strokeWeight(5);
		line(this.v1.x, this.v1.y, this.v1.x, this.v1.y-1);
	}
	
	connect(list) { // links to the closest other vector
		let shortest = -1, distance = 0, bestDist = 0;
		for (let i = 0; i < list.length; i++) {
			distance = dist(list[i].v1.x, list[i].v1.y, this.v1.x, this.v1.y);
			if (distance < 60 && distance > 0 && (shortest == -1 || distance < bestDist)) {
					shortest = i;
					bestDist = distance;
			}
		}
		
		if (shortest != -1) {
			this.v2 = list[shortest].v1;
		}
	}

}






let BALL_SIZE = 40;

class Ball { 
	constructor(x, y) {
		this.p = createVector(x, y); // position
		this.v = createVector(0, 0); // velocity
		this.a = createVector(0, .15); // acceleration
		this.isAlive = true; // Is frozen/interactable
	}
	
	update(list) {
		if (this.isAlive) {
			for (let i = 0; i < list.length; i ++) { // Checks for particle overlaps
				if (dist((list[i].v1.x+list[i].v2.x)/2, (list[i].v1.y+list[i].v2.y)/2, this.p.x, this.p.y) < BALL_SIZE && 
					 dist((list[i].v1.x+list[i].v2.x)/2, (list[i].v1.y+list[i].v2.y)/2, this.p.x, this.p.y) > BALL_SIZE-(BALL_SIZE/2)) {
					let line = list[i].v2.sub(list[i].v1);

					this.v = (createVector(line.y, line.x));
				}
			}

			if (this.p.y >= height-(BALL_SIZE/2)) { // Bounces off walls
				this.v = (createVector(0, -5));
			}
			else if (this.p.y <= (BALL_SIZE/2)) {
				this.v = (createVector(0, 5));
			}
			else if (this.p.x >= width-(BALL_SIZE/2)) {
				this.v = (createVector(-10, 0));
			}
			else if (this.p.x <= (BALL_SIZE/2)) {
				this.v = (createVector(10, 0));
			}

			this.v.x -= this.v.x * 0.01; // Decays velocity 
			this.v = this.v.add(this.a); // updates physics
			this.p = this.p.add(this.v);
		}
	}
	
	
	draw() {
		noStroke();
		fill(HIGHLIGHTS[1]);
		circle(width - this.p.x, this.p.y, BALL_SIZE);
	}


}