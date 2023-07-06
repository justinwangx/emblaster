const { MongoClient } = require('mongodb');

module.exports = async (req, res) => {
  const { name, score } = req.body;

  // Input validation
  if (!name || !score) {
    return res.status(400).json({ error: 'Missing name or score' });
  }

  const uri = process.env.MONGODB_URI;
  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

  try {
    await client.connect();

    const database = client.db('leaderboard');
    const collection = database.collection('scoresAndNames');

    const doc = { name, score };
    const result = await collection.insertOne(doc);

    res.status(200).json({ success: true, message: `New leaderboard entry inserted with the following id: ${result.insertedId}` });
  } catch (e) {
    res.status(500).json({ error: 'Error connecting to db', e });
  } finally {
    await client.close();
  }
};

