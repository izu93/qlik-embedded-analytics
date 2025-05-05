const express = require("express");
const fs = require("fs");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Root route (GET /)
app.get("/", (req, res) => {
  res.send("✅ Qlik Writeback API is running. Use /api/save or /api/data.");
});

// Save writeback data to file
app.post("/api/save", (req, res) => {
  const data = req.body;

  try {
    fs.writeFileSync(
      path.join(__dirname, "writeback.json"),
      JSON.stringify(data, null, 2)
    );
    res.status(200).send({ message: "Data saved successfully." });
  } catch (error) {
    console.error("Error writing file:", error);
    res.status(500).send({ message: "Failed to save data." });
  }
});

// Optional: Load data back from file
app.get("/api/data", (req, res) => {
  try {
    const fileData = fs.readFileSync(
      path.join(__dirname, "writeback.json"),
      "utf8"
    );
    const json = JSON.parse(fileData);
    res.status(200).json(json);
  } catch (error) {
    console.error("Error reading file:", error);
    res.status(500).send({ message: "Failed to load data." });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
