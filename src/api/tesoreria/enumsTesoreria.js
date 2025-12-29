// src/api/tesoreria/enumsTesoreria.js
import axios from "axios";
import { useAuthStore } from "../../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/tesoreria/enums`;

function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

export async function getEnumsTesoreria() {
  const res = await axios.get(API_URL, { headers: getAuthHeaders() });
  return res.data;
}