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
export const getUserByUsername = (username) =>
  API.get(`/user/userdetails/by-username?username=${username}`);
export const getUserByEmail = (email) =>
  API.get(`/user/userdetails/by-email?email=${email}`);
export const updateUsername = (payload) =>
  API.post("/user/update-username", payload);
export const changePassword = (payload) =>
  API.post("/user/change-password", payload);
export const logoutUser = () => API.post("/user/logout");

// ============ DATASET API ============
export const getDatasets = () => API.get("/datasets/");
export const getUserDatasets = (user_id) => API.get(`/datasets/${user_id}`);

export const getDataset = (datasetId) => API.get(`/datasets/${datasetId}`);
export const deleteDataset = (datasetId) =>
  API.delete(`/datasets/${datasetId}`);

// Upload dataset (multipart form data)
export const uploadDataset = (formData) =>
  API.post("/datasets/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

// ============ Generated Output API ============

export const getGeneratedOutput = (generated_output_id) =>
  API.get(`/generated_output/${generated_output_id}`);

export const getGeneratedImageURL = (image_id) =>
  `http://127.0.0.1:8000/api/generated_output/image/${image_id}`;

// ============ PROJECT API ============
export const getAllProjects = () => API.get("/project/all");

export const getSpecificProject = (user_id, project_id) =>
  API.get(`/project/${user_id}/${project_id}`);

export const getAllUserProjects = (user_id) =>
  API.get(`/project/all/${user_id}`);

// Get single project details
export const getProject = (projectId) => API.get(`/project/${projectId}`);

// Get project's generated outputs
export const getProjectOutputs = (projectId) =>
  API.get(`/project/outputs/${projectId}`);

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

export const deleteProject = (projectId) =>
  API.delete(`/project/delete/${projectId}`);

// ============ EDIT/REGENERATE API ============
export const editTextRequest = (project_id, instruction, original_text) => {
  return API.post(`/edit/edit_text_output/${project_id}`, {
    instruction,
    original_text,
  });
};

export const editImageRequest = (
  project_id,
  instruction,
  original_image_id
) => {
  return API.post(`/edit/edit_image_output/${project_id}`, {
    instruction,
    original_image_id,
  });
};

export const getEditedImage = () =>
  fetch("/api/edit/edited/image", { cache: "no-store" }).then((res) => {
    if (!res.ok) throw new Error("No edited image found");
    return res.blob();
  });

export const deleteEditedImage = () =>
  fetch("/api/edit/delete/edited/image", { method: "DELETE" });

// Upload generated text
export const storeEditedText = async (projectId, textFormData) => {
  return await API.put(
    `/project/upload-generated-text/${projectId}`,
    textFormData
  );
};

// Upload generated image
export const storeEditedImage = (projectId, imageFormData) => {
  return API.put(
    `/project/upload-generated-image/${projectId}`,
    imageFormData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
};

// Regenerate text content with modifications
export const regenerateText = (projectId, payload) =>
  API.post(`/project/regenerate/text/${projectId}`, payload);

// Regenerate image with modifications
export const regenerateImage = (projectId, payload) =>
  API.post(`/project/regenerate/image/${projectId}`, payload);

// Regenerate video with modifications
export const regenerateVideo = (projectId, payload) =>
  API.post(`/project/regenerate/video/${projectId}`, payload);

// Update text content directly
export const updateTextContent = (projectId, payload) =>
  API.put(`/project/update/text/${projectId}`, payload);

// Get regeneration status
export const getRegenerationStatus = (projectId) =>
  API.get(`/project/regeneration/status/${projectId}`);

// ============ LANGGRAPH WORKFLOW API ============

// Trigger workflow with specific generation mode
export const triggerWorkflow = (projectId, mode = "generate") =>
  API.post(`/project/workflow/${projectId}`, { mode });

// Get workflow status
export const getWorkflowStatus = (projectId) =>
  API.get(`/project/workflow/status/${projectId}`);

// Stream/download endpoints
export const getGeneratedImage = (fileId) =>
  API.get(`/project/stream/image/${fileId}`, {
    responseType: "blob",
  });

export const getUploadedImage = (fileId) =>
  API.get(`/project/uploaded/image/${fileId}`, {
    responseType: "blob",
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
  formData.append("product_url", projectData.productUrl);
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

// Helper function to create payload for regeneration
export const createRegenerationPayload = (
  currentOutput,
  modifications,
  additionalContext = {}
) => {
  return {
    current_output: currentOutput,
    modifications: modifications,
    additional_context: additionalContext,
    timestamp: new Date().toISOString(),
  };
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
