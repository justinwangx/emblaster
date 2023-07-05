const { MongoClient } = require('mongodb');
// require('dotenv').config();

module.exports = async (req, res) => {
    let client;
    try {
        client = await MongoClient.connect(process.env.MONGODB_URI, { useUnifiedTopology: true });
    } catch (err) {
        res.status(500).json({ error: "Failed to connect to the database" });
        console.error(err);
        return;
    }

    const db = client.db('leaderboard');  
    const collection = db.collection('scoresAndNames'); 

    // Fetch the top 10 scores
    let leaderboard;
    try {
        leaderboard = await collection.find().sort({ score: -1 }).limit(10).toArray();
    } catch (err) {
        res.status(500).json({ error: "Failed to retrieve the leaderboard from the database" });
        console.error(err);
        return;
    } finally {
        // Always close the connection to the MongoDB cluster, regardless of whether the request was successful
        try {
            await client.close();
        } catch (err) {
            console.error("Failed to close the database connection", err);
        }
    }

    // Check the result
    if (!leaderboard) {
        res.status(404).json({ error: "Leaderboard not found" });
        return;
    }

    // Send the top 10 scores as the response
    res.status(200).json(leaderboard);
};
