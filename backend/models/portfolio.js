const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },

  description: {
    type: String,
    default: "",
  },

  link: {
    type: String,
    default: "",
  },

  tags: [
    {
      type: String,
    },
  ],
});

const portfolioSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    name: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      default: "",
    },

    tagline: {
      type: String,
      default: "",
    },

    email: {
      type: String,
      required: true,
    },

    about: {
      type: String,
      default: "",
    },

    github: {
      type: String,
      default: "",
    },

    skills: [
      {
        type: String,
      },
    ],

    projects: [projectSchema],

    template: {
      type: String,
      default: "minimal",
    },

    theme: {
      type: String,
      default: "light",
    },

    accent: {
      type: String,
      default: "#4F46E5",
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Portfolio", portfolioSchema);
