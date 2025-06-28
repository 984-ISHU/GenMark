// src/lib/api.js
import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:8000/api", 
});

export const loginUser = (payload) => API.post("/users/login", payload);
export const getUsers = () => API.get("/users/");
