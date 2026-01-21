// A simulator for our D&D Campaign
// The story: 22 gods share 13 Relics that can be used to kill one another
// Gods have enemies that they hate but alliances that protect them
// Using a Relic to kill a god destroys it
// Relics are ordered based on power, and there are no duplicates
// A Relic can be used to defend against the use of a Relic as long as the attacking Relic is weaker. This destroys the attacking Relic
// If the attacking Relic is stronger, the defending Relic breaks and the attacking Relic can be used again
// Multiple weak Relics can be used together to combat a stronger Relic, but it is unknown how many of what power is needed
// There is also a base Relic that has no power on its own, but might be necessary to combine Relics
// Gods can also be rendered inactive by being shattered or imprisoned, but it is unclear who or what has the power to do that. With the help of mortals, it appears that they can reform over time
// It will be assumed that an inactive god cannot attack other gods, but can defend themselves. If a god is made inactive, however, there is no reason not to confiscate their Relics
// Gods can be born due to unclear circumstances. There is evidence that being born can somehow result in claiming a Relic
// Relics can be lost (no owner), making their reappearance dependent on mortal intervention or chance
// Gods can Betray one another, meaning that they either kill and ally, don't help defend them, or don't retaliate upon their death

// The simulation will occur in Rounds, where each god can make one action (attack another god, be born, or potentially find a Relic)
// After each round, there is a resolution round where attacked gods can defend themselves (and all of either party's allies have an opportunity to step in)

class Relic {
  constructor(name, power) {
    this.name = name;
    this.power = power;
    this.owner = null;  // this is a name
    this.destroyed = false;
  }
}

class God {
  constructor(name) {
    this.name = name;
    this.alive = true;
    this.active = true;
    this.relics = [];  // this is names
    this.allies = [];  // this is names
    this.enemies = [];  // this is names
    this.graphicNode = null;
  }
}

let gods = [];
let relics = [];

let graphicNodes = [];
let infoBoxes = [];

let canvas;
let selectedGraphicNode = null;
let draggingSelected = false;
let highlightedInfoBox = null;

function getGodByName(godName) {
  // Get the god object based on its name
  for (let g = 0; g < gods.length; g++) {
    if (gods[g].name == godName) {
      return gods[g];
    }
  }
  console.log("Error: couldn't find the god " + godName);
}

function getRelicByName(relicName) {
  // Get the relic object based on its name
  for (let r = 0; r < relics.length; r++) {
    if (relics[r].name == relicName) {
      return relics[r];
    }
  }
  console.log("Error: couldn't find the relic " + relicName);
}

function makeOneSidedAllyByName(subjectGodName, objectGodName) {
  // Make the god by the name of subjectGodName consider the god by the name of objectGodName to be an ally
  for (let g = 0; g < gods.length; g++) {
    if (gods[g].name == subjectGodName) {
      gods[g].allies.push(objectGodName);
      return;
    }
  }
  console.log("Error: couldn't find the god " + subjectGodName);
}

function makeMutualAlliesByName(godNames) {
  // Make all of the gods listed in godNames mutually allies (all will defend one another)
  let foundGods = [];
  for (let g = 0; g < godNames.length; g++) {
    foundGods.push(false);
  }
  for (let g = 0; g < gods.length; g++) {
    for (let gn = 0; gn < godNames.length; gn++) {
      if (godNames.includes(gods[g].name)) {  // if this is one of the gods in the alliance
        foundGods[gn] = true;
        if (gods[g].name != godNames[gn] && !gods[g].allies.includes(godNames[gn])) {
          gods[g].allies.push(godNames[gn]);
        }
      }
    }
  }
  if (foundGods.includes(false)) {
    console.log("Error: unable to find god " + godNames[foundGods.findIndex((elem)=>elem==false)]);
  }
}

function makeOneSidedEnemyByName(subjectGodName, objectGodName) {
  // Make the god by the name of subjectGodName consider the god by the name of objectGodName to be an ally
  for (let g = 0; g < gods.length; g++) {
    if (gods[g].name == subjectGodName) {
      gods[g].enemies.push(objectGodName);
      return;
    }
  }
  console.log("Error: couldn't find the god " + subjectGodName);
}

