// src/lib/api.js
import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:8000/api",
  withCredentials: true, // Important for cookie-based authentication
});

// ============ USER API ============
export const registerUser = (payload) => API.post("/user/register", payload);
export const loginUser = (payload) => API.post("/user/login", payload);
export const getUserProfile = () => API.get("/user/profile");
export const getUserByUsername = (username) => API.get(`/user/userdetails/by-username?username=${username}`);
export const getUserByEmail = (email) => API.get(`/user/userdetails/by-email?email=${email}`);
export const updateUsername = (payload) => API.post("/user/update-username", payload);
export const changePassword = (payload) => API.post("/user/change-password", payload);
export const logoutUser = () => API.post("/user/logout");

// ============ DATASET API ============
export const getDatasets = () => API.get("/datasets/");
export const getDataset = (datasetId) => API.get(`/datasets/${datasetId}`);
export const deleteDataset = (datasetId) => API.delete(`/datasets/${datasetId}`);

// Upload dataset (multipart form data)
export const uploadDataset = (formData) => 
  API.post("/datasets/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

// ============ PROJECT API ============
export const getAllProjects = () => API.get("/project/all");

// Create project with product (multipart form data)
export const createProjectAndProduct = (formData) =>
  API.post("/project/create", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

// Upload generated outputs (multipart form data)
export const uploadGeneratedOutputs = (projectId, formData) =>
  API.put(`/project/upload-generated-outputs/${projectId}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

export const deleteProject = (projectId) => API.delete(`/project/delete/${projectId}`);

// Stream/download endpoints
export const getGeneratedImage = (fileId) => API.get(`/project/stream/image/${fileId}`, {
  responseType: 'blob'
});

export const getUploadedImage = (fileId) => API.get(`/project/uploaded/image/${fileId}`, {
  responseType: 'blob'
});

// ============ HELPER FUNCTIONS ============

// Helper function to create FormData for dataset upload
export const createDatasetFormData = (userId, datasetName, file) => {
  const formData = new FormData();
  formData.append("user_id", userId);
  formData.append("dataset_name", datasetName);
  formData.append("file", file);
  return formData;
};

// Helper function to create FormData for project creation
export const createProjectFormData = (projectData) => {
  const formData = new FormData();
  
  // Required fields
  formData.append("user_id", projectData.userId);
  formData.append("name", projectData.name);
  formData.append("target_audience", projectData.targetAudience);
  formData.append("output_format", projectData.outputFormat);
  formData.append("product_name", projectData.productName);
  formData.append("description", projectData.description);
  formData.append("price", projectData.price);
  formData.append("discount", projectData.discount);
  
  // Product images (array of files)
  if (projectData.productImages && projectData.productImages.length > 0) {
    projectData.productImages.forEach((image) => {
      formData.append("product_images", image);
    });
  }
  
  return formData;
};

// Helper function to create FormData for generated outputs upload
export const createGeneratedOutputsFormData = (outputsData) => {
  const formData = new FormData();
  
  formData.append("text", outputsData.text);
  formData.append("video_output", outputsData.videoOutput);
  
  // Image outputs (array of files)
  if (outputsData.imageOutputs && outputsData.imageOutputs.length > 0) {
    outputsData.imageOutputs.forEach((image) => {
      formData.append("image_outputs", image);
    });
  }
  
  return formData;
};

// ============ REQUEST INTERCEPTORS ============

// Request interceptor to add auth token from cookies if needed
API.interceptors.request.use(
  (config) => {
    // The backend uses httpOnly cookies, so no need to manually add tokens
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for global error handling
API.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      console.error("Unauthorized access - redirecting to login");
      // You might want to redirect to login page here
    }
    return Promise.reject(error);
  }
);

export default API;