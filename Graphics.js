// Actually defined in setup()
let allyColor;
let enemyColor;
let allyEnemyColor;
let enemyAllyColor;

class GraphicNode {
  constructor(x, y, god) {
    this.x = x;
    this.y = y;
    this.width = 100;  // default values
    this.height = 100;
    this.god = god;
    this.stepForce = [0,0];
  }
}

class InfoBox {
  constructor(x, y, w, h, content, hint, fill) {
    this.x = x;
    this.y = y;
    this.width = w;
    this.height = h;
    this.content = content;
    this.hint = hint;
    this.fill = fill;
  }
}

function generateGraphicNodes() {
  // Populate the list of GraphicCircles and space them out
  for (let g = 0; g < gods.length; g++) {
    gods[g].graphicNode = new GraphicNode(Math.random() * width/4 + 3*width/8, Math.random() * height/4 + 3*height/8, gods[g]);
    push();
    textFont(font);
    textAlign(CENTER, CENTER);
    textSize(12);
    let bbox = font.textBounds(gods[g].name, gods[g].graphicNode.x, gods[g].graphicNode.y-2);
    pop();
    gods[g].graphicNode.width = 1.5 * textWidth(gods[g].name);//bbox.w;
    gods[g].graphicNode.height = 2 * 12;//bbox.h;
    graphicNodes.push(gods[g].graphicNode);
  }
}

function stepGraphicNodes() {
  // Run one step of a node-drawing algorithm to improve the graph's appearance
  // Every node is connected by a logarithmic spring
  // Every node is repulsed by quadratic forces
  // https://cs.brown.edu/people/rtamassi/gdhandbook/chapters/force-directed.pdf
  if (deltaTime/1000 < 0.1) {
    if ((millis() / 1000) < 3) {
      for (let n = 0; n < graphicNodes.length; n++) {
        //let leadTheta = 2 * PI * (millis() / 1000) / 3;
        let leadTheta = 2 * PI - exp(log(2 * PI) - 2 * PI * (millis()/1000) / 2);
        let leadRad = 200 * (1 - exp(log(1) - millis()/1000));
        graphicNodes[n].x = leadRad * cos(leadTheta - (2 * PI / graphicNodes.length) * n) + width/2;
        graphicNodes[n].y = leadRad * sin(leadTheta - (2 * PI / graphicNodes.length) * n) + height/2;
      }
    } else {
      let c1 = 3;  // attractive scaling
      let c2 = 55;  // repulsive log scaling
      let c3 = 5;  // repulsive scaling
      let c4 = 5;  // general scaling
      for (let g1 = 0; g1 < graphicNodes.length-1; g1++) {
        for (let g2 = g1+1; g2 < graphicNodes.length; g2++) {
          // Calculate the distance between nodes
          let d = sqrt(sq(graphicNodes[g2].x - graphicNodes[g1].x) + sq(graphicNodes[g2].y - graphicNodes[g1].y));
          // Calculate the attractive and repulsive forces and add to both nodes' force
          let attractive = c1 * log(d / c2);
          if (graphicNodes[g1].god.allies.includes(graphicNodes[g2].god.name) || graphicNodes[g2].god.allies.includes(graphicNodes[g1].god.name)) {
            attractive = attractive * 1.5;
          }
          let repulsive = c3 / d*d;
          if (graphicNodes[g1].god.enemies.includes(graphicNodes[g2].god.name) || graphicNodes[g2].god.enemies.includes(graphicNodes[g1].god.name)) {
            repulsive = repulsive * 1.5;
          }
          // Calculate the unit vector of this direction, from g1 to g2
          let vec = [(graphicNodes[g2].x - graphicNodes[g1].x) / d, (graphicNodes[g2].y - graphicNodes[g1].y) / d];
          graphicNodes[g1].stepForce[0] += vec[0] * (attractive - repulsive);
          graphicNodes[g1].stepForce[1] += vec[1] * (attractive - repulsive);
          graphicNodes[g2].stepForce[0] += -vec[0] * (attractive - repulsive);
          graphicNodes[g2].stepForce[1] += -vec[1] * (attractive - repulsive);
        }
      }
      for (let g = 0; g < graphicNodes.length; g++) {
        if (selectedGraphicNode == null || (graphicNodes[g].god.name != selectedGraphicNode.god.name)) {
          graphicNodes[g].x += deltaTime/1000 * c4 * graphicNodes[g].stepForce[0];
          graphicNodes[g].y += deltaTime/1000 * c4 * graphicNodes[g].stepForce[1];
        }
        graphicNodes[g].stepForce = [0,0];
      }
    }
  }
}

