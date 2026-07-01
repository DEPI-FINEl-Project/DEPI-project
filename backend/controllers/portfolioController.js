const Portfolio = require("../models/Portfolio");

// Create Portfolio
const createPortfolio = async (req, res) => {
  try {
    const {
      name,
      role,
      tagline,
      email,
      about,
      github,
      skills,
      projects,
      template,
      theme,
      accent,
    } = req.body;

    // Check if portfolio already exists
    const existingPortfolio = await Portfolio.findOne({
      user: req.user._id,
    });

    if (existingPortfolio) {
      return res.status(400).json({
        message: "Portfolio already exists",
      });
    }

    const portfolio = await Portfolio.create({
      user: req.user._id,
      name,
      role,
      tagline,
      email,
      about,
      github,
      skills,
      projects,
      template,
      theme,
      accent,
    });

    res.status(201).json(portfolio);

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};
// Get My Portfolio
const getMyPortfolio = async (req, res) => {
  try {

    const portfolio = await Portfolio.findOne({
      user: req.user._id,
    });

    if (!portfolio) {
      return res.status(404).json({
        message: "Portfolio not found",
      });
    }

    res.status(200).json(portfolio);

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Update Portfolio
const updatePortfolio = async (req, res) => {
  try {
    const portfolio = await Portfolio.findOne({
      user: req.user._id,
    });

    if (!portfolio) {
      return res.status(404).json({
        message: "Portfolio not found",
      });
    }

    const updatedPortfolio = await Portfolio.findOneAndUpdate(
      { user: req.user._id },
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    res.status(200).json(updatedPortfolio);

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Delete Portfolio
const deletePortfolio = async (req, res) => {
  try {
    const portfolio = await Portfolio.findOne({
      user: req.user._id,
    });

    if (!portfolio) {
      return res.status(404).json({
        message: "Portfolio not found",
      });
    }

    await Portfolio.findByIdAndDelete(portfolio._id);

    res.status(200).json({
      message: "Portfolio deleted successfully",
    });

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  createPortfolio,
  getMyPortfolio,
  updatePortfolio,
  deletePortfolio,
};
