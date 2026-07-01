const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
const { importGithub } = require("../controllers/githubController");

router.post("/import", protect, importGithub);

module.exports = router;