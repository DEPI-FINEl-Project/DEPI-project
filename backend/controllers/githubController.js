const axios = require("axios");
const Portfolio = require("../models/Portfolio");

const importGithub = async (req, res) => {
  try {
    console.log("========== IMPORT GITHUB CONTROLLER ==========");
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({
        message: "GitHub username is required",
      });
    }

    // =========================
    // Get GitHub Profile
    // =========================
    const profileResponse = await axios.get(
      `https://api.github.com/users/${username}`
    );

    // =========================
    // Get GitHub Repositories
    // =========================
    const reposResponse = await axios.get(
      `https://api.github.com/users/${username}/repos?per_page=100`
    );

    const profile = profileResponse.data;
    const repos = reposResponse.data;

    console.log("GitHub User:", profile.login);
    console.log("Repositories Count:", repos.length);

    // =========================
    // Extract Skills
    // =========================
    const languageCount = {};

    repos.forEach((repo) => {
      if (repo.language) {
        languageCount[repo.language] =
          (languageCount[repo.language] || 0) + 1;
      }
    });

    const skills = Object.keys(languageCount);

    console.log("Skills:", skills);

    // =========================
    // Extract Projects
    // =========================
    const projects = repos
      .filter((repo) => !repo.fork)
      .sort(
        (a, b) =>
          b.stargazers_count - a.stargazers_count ||
          new Date(b.pushed_at) - new Date(a.pushed_at)
      )
      .slice(0, 6)
      .map((repo) => ({
        title: repo.name,
        description: repo.description || "No description",
        link: repo.html_url,
        tags: repo.language ? [repo.language] : [],
      }));

    console.log("Projects:", projects);

    // =========================
    // Check Portfolio
    // =========================
    console.log("User ID:", req.user._id);

    const existingPortfolio = await Portfolio.findOne({
      user: req.user._id,
    });

    console.log("Existing Portfolio:", existingPortfolio);

    // =========================
    // Update Portfolio
    // =========================
    const portfolio = await Portfolio.findOneAndUpdate(
  { user: req.user._id },
  {
    user: req.user._id,
    github: profile.login,
    name: profile.name || profile.login,
    about: profile.bio || "",
    skills,
    projects,
  },
  {
     returnDocument: "after",
    upsert: true,
    setDefaultsOnInsert: true,
  }
);

    console.log("Saved Portfolio:", portfolio);

    res.status(200).json({
      message: "GitHub imported successfully",
      portfolio,
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  importGithub,
};