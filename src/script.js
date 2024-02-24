const levels = [
  {
    number: 1,
    poem: "that-love-is-all-there-is.json",
    spawnRate: 2500,
    fallSpeedMultiplier: 1,
  },
];

// Initial variable settings and DOM elements

let useHandrawn = false;

let gameOver = false;
let poem = [];
let currentWordIndex = 0;
let currentGunAngle = 0;
let lastShotTime = 0;
let bullets = [];
let gameOverColor = "#800000";
let wordSpawnTimeout;
let levelConfig;

const baseBulletVelocity = 1.5;
const baseBulletMoveRate = 3;
const baseWordPixelMove = 0.125;
const baseWordMoveRate = 3;
const shotDelay = 150; // ms

const game = document.getElementById("game");
const words = document.querySelector(".words");
const gun = document.getElementById("gun");
const dangerLine = document.querySelector(".danger-line");
const gameOverElement = document.getElementById("game-over");

let gunBottom = parseInt(
  window.getComputedStyle(gun).getPropertyValue("bottom")
);

// Game functions

function delay(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

// Define end of game behavior

function gameOverSequence() {
  gameOverElement.style.color = gameOverColor;
  dangerLine.style.opacity = "0%";
  document.removeEventListener("click", shootBullet);
  return;
}

// Gun functions

function rotateGun(event) {
  const gunRect = gun.getBoundingClientRect();
  const gunX = gunRect.left + gunRect.width / 2;
  const gunY = gunRect.top + gunRect.height / 2;
  const mouseX = event.clientX;
  const mouseY = event.clientY;

  if (
    !(
      mouseX >= gunRect.left &&
      mouseX <= gunRect.right &&
      mouseY >= gunRect.top &&
      mouseY <= gunRect.bottom
    )
  ) {
    const dx = mouseX - gunX;
    const dy = mouseY - gunY;
    currentGunAngle = Math.atan2(dy, dx);
    if (currentGunAngle < 0) {
      gun.style.transform = `rotate(${currentGunAngle + Math.PI / 2}rad)`;
    }
  }
}

function shootBullet(event) {
  // Return based on shot delay
  const currentTime = Date.now();
  const timeSinceLastShot = currentTime - lastShotTime;
  if (timeSinceLastShot < shotDelay) {
    return;
  }
  lastShotTime = currentTime;

  const bullet = document.createElement("div");
  bullet.classList.add("bullet");
  bullets.push(bullet);

  // Start the bullet at the gun's position.
  const gunRect = gun.getBoundingClientRect();
  const gameRect = game.getBoundingClientRect();
  bullet.style.left = `${gunRect.left - gameRect.left + gunRect.width / 2}px`;
  bullet.style.top = `${gunRect.top - gameRect.top + gunRect.height / 2}px`;

  // Append the bullet to the game.
  game.appendChild(bullet);

  // Create and play the shot sound.
  let shotSound = new Audio("assets/shot.mp3");
  shotSound.play();

  // Calculate the velocity of the bullet based on the gun's angle.
  const velocityX = Math.cos(currentGunAngle) * baseBulletVelocity;
  const velocityY = Math.sin(currentGunAngle) * baseBulletVelocity;

  // Function to move the bullet.
  function moveBullet() {
    const bulletX = parseFloat(bullet.style.left);
    const bulletY = parseFloat(bullet.style.top);

    // Check if the bullet is out of bounds and remove it if it is.
    if (
      bulletX < 0 ||
      bulletY < 0 ||
      bulletX > gameRect.width ||
      bulletY > gameRect.height
    ) {
      bullet.remove();
      clearInterval(moveBulletInterval);
    } else {
      // Move the bullet.
      bullet.style.left = `${bulletX + velocityX}px`;
      bullet.style.top = `${bulletY + velocityY}px`;
    }
  }

  const moveBulletInterval = setInterval(moveBullet, baseBulletMoveRate);
}

// Word functions

function noWordsLeft() {
  let fallingWords = document.getElementsByClassName("falling-word");
  return fallingWords.length == 0;
}

function createWord() {
  let word;

  if (!useHandrawn) {
    word = document.createElement("div");
    word.textContent = poem[currentWordIndex++];
    word.setAttribute("class", "falling-word");
  }
  else {
    word = document.createElement("img");
    word.src = `imgs/${currentWordIndex++}.svg`;
    word.setAttribute("class", "falling-word");
  }

  words.appendChild(word);
  word.style.bottom = game.offsetHeight + "px";
  word.style.left = Math.floor(Math.random() * (game.offsetWidth - 10)) + "px";
  return word;
}

function spawnWord(resolve) {
  console.log("Spawning word")
  // Check for end of level
  if (currentWordIndex >= poem.length) {
    console.log("End of poem reached");
    clearTimeout(wordSpawnTimeout);
    let checkInterval = setInterval(() => {
      if (noWordsLeft()) {
        console.log("Level finished.");
        clearInterval(checkInterval);
        resolve();
      }
    }, 1000); // checks every second if all words are cleared
    return;
  }

  let word = createWord();
  startWordFall(word, resolve);
  wordSpawnTimeout = setTimeout(() => spawnWord(resolve), levelConfig.spawnRate);
}

function startWordFall(word, resolve) {
  let wordBottom = parseFloat(word.style.bottom);

  function fallDownWord() {
    if (wordBottom <= gunBottom - 10) {
      if (!useHandrawn) {
        word.style.color = gameOverColor;
      }
      else {
        word.style.filter = 'sepia(100%) hue-rotate(-50deg) saturate(5000%) brightness(50%)';
      }
      if (!gameOver) {
        gameOverSequence();
      }
      gameOver = true;
      return;
    }

    bullets.forEach((bullet) => {
      const bulletRect = bullet.getBoundingClientRect();
      const wordRect = word.getBoundingClientRect();
      if (
        bulletRect.left < wordRect.right &&
        bulletRect.right > wordRect.left &&
        bulletRect.top < wordRect.bottom &&
        bulletRect.bottom > wordRect.top
      ) {
        // Collision detected, remove the word and the bullet.
        word.remove();
        bullet.remove();

        const bulletIndex = bullets.indexOf(bullet);
        if (bulletIndex > -1) {
          bullets.splice(bulletIndex, 1);
        }

        // Stop moving the current word and spawn the next one.
        clearInterval(wordFallInterval);
        clearTimeout(wordSpawnTimeout);
        spawnWord(resolve);

      }
    });

    // experiment with fall speed and interval
    wordBottom -= baseWordPixelMove * levelConfig.fallSpeedMultiplier;
    word.style.bottom = wordBottom + "px";
  }

  let wordFallInterval = setInterval(
    () => fallDownWord(resolve),
    baseWordMoveRate
  );
}

// Levels + Game

function startLevel(levelConfig) {
  return new Promise((resolve, reject) => {
    fetch("poems/" + levelConfig.poem)
      .then((response) => response.json())
      .then((words) => {
        poem = words;
        currentWordIndex = 0;
        // Start the first word falling - pass resolve so it can be called after level completion
        spawnWord(resolve);
      })
      .catch((error) => reject(error));
  });
}

async function runGame() {
  document.addEventListener("click", shootBullet);
  document.addEventListener("mousemove", rotateGun);
  console.log("Running game");

  // Only run the Dickinson poem
  levelConfig = levels[0];

  // Loop indefinitely until gameOver is true
  while (!gameOver) {
    console.log("Starting level");

    // Reset game state for a new run
    currentWordIndex = 0;
    bullets = [];
    // Clear any words that are still falling
    document.querySelectorAll('.falling-word').forEach(element => element.remove());

    await startLevel(levelConfig).catch((error) => {
      console.error("Failed to start level:", error);
      gameOver = true; // Ensure game over if there's an error
    });

    // Wait a bit before restarting the level (if the game is not over)
    if (!gameOver) {
      await delay(3000);
    }
  }

  console.log("Game Over");
}

runGame();
