import axios from "axios";
import API_URL from "./api";

export const getPortfolio = async (token) => {
  const response = await axios.get(
    `${API_URL}/portfolio/me`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};

export const createPortfolio = async (portfolioData, token) => {
  const response = await axios.post(
    `${API_URL}/portfolio`,
    portfolioData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};

export const updatePortfolio = async (portfolioData, token) => {
  const response = await axios.put(
    `${API_URL}/portfolio`,
    portfolioData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};

export const deletePortfolio = async (token) => {
  const response = await axios.delete(
    `${API_URL}/portfolio`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};