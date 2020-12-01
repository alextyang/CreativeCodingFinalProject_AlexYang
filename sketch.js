
let video, backgroundFrame;
let currentRound;
let pastRounds;

let roundVectors;
let playbackRatios, frameStarted;

function setup() {
	createCanvas(640, 480);
	pixelDensity(1);
	video = createCapture(VIDEO);
  video.size(width, height);
  video.hide();
	
	roundVectors = [[createVector(500, 0), createVector(620, 130), createVector(0, height)],
									[createVector(400, 460), createVector((BALL_SIZE/2 + 5), 300), createVector(width, 0)],
									[createVector(620, 300), createVector(500, 460), createVector(0, 0)],
									[createVector((BALL_SIZE/2 + 5), 130), createVector(400, 0), createVector(width, height)]];
	
	pastRounds = [];
	currentRound = new Round(roundVectors[pastRounds.length][0], roundVectors[pastRounds.length][1]);
}

function updateBackground() {
	backgroundFrame.copy(video, 0, 0, video.width, video.height, 0, 0, video.width, video.height);
}

function finishRound() {
	pastRounds.push(currentRound);
	currentRound = null;
	
	if (pastRounds.length == 4) {
		startEndAnimation();
	}
	else {
		currentRound = new Round(roundVectors[pastRounds.length][0], roundVectors[pastRounds.length][1]);
	}
}

function mouseDragged() {
	currentRound.ball.p.x = width-mouseX;
	currentRound.ball.p.y = mouseY;
}

function startEndAnimation() {
	
	playbackRatios = [];
	
	for (let i = 0; i < pastRounds.length; i ++) {
		playbackRatios.push(pastRounds[i].savedFrames.length / 200);
	}
	
	frameStarted = frameCount;
}

function draw() {
	if (currentRound != null) {
		currentRound.drawGame();
	}
	else {
		
		background(0);
		
		for (let i = 0; i < pastRounds.length; i ++) {
			
			let index = int((frameCount-frameStarted)*playbackRatios[i]);
			while (index >= pastRounds[i].savedFrames.length) {
				index -= pastRounds[i].savedFrames.length;
			}
			let frame = pastRounds[i].savedFrames[index];
			
			push();
			scale(.5);
			translate(roundVectors[i][2].x, roundVectors[i][2].y);
			
			noStroke();
			fill(200);
			circle(frame.ballX, frame.ballY, BALL_SIZE);

			for (let p = 0; p < frame.particles.length; p++) {
				frame.particles[p].drawMirrored();
			}
			
			pop();
			
		}
		
	}
	
}









class Round {

	constructor(startV, goalV) {
		this.timer = millis();
		this.particles = [];
		this.lastParticleCount = 0;
		
		this.start = startV;
		this.end = goalV;
		
		this.savedFrames = [];
	
		backgroundFrame = createImage(width, height);
	}
	
	drawGame() {
		background(0);
		
		this.drawInfo();
		
		loadPixels();
		video.loadPixels();
		backgroundFrame.loadPixels();
		
		this.findMotion();
		this.connectParticles();
		
		if (this.particles.length > this.lastParticleCount + 30) {
			updateBackground();
		}
		
		this.lastParticleCount = this.particles.length;
		this.updateBall();

		this.particles = [];
		
		if (frameCount % 1 == 0) {
			this.saveFrame();
		}
	}
	
	
	
	drawInfo() {
		
		if (this.timer + 2000 > millis()) {
			textAlign(CENTER, CENTER);
			textSize(100);
			fill(255);
			text(int(map(millis(), this.timer, this.timer+3000, 3, -1))+1, width/2, height/2);
		}
	
		noStroke();
		fill(0, 0, 255);
		if (this.start.x == 0) {
			rect(width - this.start.x, this.start.y - (BALL_SIZE/2 + 5), 20, BALL_SIZE+10);
		}
		else {
			rect(width - this.start.x - (BALL_SIZE/2 + 5), this.start.y, BALL_SIZE+10, 20);
		}
		
		
		fill(100, 100, 0);
		if (this.end.x == 0) {
			rect(width - this.end.x, this.end.y - (BALL_SIZE/2 + 5), 20, BALL_SIZE+10);
		}
		else {
			rect(width - this.end.x - (BALL_SIZE/2 + 5), this.end.y, BALL_SIZE+10, 20);
		}
	
	}
	
	updateBall() {
		if (this.ball != null) {
			this.ball.update(this.particles);
			this.ball.draw();
			
			if (createVector(this.ball.p.x, this.ball.p.y).dist(this.end) < BALL_SIZE) {
				
				if (this.ball.isAlive) {
					setTimeout(finishRound, 1000);		
				}
				
				this.ball.isAlive = false;
				
				textAlign(CENTER, CENTER);
				textSize(100);
				fill(255);
				text('Goal!', width/2, height/2);
			}
		}
		else if (this.timer + 3000 < millis()) {
			this.ball = new Ball(this.start.x, this.start.y);	 
		}
	}
	
	findMotion() {
		for (let x = 0; x < width; x+=10) {
			for (let y = 0; y < height; y+=10) {
				let l = (x + y * width) * 4;
				let diff = dist(backgroundFrame.pixels[l],
											 backgroundFrame.pixels[l+1],
											 backgroundFrame.pixels[l+2],
											 video.pixels[l],
											 video.pixels[l+1],
											 video.pixels[l+2]);
				if (diff > 80) {
						let p = new Particle(x, y, this.particles);
						this.particles.push(p);
				}
			}
		}
	}
	
	connectParticles() {
		this.particles.sort((a, b) => {
			return a.v1.x - b.v1.x;
		});
		
		for (let i = 0; i < this.particles.length; i++) {
			this.particles[i].connect(this.particles.slice(i-20, i+21));
			this.particles[i].draw();
		}
	}
	
	saveFrame() {
		if (this.ball != null && this.ball.isAlive) {
			this.savedFrames.push({
				particles: this.particles, 
				ballX: this.ball.p.x,
				ballY: this.ball.p.y
			});
		}
	}

}





class Particle {
	constructor(x, y) {
		this.v2 = new createVector(x, y);
		this.v1 = new createVector(x, y);
	}
	
	draw() {
		stroke(200);
		strokeWeight(2);
		line(width - this.v1.x, this.v1.y, width - this.v2.x, this.v2.y-1);
	}
	
	drawMirrored() {
		stroke(200);
		strokeWeight(2);
		line(this.v1.x, this.v1.y, this.v2.x, this.v2.y-1);
	}
	
	connect(list) {
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
		this.p = createVector(x, y);
		this.v = createVector(0, 0);
		this.a = createVector(0, .15);
		this.isAlive = true;
	}
	
	update(list) {
		if (this.isAlive) {
			for (let i = 0; i < list.length; i ++) {
				if (dist((list[i].v1.x+list[i].v2.x)/2, (list[i].v1.y+list[i].v2.y)/2, this.p.x, this.p.y) < BALL_SIZE && 
					 dist((list[i].v1.x+list[i].v2.x)/2, (list[i].v1.y+list[i].v2.y)/2, this.p.x, this.p.y) > BALL_SIZE-(BALL_SIZE/2)) {
					let line = list[i].v2.sub(list[i].v1);

					this.v = (createVector(line.y, line.x));
				}
			}

			if (this.p.y >= height-(BALL_SIZE/2)) {
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

			this.v.x -= this.v.x * .01;
			this.v = this.v.add(this.a);
			this.p = this.p.add(this.v);
		}
	}
	
	
	draw() {
		noStroke();
		fill(200);
		circle(width - this.p.x, this.p.y, BALL_SIZE);
	}


}