function makeMutualEnemiesByName(godNames) {
  // Make all of the gods listed in godNames mutually enemies (all hate one another)
  let foundGods = [];
  for (let g = 0; g < godNames.length; g++) {
    foundGods.push(false);
  }
  for (let g = 0; g < gods.length; g++) {
    for (let gn = 0; gn < godNames.length; gn++) {
      if (godNames.includes(gods[g].name)) {  // if this is one of the gods in the alliance
        foundGods[gn] = true;
        if (gods[g].name != godNames[gn] && !gods[g].enemies.includes(godNames[gn])) {
          gods[g].enemies.push(godNames[gn]);
        }
      }
    }
  }
  if (foundGods.includes(false)) {
    console.log("Error: unable to find god " + godNames[foundGods.findIndex((elem)=>elem==false)]);
  }
}

function giveRelicByName(godName, relicName) {
  // Give the god with the name godName the relic with the name relicName
  // Forcefully removes the relic from any other gods
  let foundRelic = false;
  for (let r = 0; r < relics.length; r++) {
    if (relics[r].name == relicName) {
      relics[r].owner = godName;
      foundRelic = true;
    }
  }
  if (!foundRelic) {
    console.log("Error: couldn't find the relic " + relicName);
  }
  let foundGod = false;
  for (let g = 0; g < gods.length; g++) {
    if (gods[g].relics.includes(relicName)) {
      gods[g].relics.splice(gods[g].findIndex((elem)=>elem==relicName), 1);
    }
    if (gods[g].name == godName) {
      gods[g].relics.push(relicName);
      foundGod = true;
    }
  }
  if (!foundGod) {
    console.log("Error: couldn't find the god " + godName);
  }
}

function destroyRelicByName(relicName) {
  for (let g = 0; g < gods.length; g++) {
    if (gods[g].relics.includes(relicName)) {
      gods[g].relics.splice(gods[g].relics.find((elem)=>elem==relicName), 1);
    }
  }
  for (let r = 0; r < relics.length; r++) {
    if (relics[r].name == relicName) {
      relics[r].destroyed = true;
      return;
    }
  }
  console.log("Error: unable to find relic " + relicName);
}

function loseRelicByName(relicName) {
  for (let r = 0; r < relics.length; r++) {
    if (relics[r].name == relicName) {
      relics[r].owner = null;
      return;
    }
  }
  console.log("Error: unable to find relic " + relicName);
}

function neutralKillGodByName(godName) {
  // Kill a god based on its name
  // If the god has a relic, make it lost
  for (let g = 0; g < gods.length; g++) {
    if (gods[g].name == godName) {
      gods[g].alive = false;
      if (gods[g].relics.length != 0) {
        for (let r = 0; r < gods[g].relics.length; r++) {
          gods[g].relics[r].owner = null;
        }
      }
      return;
    }
  }
  console.log("Error: unable to find god " + godName);
}

function inactivateGodByName(godName) {
  // Make the god by the name of godName inactive
  for (let g = 0; g < gods.length; g++) {
    if (gods[g].name == godName) {
      gods[g].active = false;
      return;
    }
  }
  console.log("Error: couldn't find the god " + godName);
}

function activateGodByName(godName) {
  // Make the god by the name of godName active
  for (let g = 0; g < gods.length; g++) {
    if (gods[g].name == godName) {
      gods[g].active = true;
      return;
    }
  }
  console.log("Error: couldn't find the god " + godName);
}

function formatRelic(relicName) {
  let relicObject = getRelicByName(relicName);
  return relicObject.name + " (" + relicObject.power + (relicObject.destroyed ? ", destroyed" : "") + ")";
}

let font;

function preload() {
  font = loadFont('OpenSans-Regular.ttf');
}

