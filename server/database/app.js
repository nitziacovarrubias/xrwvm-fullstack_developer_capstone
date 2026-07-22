const express = require("express");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const Reviews = require("./review");
const Dealerships = require("./dealership");

const app = express();
const port = 3030;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const reviewsData = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, "data", "reviews.json"),
    "utf8"
  )
);

const dealershipsData = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, "data", "dealerships.json"),
    "utf8"
  )
);

async function initializeDatabase() {
  try {
    await mongoose.connect("mongodb://localhost:27017/", {
      dbName: "dealershipsDB",
    });

    console.log("Connected to MongoDB");

    await Reviews.deleteMany({});
    await Reviews.insertMany(reviewsData.reviews);

    await Dealerships.deleteMany({});
    await Dealerships.insertMany(dealershipsData.dealerships);

    console.log(`${reviewsData.reviews.length} reviews loaded`);
    console.log(
      `${dealershipsData.dealerships.length} dealerships loaded`
    );
  } catch (error) {
    console.error("Error initializing database:", error);
    process.exit(1);
  }
}

// Home route
app.get("/", (req, res) => {
  res.send("Welcome to the Mongoose API");
});

// Fetch all reviews
app.get("/fetchReviews", async (req, res) => {
  try {
    const documents = await Reviews.find();
    res.json(documents);
  } catch (error) {
    console.error("Error fetching reviews:", error);

    res.status(500).json({
      error: "Error fetching reviews",
    });
  }
});

// Fetch reviews by dealer ID
app.get("/fetchReviews/dealer/:id", async (req, res) => {
  try {
    const dealerId = Number(req.params.id);

    if (Number.isNaN(dealerId)) {
      return res.status(400).json({
        error: "Invalid dealer ID",
      });
    }

    const documents = await Reviews.find({
      dealership: dealerId,
    });

    return res.json(documents);
  } catch (error) {
    console.error("Error fetching reviews by dealer:", error);

    return res.status(500).json({
      error: "Error fetching reviews by dealer",
    });
  }
});

// Fetch all dealerships
app.get("/fetchDealers", async (req, res) => {
  try {
    const documents = await Dealerships.find();
    res.json(documents);
  } catch (error) {
    console.error("Error fetching dealerships:", error);

    res.status(500).json({
      error: "Error fetching dealerships",
    });
  }
});

// Fetch dealerships by state
app.get("/fetchDealers/:state", async (req, res) => {
  try {
    const documents = await Dealerships.find({
      state: req.params.state,
    });

    res.json(documents);
  } catch (error) {
    console.error("Error fetching dealerships by state:", error);

    res.status(500).json({
      error: "Error fetching dealerships by state",
    });
  }
});

// Fetch dealer by ID
app.get("/fetchDealer/:id", async (req, res) => {
  try {
    const dealerId = Number(req.params.id);

    if (Number.isNaN(dealerId)) {
      return res.status(400).json({
        error: "Invalid dealer ID",
      });
    }

    const documents = await Dealerships.find({
      id: dealerId,
    });

    return res.json(documents);
  } catch (error) {
    console.error("Error fetching dealership by ID:", error);

    return res.status(500).json({
      error: "Error fetching dealership by ID",
    });
  }
});

// Insert a new review
app.post("/insert_review", async (req, res) => {
  try {
    const data = req.body;

    const latestReview = await Reviews.findOne()
      .sort({ id: -1 })
      .lean();

    const newId = latestReview ? latestReview.id + 1 : 1;

    const review = new Reviews({
      id: newId,
      name: data.name,
      dealership: Number(data.dealership),
      review: data.review,
      purchase: data.purchase,
      purchase_date: data.purchase_date,
      car_make: data.car_make,
      car_model: data.car_model,
      car_year: data.car_year,
    });

    const savedReview = await review.save();

    return res.status(201).json(savedReview);
  } catch (error) {
    console.error("Error inserting review:", error);

    return res.status(500).json({
      error: "Error inserting review",
    });
  }
});

async function startServer() {
  await initializeDatabase();

  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
}

startServer();