function drawArrow(base, vec, myColor, weight) {
  // Stolen from https://editor.p5js.org/mahdadbor/sketches/evyWdjCSH
  push();
  stroke(myColor);
  strokeWeight(weight);
  fill(myColor);
  translate(base.x, base.y);
  line(0, 0, vec.x, vec.y);
  rotate(vec.heading());
  let arrowSize = 7;
  translate(vec.mag() - arrowSize-3, 0);
  triangle(0, arrowSize / 2, 0, -arrowSize / 2, arrowSize, 0);
  pop();
}

function pointOnEllipse(angle, a, b) {
  // Angle is angle from due right (+x)
  // a is semimajor radius
  // b is semiminor radius
  // Returns the point relative to the center of the ellipse
  // Returns a p5 Vector object
  // Stolen from https://math.stackexchange.com/questions/22064/calculating-a-point-that-lies-on-an-ellipse-given-an-angle
  let x = ((angle > -PI/2 && angle < PI/2) ? 1 : -1) * (a*b) / sqrt(sq(b) + sq(a) * sq(tan(angle)));
  return createVector(x, x * tan(angle));
}

function drawGraphicNodes() {
  // Draw all of our graphic nodes
  for (let n = 0; n < graphicNodes.length; n++) {
    let posVec = createVector(graphicNodes[n].x, graphicNodes[n].y);
    
    for (let a = 0; a < graphicNodes[n].god.allies.length; a++) {
      let allyGod = getGodByName(graphicNodes[n].god.allies[a]);
      let allyGodVec = createVector(allyGod.graphicNode.x, allyGod.graphicNode.y);
      allyGodVec.add(pointOnEllipse(p5.Vector.sub(posVec,allyGodVec).heading(), allyGod.graphicNode.width/2, allyGod.graphicNode.height/2));
      drawArrow(posVec, p5.Vector.sub(allyGodVec, posVec), allyColor, 4);
      // Draw that ally's enemies as potential enemies
      for (let ae = 0; ae < allyGod.enemies.length; ae++) {
        let allyEnemyGod = getGodByName(allyGod.enemies[ae]);
        let allyEnemyGodVec = createVector(allyEnemyGod.graphicNode.x, allyEnemyGod.graphicNode.y);
        allyEnemyGodVec.add(pointOnEllipse(p5.Vector.sub(posVec,allyEnemyGodVec).heading(), allyEnemyGod.graphicNode.width/2, allyEnemyGod.graphicNode.height/2));
        drawArrow(posVec, p5.Vector.sub(allyEnemyGodVec, posVec), allyEnemyColor, 2);
      }
    }
    
    for (let e = 0; e < graphicNodes[n].god.enemies.length; e++) {
      let enemyGod = getGodByName(graphicNodes[n].god.enemies[e]);
      let enemyGodVec = createVector(enemyGod.graphicNode.x, enemyGod.graphicNode.y);
      enemyGodVec.add(pointOnEllipse(p5.Vector.sub(posVec,enemyGodVec).heading(), enemyGod.graphicNode.width/2, enemyGod.graphicNode.height/2));
      drawArrow(posVec, p5.Vector.sub(enemyGodVec, posVec), enemyColor, 4);
      // Draw that enemy's allies as potential enemies
      for (let ea = 0; ea < enemyGod.allies.length; ea++) {
        let enemyAllyGod = getGodByName(enemyGod.allies[ea]);
        let enemyAllyGodVec = createVector(enemyAllyGod.graphicNode.x, enemyAllyGod.graphicNode.y);
        enemyAllyGodVec.add(pointOnEllipse(p5.Vector.sub(posVec,enemyAllyGodVec).heading(), enemyAllyGod.graphicNode.width/2, enemyAllyGod.graphicNode.height/2));
        drawArrow(posVec, p5.Vector.sub(enemyAllyGodVec, posVec), enemyAllyColor, 2);
      }
    }
    
  }
  
  for (let n = 0; n < graphicNodes.length; n++) {
    push();
    textFont(font);
    textAlign(CENTER, CENTER);
    textSize(12);
    strokeWeight(1);
    
    stroke(0,0,0);
    fill(255,255,255);
    if (!graphicNodes[n].god.alive) {
      stroke(200,200,200);
      fill(32,32,32);
    }
    if (!graphicNodes[n].god.active) {
      stroke(0,0,0);
      fill(200,200,200);
    }
    ellipseMode(CENTER);
    ellipse(graphicNodes[n].x, graphicNodes[n].y, graphicNodes[n].width, graphicNodes[n].height);
    
    noStroke();
    fill(0,0,0);
    if (!graphicNodes[n].god.alive) {
      fill(200,200,200);
    }
    text(graphicNodes[n].god.name, graphicNodes[n].x, graphicNodes[n].y-2);
    pop();
  }
}

