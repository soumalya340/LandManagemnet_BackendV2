const express = require("express");
const cors = require("cors");
const { ethers } = require("ethers");
require("dotenv").config();
const { initializeContract, contract } = require("./utils/contractInstance");
const getterRoutes = require("./routes/getter.routes");
const setterRoutes = require("./routes/setter.routes");
const getPlotRoutes = require("./routes/get_plot.routes");
const { swaggerUi, specs } = require("./config/swagger");

const app = express();
const PORT = process.env.PORT || 8000;

// Enable CORS for ALL sites, ALL methods, ALL headers - COMPLETELY OPEN
app.use(
  cors({
    origin: "*", // Allow all origins
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"], // Allow all HTTP methods
    allowedHeaders: ["*"], // Allow all headers
    credentials: false, // Set to false for wildcard origin
    optionsSuccessStatus: 200, // For legacy browser support
  })
);

// Middleware to parse JSON requests (useful for future POST routes)
app.use(express.json());

// Middleware to parse URL-encoded form data
app.use(express.urlencoded({ extended: true }));

/**
 * @swagger
 * /:
 *   get:
 *     summary: API Health Check
 *     description: Returns a simple message confirming the API is running
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API is running successfully
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "It's Land Management Api endpoint"
 */
app.get("/", (req, res) => {
  res.send("It's Land Management Api endpoint");
});

// Swagger UI setup
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(specs, {
    explorer: true,
    customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info { margin: 20px 0; }
    .swagger-ui .info .title { color: #3b4151; font-size: 36px; }
  `,
    customSiteTitle: "Land Management API Documentation",
    customfavIcon: "https://swagger.io/favicon.ico",
  })
);

// Routes for the getter functions
app.use("/api/getter", getterRoutes);
app.use("/api/setter", setterRoutes);
app.use("/api/get_plot", getPlotRoutes);

// Function to start the server
async function startServer() {
  try {
    console.log("Starting server...");

    // Initialize blockchain connection when server starts
    await initializeContract();

    // Start listening for HTTP requests
    app.listen(PORT, () => {
      console.log(`Server listening at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("\nShutting down...");
  process.exit(0);
});

// Start the server
startServer();
