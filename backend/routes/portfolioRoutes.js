const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
const {
    createPortfolio,
    getMyPortfolio,
    updatePortfolio,
    deletePortfolio,
} = require("../controllers/portfolioController");

router.post("/", protect, createPortfolio);
router.get("/me", protect, getMyPortfolio);
router.put("/", protect, updatePortfolio);
router.delete("/", protect, deletePortfolio);

module.exports = router;