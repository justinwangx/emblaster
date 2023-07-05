
import { fetchAndCacheLeaderboard, postScore } from "./helpers.js";

const tliatiUpdate = (score) => score + Math.floor(Math.random() * 10 + 1);
const malUpdate = (score) => score + Math.floor(Math.random() * 70 + 1);
const hiiUpdate = (score) =>
  Math.random() > 0.5 ? score + 1 : score - Math.floor(Math.random() * 30);

const levels = [
  {
    number: 1,
    poem: "that-love-is-all-there-is.json",
    spawnRate: 3000,
    fallSpeedMultiplier: 1,
    scoreUpdate: tliatiUpdate,
  },
  {
    number: 2,
    poem: "meditation-at-lagunitas.json",
    spawnRate: 2500,
    fallSpeedMultiplier: 1,
    scoreUpdate: malUpdate,
  },
  {
    number: 3,
    poem: "howl-ii.json",
    spawnRate: 2000,
    fallSpeedMultiplier: 1.2,
    scoreUpdate: hiiUpdate,
  },
];

let score = 0;
let scoreToBeat = 1000;
let gameOver = false;
let leaderboardUpdated = false;
let poem = [];
let currentWordIndex = 0;
let currentGunAngle = 0;
let bullets = [];
let gameOverColor = "#800000";
let wordSpawnTimeout;
let levelConfig;

const baseBulletVelocity = 2;
const baseBulletMoveRate = 5;
const baseWordPixelMove = 0.25;
const baseWordMoveRate = 5;

const game = document.getElementById("game");
const words = document.querySelector(".words");
const gun = document.getElementById("gun");
const scoreElement = document.getElementById("score");
const levelElement = document.getElementById("level-number");
const dangerLine = document.querySelector(".danger-line");
const gameOverElement = document.getElementById("game-over");
const leaderboardLink = document.getElementById("leaderboard-link");

let gunLeft = parseInt(window.getComputedStyle(gun).getPropertyValue("left"));
let gunBottom = parseInt(
  window.getComputedStyle(gun).getPropertyValue("bottom")
);

function delay(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

function gameOverSequence() {
  async function updateLeaderboard(name) {
    // update database
    await postScore(name, score).catch((error) =>
      console.error("Error:", error)
    );
    // update sessionStorage
    await fetchAndCacheLeaderboard().catch((error) =>
      console.error("Error:", error)
    );
    console.log("leaderboard updated")
  }
  gameOverElement.style.color = gameOverColor;
  dangerLine.style.opacity = "0%";
  document.removeEventListener("click", shootBullet);

  if (score > scoreToBeat && !leaderboardUpdated) {
    const modal = document.getElementById("name-input-modal");
    modal.style.display = "block";

    const nameInput = document.getElementById("name-input");

    nameInput.addEventListener("input", () => {
      nameInput.value = nameInput.value
        .replace(/[^a-zA-Z]/g, "")
        .substring(0, 10);
    });

    // Handle the keypress event to submit the name when Enter is pressed
    nameInput.addEventListener("keypress", (event) => {
      if (event.key === "Enter") {
        // Disable leaderboard link until leaderboard is updated
        leaderboardLink.style.pointerEvents = "none";
        let name = nameInput.value;
        updateLeaderboard(name)
          .then(() => {
            leaderboardLink.style.pointerEvents = "auto";
          })
          .catch((error) => console.log(error));
        leaderboardUpdated = true;
        modal.style.display = "none";
        nameInput.value = "";
      }
    });
  }

  return;
}

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
  let shotSound = new Audio("../assets/shot.mp3");
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

function checkWordsOnScreen() {
  let wordsOnScreen = document.getElementsByClassName("falling-word");
  return wordsOnScreen.length == 0;
}

function spawnWord(resolve) {
  // Check for end of game
  if (currentWordIndex >= poem.length) {
    console.log("End of poem reached");
    let checkInterval = setInterval(() => {
      if (checkWordsOnScreen()) {
        console.log("All words cleared from screen");
        clearInterval(checkInterval);
        resolve();
      }
    }, 1000); // checks every second if all words are cleared
    return;
  }

  // Adjustments for Moloch level
  if (levelConfig.number == 3) {
    if (currentWordIndex > poem.length - 15) {
      document.removeEventListener("click", shootBullet);
    } else if (currentWordIndex > poem.length / 2) {
      levelConfig.spawnRate = 1500;
      levelConfig.fallSpeedMultiplier = 2;
    } else if (currentWordIndex > poem.length / 3) {
      levelConfig.spawnRate = 1000;
      levelConfig.fallSpeedMultiplier = 1.5;
    } else if (currentWordIndex > 10) {
      levelConfig.spawnRate = 1750;
      levelConfig.fallSpeedMultiplier = 1.3;
    }
  }

  let word = document.createElement("div");
  word.textContent = poem[currentWordIndex++];
  word.setAttribute("class", "falling-word");
  words.appendChild(word);
  word.style.bottom = game.offsetHeight + "px";
  word.style.left = Math.floor(Math.random() * (game.offsetWidth - 10)) + "px";

  startWordFall(word, resolve);
  wordSpawnTimeout = setTimeout(
    () => spawnWord(resolve),
    levelConfig.spawnRate
  ); 
}

function startWordFall(word, resolve) {
  let wordBottom = parseFloat(word.style.bottom);

  function fallDownWord() {
    if (wordBottom <= gunBottom - 10) {
      word.style.color = gameOverColor;
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

        // Update score
        score = levelConfig.scoreUpdate(score);
        scoreElement.textContent = `Score: ${score}`;
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

function startLevel(levelConfig) {
  return new Promise((resolve, reject) => {
    fetch("poems/" + levelConfig.poem)
      .then((response) => response.json())
      .then((words) => {
        poem = words;
        currentWordIndex = 0;
        // Start the first word falling
        spawnWord(resolve);
      })
      .catch((error) => reject(error));
  });
}

async function runGame() {
  document.addEventListener("click", shootBullet);
  document.addEventListener("mousemove", rotateGun);

  let leaderboardData = sessionStorage.getItem("leaderboardData");
  if (!leaderboardData) {
    try {
      leaderboardData = await fetchAndCacheLeaderboard();
    } catch (error) {
      console.error("Error:", error);
    }
  }
  scoreToBeat = leaderboardData[leaderboardData.length - 1].score;

  for (let cfg of levels) {
    levelConfig = cfg;
    levelElement.textContent = `Level ${levelConfig.number} of ${levels.length}`;
    await startLevel(levelConfig);
    await delay(4000);
  }
}

runGame();
