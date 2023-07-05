import { fetchAndCacheLeaderboard } from './helpers.js';

const leaderboardList = document.getElementById("leaderboard-list");

const updateLeaderboard = (data) => {
  // Remove all existing list items
  while (leaderboardList.firstChild) {
    leaderboardList.firstChild.remove();
  }
  // Add each leaderboard entry to the list
  data.forEach((entry) => {
    const listItem = document.createElement("li");

    const leftDiv = document.createElement("div");
    leftDiv.textContent = `${entry.name}`;
    leftDiv.className = "left";

    const rightDiv = document.createElement("div");
    rightDiv.textContent = `${entry.score}`;
    rightDiv.className = "right";

    listItem.appendChild(leftDiv);
    listItem.appendChild(rightDiv);

    leaderboardList.appendChild(listItem);
  });
};

const loading = document.createElement("div");
loading.textContent = "loading...";
loading.className = "loading";
leaderboardList.append(loading);

window.onload = function () {
  let leaderboardData = sessionStorage.getItem("leaderboardData");
  if (leaderboardData) {
    // Parse data and update leaderboard
    leaderboardData = JSON.parse(leaderboardData);
    loading.remove();
    updateLeaderboard(leaderboardData);
  } else {
    fetchAndCacheLeaderboard()
      .then((data) => {
        loading.remove();
        leaderboardData = data;
        updateLeaderboard(leaderboardData);
      })
      .catch((error) => console.error("Error:", error));
  }
};
