import axios from "axios";
import API_URL from "./api";

export const importGithub = async (username, token) => {
  const response = await axios.post(
    `${API_URL}/github/import`,
    { username },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};