function selectGraphicNode() {
  // See if the mouse is over any of the graphicNodes and, if so, select it
  for (let n = graphicNodes.length-1; n >= 0; n--) {  // this goes backwards to conserve visual order
    let val = sq((mouseX - graphicNodes[n].x) / (graphicNodes[n].width/2)) + sq((mouseY - graphicNodes[n].y) / (graphicNodes[n].height/2));
    if (val <= 1) {
      // Mouse is inside of ellipse
      print("Selected node " + graphicNodes[n].god.name);
      selectedGraphicNode = graphicNodes[n];
      return;
    }
  }
  selectedGraphicNode = null;
}

function drawInfoBox() {
  // Draw relations info boxes
  push();
  stroke(0,0,0);
  rectMode(CORNER);
  textSize(15);
  textAlign(LEFT);
  textFont(font);
  for (let i = 0; i < infoBoxes.length; i++) {
    fill(infoBoxes[i].fill);
    strokeWeight(2);
    stroke(0,0,0);
    rect(infoBoxes[i].x, infoBoxes[i].y, infoBoxes[i].width, infoBoxes[i].height);
    fill(0);
    noStroke();
    text(infoBoxes[i].content, infoBoxes[i].x+20, infoBoxes[i].y+15);
  }
  pop();
  
  // Draw highlighted infoBox
  if (highlightedInfoBox != null) {
    push();
    strokeWeight(2);
    stroke(0,0,0);
    fill(220,220,220,230);
    textSize(16);
    rect(mouseX+5, mouseY, textWidth(highlightedInfoBox.hint)+10, 20);
    noStroke();
    fill(0,0,0);
    textAlign(LEFT,TOP);
    text(highlightedInfoBox.hint, mouseX+10, mouseY+3);
    pop();
  }
  
  // Draw a box that displays info about the selected graphic node
  if (selectedGraphicNode != null) {
    let boxHeight = 60;
    push();
    fill(200,200,200,230);
    rect(width-200, 0, 200, boxHeight*9);
    textSize(15);
    textAlign(LEFT);
    textFont(font);
    noStroke();
    fill(0);
    textSize(24);
    text(selectedGraphicNode.god.name, width-180, 30, 180, 40);
    textSize(14);
    text("Likes: " + selectedGraphicNode.god.allies.join(", "), width-180, 50, 180, boxHeight);
    text("Hates: " + selectedGraphicNode.god.enemies.join(", "), width-180, 50+boxHeight, 180, boxHeight);
    let likedBy = [];
    let hatedBy = [];
    for (let g = 0; g < gods.length; g++) {
      if (gods[g].allies.includes(selectedGraphicNode.god.name)) {
        likedBy.push(gods[g].name);
      }
      if (gods[g].enemies.includes(selectedGraphicNode.god.name)) {
        hatedBy.push(gods[g].name);
      }
    }
    text("Liked by: " + likedBy.join(", "), width-180, 50+boxHeight*2, 180, boxHeight);
    text("Hated by: " + hatedBy.join(", "), width-180, 50+boxHeight*3, 180, boxHeight);
    let thisRelics = selectedGraphicNode.god.relics.map((relicName)=>formatRelic(relicName));
    text("Relics: " + thisRelics.join(", "), width-180, 50+boxHeight*4, 180, boxHeight);
    let allyRelics = likedBy.flatMap((allyName)=>getGodByName(allyName).relics.map((relicName)=>formatRelic(relicName)));
    text("Relics of Allies: " + allyRelics.join(", "), width-180, 50+boxHeight*5, 180, boxHeight);
    let enemyRelics = hatedBy.flatMap((enemyName)=>getGodByName(enemyName).relics.map((relicName)=>formatRelic(relicName)));
    text("Relics of Enemies: " + enemyRelics.join(", "), width-180, 50+boxHeight*6, 180, boxHeight);
    // Relics of allies of enemies needs to track gods who consider *themselves* to be allies with this god
    let enemyAllyRelics = hatedBy.flatMap((enemyName)=>gods.filter((god)=>god.allies.includes(enemyName)).map((god)=>god.name)).flatMap((enemyAllyName)=>getGodByName(enemyAllyName).relics.map((relicName)=>formatRelic(relicName)));
    text("Relics of Allies of Enemies: " + enemyAllyRelics.join(", "), width-180, 50+boxHeight*7, 180, boxHeight);
    pop();
  }
}

function highlightInfoBoxes() {
  // If the mouse is over an InfoBox, highlight it (draw the hint at the mouse when draw is called)
  highlightedInfoBox = null;
  for (let i = 0; i < infoBoxes.length; i++) {
    if (mouseX > infoBoxes[i].x && mouseX < infoBoxes[i].x + infoBoxes[i].width && mouseY > infoBoxes[i].y && mouseY < infoBoxes[i].y + infoBoxes[i].height) {
      highlightedInfoBox = infoBoxes[i];
    }
  }
}
