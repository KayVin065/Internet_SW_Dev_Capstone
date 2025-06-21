const express = require('express');
const { MongoClient } = require('mongodb');

const connectionString = ''; // secret
const mongo = new MongoClient(connectionString);

const app = express();
app.use(express.json());

let mydb;
let mycoll;

// Rickster's minimal CORS handler
app.use(function(req, res, next){ 
    res.header('Access-Control-Allow-Origin', '*'); 
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,PATCH,DELETE,OPTIONS'); 
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With'); 
    if (req.method === "OPTIONS") return res.sendStatus(200); 
    next();
  }); 

// Connect to MongoDB and start server
async function startServer() {
  try {
    console.log("Connecting to MongoDB...");
    await mongo.connect();
    console.log("Connected!");

    mydb = mongo.db("CapstoneDB");
    mycoll = mydb.collection("Library");

    app.listen(3000, () => {
      console.log("Server running at http://localhost:3000");
    });
  } catch (err) {
    console.error("Failed to connect:", err);
  }
}

startServer();

// GET all books, with optional filtering by availability
app.get('/books', async (req, res) => {
  let getAllFiltered = {};
  if (req.query.avail === 'false') getAllFiltered.avail = false;
  else if (req.query.avail === 'true') getAllFiltered.avail = true;

  const filteredBooks = await mycoll.find(getAllFiltered).toArray();
  res.status(200).json(filteredBooks);
});

// PUT: Checkout a book
app.put('/books/:id', async (req, res) => {
  const pathId = req.params.id;
    try {
      const parsed = req.body;
      const bookExists = await mycoll.findOne({ id: pathId });

      if (!bookExists) return res.sendStatus(404);

      const result = await mycoll.updateOne(
        { id: pathId },
        { $set: parsed },
        { upsert: false }
      );

      if (result.modifiedCount === 0) {
        return res.status(400);
      }

      return res.status(200).send(`Successfully updated book ${pathId}`);
    } catch (error) {
      console.error("Error updating book:", error);
      if(!res.headersSent) {
        return res.status(400).send('Invalid JSON');
      }
    }
});