function setup() {
  // Setup
  allyColor = color(0,230,0);
  enemyColor = color(230,0,0);
  allyEnemyColor = color(220,120,0);
  enemyAllyColor = color(240,240,0);
  
  infoBoxes.push(new InfoBox(10, 10, 200, 20, "Ally", "I like this person", allyColor));
  infoBoxes.push(new InfoBox(10, 30, 200, 20, "Enemy", "I hate this person", enemyColor));
  infoBoxes.push(new InfoBox(10, 50, 200, 20, "Hostile (Enemy of ally)", "I might be called to attack this person", allyEnemyColor));
  infoBoxes.push(new InfoBox(10, 70, 200, 20, "Wary (Ally of enemy)", "I think this person might attack me", enemyAllyColor));
  
  // Create all of our known gods
  gods.push(new God("Verniat"));
  gods.push(new God("Weivius"));
  
  gods.push(new God("Quovernim"));
  gods.push(new God("Dimyr"));
  gods.push(new God("Jerien"));
  gods.push(new God("Barakza"));
  
  gods.push(new God("Narin"));
  gods.push(new God("Parvikio"));
  gods.push(new God("Gindrad"));
  gods.push(new God("Xathos"));
  gods.push(new God("Mikanar"));
  
  gods.push(new God("Rhundia"));
  gods.push(new God("Kanero"));
  gods.push(new God("Orlanon"));
  
  gods.push(new God("Urkao"));
  gods.push(new God("Yvasia"));
  gods.push(new God("Anek"));
  gods.push(new God("Yvasia's Kid?"));
  
  gods.push(new God("Ternia"));
  gods.push(new God("Imetia"));
  gods.push(new God("The Party"));
  gods.push(new God("Moon Children"));
  gods.push(new God("Chavonna"));
  
  gods.push(new God("Linille"));
  gods.push(new God("Ekh"));
  
  // Create all of our known Relics
  relics.push(new Relic("Rotten Staff", 1));
  relics.push(new Relic("Ashen Shield", 2));
  relics.push(new Relic("Hollow Scarf", 3));
  relics.push(new Relic("Dormant Spear", 4));
  relics.push(new Relic("Wayward Scroll", 5));
  relics.push(new Relic("Vile Sword", 6));
  relics.push(new Relic("Crippled Scythe", 7));
  relics.push(new Relic("Putrid Sash", 8));
  relics.push(new Relic("Manic Stone", 9));
  relics.push(new Relic("Ghastly Sling", 10));
  relics.push(new Relic("Tainted Sphere", 11));
  relics.push(new Relic("Fractured Shard", 12));
  relics.push(new Relic("Empty Seal", 13));
  relics.push(new Relic("Broken Crown", -1));
  
  // Set the stage according to how we know it
  neutralKillGodByName("Parvikio");
  neutralKillGodByName("Xathos");
  neutralKillGodByName("Yvasia's Kid?");
  
  inactivateGodByName("Linille");
  
  makeOneSidedEnemyByName("Ekh", "Urkao");
  makeOneSidedEnemyByName("Jerien", "Xathos");
  makeOneSidedEnemyByName("The Party", "Yvasia");
  makeOneSidedEnemyByName("Linille", "Yvasia's Kid?");
  
  makeOneSidedAllyByName("Chavonna", "The Party");
  makeOneSidedAllyByName("The Party", "Linille");
  makeOneSidedAllyByName("The Party", "Moon Children");
  makeOneSidedAllyByName("The Party", "Anek");
  
  //makeMutualEnemiesByName(["Yvasia", "Linille"]);
  makeMutualEnemiesByName(["Dimyr", "Mikanar"]);
  makeMutualEnemiesByName(["Barakza", "Narin"]);
  
  makeMutualAlliesByName(["Dimyr", "Barakza", "Quovernim", "Jerien"]);
  makeMutualAlliesByName(["Gindrad", "Mikanar", "Parvikio", "Xathos", "Narin"]);
  makeMutualAlliesByName(["Yvasia", "Anek"]);
  makeMutualAlliesByName(["Linille", "Ekh"]);
  makeMutualAlliesByName(["Ternia", "Imetia"]);
  makeMutualAlliesByName(["The Party", "Imetia", "Ternia"]);
  makeMutualAlliesByName(["Verniat", "Weivius"]);
  makeMutualAlliesByName(["Yvasia", "Yvasia's Kid?"]);
  
  destroyRelicByName("Tainted Sphere");
  destroyRelicByName("Putrid Sash");
  destroyRelicByName("Fractured Shard");
  
  giveRelicByName("Yvasia", "Rotten Staff");
  giveRelicByName("Jerien", "Ashen Shield");
  giveRelicByName("Mikanar", "Hollow Scarf");
  giveRelicByName("Dimyr", "Dormant Spear");
  giveRelicByName("Verniat", "Vile Sword");
  giveRelicByName("Imetia", "Manic Stone");
  giveRelicByName("Narin", "Empty Seal");
  giveRelicByName("Chavonna", "Broken Crown");
  
  print(gods);
  
  canvas = createCanvas(800,800);
  canvas.parent("htmlcanvas");
  
  generateGraphicNodes();
}

function draw() {
  background(255,255,255);
  stepGraphicNodes();
  highlightInfoBoxes();
  drawGraphicNodes();
  drawInfoBox();
}

function mousePressed() {
  // See if the mouse is in the area of any graphicNodes
  selectGraphicNode();
  draggingSelected = true;
}

function mouseReleased() {
  draggingSelected = false;
}

function mouseDragged() {
  if (selectedGraphicNode != null && draggingSelected) {
    selectedGraphicNode.x = mouseX;
    selectedGraphicNode.y = mouseY;
  }
}
