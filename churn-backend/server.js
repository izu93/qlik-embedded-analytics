const express = require("express");
const fs = require("fs");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");

const app = express();
const PORT = 3000;
const writebackFile = path.join(__dirname, "writeback.json");
// Middleware
app.use(cors());
app.use(bodyParser.json());

// Root route (GET /)
app.get("/", (req, res) => {
  res.send("✅ Qlik Writeback API is running. Use /api/save or /api/data.");
});

// Save writeback data to file
app.post("/api/save", (req, res) => {
  const newRows = req.body;

  if (!Array.isArray(newRows)) {
    return res.status(400).json({ error: "Invalid data format" });
  }

  // Read existing data
  fs.readFile(writebackFile, "utf8", (readErr, data) => {
    let existing = [];

    if (!readErr && data) {
      try {
        existing = JSON.parse(data);
      } catch (parseErr) {
        console.error("Failed to parse existing data:", parseErr);
      }
    }

    // Merge: replace if Account matches, otherwise keep
    const updated = [
      ...existing.filter(
        (oldRow) => !newRows.some((newRow) => newRow.Account === oldRow.Account)
      ),
      ...newRows,
    ];

    // Write back merged array
    fs.writeFile(
      writebackFile,
      JSON.stringify(updated, null, 2),
      (writeErr) => {
        if (writeErr) {
          console.error("Failed to write file:", writeErr);
          return res.status(500).json({ error: "Failed to save data" });
        }

        res.json({ message: "Data merged and saved successfully" });
      }
    );
  });
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
