export const postScore = async (name, score) => {
  // do not abuse :)
  const response = await fetch("/api/postScore", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name, score }),
  });
  
  if (!response.ok) {
    throw new Error("Failed to add score");
  }
};

export const getLeaderboard = async () => {
  const response = await fetch("/api/getLeaderboard");
 
  if (!response.ok) {
    throw new Error("Failed to fetch leaderboard");
  }
  
  const data = await response.json();
  return data;
};
 
export const fetchAndCacheLeaderboard = async () => {
  const leaderboard = await getLeaderboard();
  sessionStorage.setItem("leaderboard", JSON.stringify(leaderboard));
  return leaderboard;
};
