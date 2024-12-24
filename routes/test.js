const router = require("express").Router();

// Health check endpoint
router.get("/health", (req, res) => {
  try {
    // You can add more health checks here (e.g., database connection)
    res.status(200).json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      service: "news-api",
      uptime: process.uptime()
    });
  } catch (error) {
    res.status(503).json({
      status: "unhealthy",
      error: error.message
    });
  }
});

// Endpoint that deliberately throws an exception
router.get("/test-error", async () => {
    // Deliberately throw an error
    throw new Error("This is a test error!");
});

// Example of how to create a custom error
class CustomAPIError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

// Another endpoint that throws a custom error
router.get("/custom-error", (req, res, next) => {
  const randomNumber = Math.random();
  
  if (randomNumber < 0.5) {
    throw new CustomAPIError("Random failure occurred", 400);
  }
  
  res.json({ message: "Success! No error this time." });
});

module.exports = router;