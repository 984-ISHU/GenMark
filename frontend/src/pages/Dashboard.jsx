import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Trash2,
  Upload,
  FolderOpen,
  Database,
  User,
  Calendar,
  FileText,
  X,
  Loader2,
  Home
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../auth/AuthContext";
import {
  getUserProfile,
  getAllUserProjects,
  getUserDatasets,
  deleteProject,
  deleteDataset,
  createDatasetFormData,
  uploadDataset,
  getUserProductDatasets,
  deleteProductDataset,
  uploadProductDataset
} from "../lib/api";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user: contextUser } = useAuth();
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [datasetsLoading, setDatasetsLoading] = useState(false);

  const [productdatasets, setProductDatasets] = useState([]);
  const [productdatasetsLoading, setProductDatasetsLoading] = useState(false);

  // New Project State
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [creatingProject, setCreatingProject] = useState(false);

  // New Dataset State - User DB
  const [showNewDatasetModal, setShowNewDatasetModal] = useState(false);
  const [newDatasetName, setNewDatasetName] = useState("");
  const [datasetFile, setDatasetFile] = useState(null);
  const [uploadingDataset, setUploadingDataset] = useState(false);

  // New Product Dataset State - Product DB
  const [showNewProductDatasetModal, setShowNewProductDatasetModal] = useState(false);
  const [newProductDatasetName, setNewProductDatasetName] = useState("");
  const [productDatasetFile, setProductDatasetFile] = useState(null);
  const [uploadingProductDataset, setUploadingProductDataset] = useState(false);

  // Helper function to capitalize first letter
  const capitalizeFirstLetter = (str) => {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  // Initialize user data and fetch data
  useEffect(() => {
    const initializeUser = async () => {
      try {
        // First try to get user from context
        if (contextUser) {
          console.log("Using context user:", contextUser);
          setUser(contextUser);
          setLoading(false);
          return;
        }

        // Then try localStorage
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            console.log("Using stored user:", parsedUser);
            setUser(parsedUser);
            setLoading(false);
            return;
          } catch (error) {
            console.error("Error parsing stored user:", error);
            localStorage.removeItem("user");
          }
        }

        // Finally, try to fetch from API
        console.log("Fetching user profile from API");
        const response = await getUserProfile();
        console.log("Profile response:", response.data);
        setUser(response.data);
        localStorage.setItem("user", JSON.stringify(response.data));
        setLoading(false);
        
      } catch (error) {
        console.error("Error initializing user:", error);
        toast.error("Failed to load user profile");
        navigate("/login");
      }
    };

    initializeUser();
  }, [contextUser, navigate]);

  // Fetch projects and datasets when user is available
  useEffect(() => {
    const fetchData = async () => {
      if (user?.id) {
        console.log("Fetching data for user:", user.id);
        await Promise.all([fetchProjects(), fetchDatasets(), fetchProductDatasets()]);
      }
    };
    
    fetchData();
  }, [user]);

  // Fetch user's projects
  const fetchProjects = async () => {
    if (!user?.id) {
      console.warn("No user ID available for fetching projects");
      return;
    }

    console.log("Fetching projects for user ID:", user.id);
    setProjectsLoading(true);
    try {
      const response = await getAllUserProjects(user.id);
      console.log("Projects response:", response.data);
      setProjects(response.data || []);
    } catch (error) {
      console.error("Error fetching projects:", error);
      toast.error("Failed to fetch projects");
      setProjects([]);
    } finally {
      setProjectsLoading(false);
    }
  };

  // Fetch user's datasets (User DB)
  const fetchDatasets = async () => {
    if (!user?.id) {
      console.warn("No user ID available for fetching datasets");
      return;
    }

    console.log("Fetching user datasets for user ID:", user.id);
    setDatasetsLoading(true);
    try {
      const response = await getUserDatasets(user.id);
      console.log("User datasets response:", response.data);
      const allDatasets = response.data || [];
      
      // Filter datasets for current user
      const userDatasets = allDatasets.filter(dataset => {
        return dataset.user_id === user.id || 
               dataset.user_id === user.username || 
               dataset.created_by === user.id || 
               dataset.created_by === user.username;
      });
      
      console.log("Filtered user datasets:", userDatasets);
      setDatasets(userDatasets);
    } catch (error) {
      console.error("Error fetching user datasets:", error);
      toast.error("Failed to fetch user datasets");
      setDatasets([]);
    } finally {
      setDatasetsLoading(false);
    }
  };

  // Fetch user's product datasets (Product DB)
  const fetchProductDatasets = async () => {
    if (!user?.id) {
      console.warn("No user ID available for fetching product datasets");
      return;
    }

    console.log("Fetching product datasets for user ID:", user.id);
    setProductDatasetsLoading(true);
    try {
      const response = await getUserProductDatasets(user.id);
      console.log("Product datasets response:", response.data);
      const allProductDatasets = response.data || [];
      
      // Filter product datasets for current user
      const userProductDatasets = allProductDatasets.filter(dataset => {
        return dataset.user_id === user.id || 
               dataset.user_id === user.username || 
               dataset.created_by === user.id || 
               dataset.created_by === user.username;
      });
      
      console.log("Filtered user product datasets:", userProductDatasets);
      setProductDatasets(userProductDatasets);
    } catch (error) {
      console.error("Error fetching product datasets:", error);
      toast.error("Failed to fetch product datasets");
      setProductDatasets([]);
    } finally {
      setProductDatasetsLoading(false);
    }
  }

  // Create new project
  const handleCreateProject = async () => {
    if (!newProjectName.trim()) {
      toast.error("Please enter a project name");
      return;
    }

    setCreatingProject(true);
    try {
      localStorage.setItem("ProjectName", newProjectName.trim());
      toast.success("Project created! Configure your project details.");
      navigate("/project");
    } catch (error) {
      console.error("Error creating project:", error);
      toast.error("Failed to create project");
    } finally {
      setCreatingProject(false);
      setShowNewProjectModal(false);
      setNewProjectName("");
    }
  };

  // Handle Enter key press for project creation
  const handleProjectKeyPress = (e) => {
    if (e.key === 'Enter' && !creatingProject && newProjectName.trim()) {
      handleCreateProject();
    }
  };

  // Delete project
  const handleDeleteProject = async (projectId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this project? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      await deleteProject(projectId);
      toast.success("Project deleted successfully");
      await fetchProjects(); // Refresh projects list
    } catch (error) {
      console.error("Error deleting project:", error);
      toast.error("Failed to delete project");
    }
  };

  // Upload new user dataset (User DB)
  const handleUploadDataset = async () => {
    if (!newDatasetName.trim()) {
      toast.error("Please enter a dataset name");
      return;
    }

    if (!datasetFile) {
      toast.error("Please select a CSV file");
      return;
    }

    if (!datasetFile.name.toLowerCase().endsWith(".csv")) {
      toast.error("Please select a CSV file");
      return;
    }

    setUploadingDataset(true);
    try {
      const formData = createDatasetFormData(
        user.id,
        newDatasetName.trim(),
        datasetFile
      );
      await uploadDataset(formData);
      toast.success("User dataset uploaded successfully!");
      await fetchDatasets(); // Refresh user datasets list
      setShowNewDatasetModal(false);
      setNewDatasetName("");
      setDatasetFile(null);
    } catch (error) {
      console.error("Error uploading user dataset:", error);
      toast.error("Failed to upload user dataset");
    } finally {
      setUploadingDataset(false);
    }
  };

  // Handle Enter key press for user dataset creation
  const handleDatasetKeyPress = (e) => {
    if (e.key === 'Enter' && !uploadingDataset && newDatasetName.trim() && datasetFile) {
      handleUploadDataset();
    }
  };

  // Upload new product dataset (Product DB)
  const handleUploadProductDataset = async () => {
    if (!newProductDatasetName.trim()) {
      toast.error("Please enter a product dataset name");
      return;
    }
    
    if (!productDatasetFile) {
      toast.error("Please select a CSV file");
      return;
    }
    
    if (!productDatasetFile.name.toLowerCase().endsWith(".csv")) {
      toast.error("Please select a CSV file");
      return;
    }
    
    setUploadingProductDataset(true);
    try {
      const formData = createDatasetFormData(
        user.id,
        newProductDatasetName.trim(),
        productDatasetFile
      );
      await uploadProductDataset(formData);
      toast.success("Product dataset uploaded successfully!");
      await fetchProductDatasets(); // Refresh product datasets list
      setShowNewProductDatasetModal(false);
      setNewProductDatasetName("");
      setProductDatasetFile(null);
    } catch (error) {
      console.error("Error uploading product dataset:", error);
      toast.error("Failed to upload product dataset");
    } finally {
      setUploadingProductDataset(false);
    }
  };

  // Handle Enter key press for product dataset creation
  const handleProductDatasetKeyPress = (e) => {
    if (e.key === 'Enter' && !uploadingProductDataset && newProductDatasetName.trim() && productDatasetFile) {
      handleUploadProductDataset();
    }
  };

  // Delete user dataset (User DB)
  const handleDeleteDataset = async (datasetId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this dataset? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      await deleteDataset(datasetId);
      toast.success("User dataset deleted successfully");
      await fetchDatasets(); // Refresh user datasets list
    } catch (error) {
      console.error("Error deleting user dataset:", error);
      toast.error("Failed to delete user dataset");
    }
  };

  // Delete product dataset (Product DB)
  const handleDeleteProductDataset = async (datasetId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this product dataset? This action cannot be undone."
      )
    ) {
      return;
    }
    try {
      await deleteProductDataset(datasetId);
      toast.success("Product dataset deleted successfully");
      await fetchProductDatasets(); // Refresh product datasets list
    } catch (error) {
      console.error("Error deleting product dataset:", error);
      toast.error("Failed to delete product dataset");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800 flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 shadow-2xl">
          <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600 text-center">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800 font-sans">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-sm border-b border-white/20">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-extrabold text-white tracking-tight">
                GenMark
              </h1>
              <p className="text-white/90 mt-1 font-medium">
                🎯 Personalized Marketing Studio
              </p>
            </div>
            <div className="flex items-center gap-4">
            <div 
              className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-2 cursor-pointer hover:bg-white/30 transition-colors"
              onClick={() => navigate('/')}
            >
              <Home className="w-5 h-5 text-white" />
              <span className="text-white font-medium">Home</span>
            </div>
              <button
                onClick={() => navigate("/profile")}
                className="bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white font-semibold py-2 px-6 rounded-full shadow-lg hover:from-purple-700 hover:to-fuchsia-700 transition-all duration-200"
              >
                Profile
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 shadow-2xl mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-purple-700">
                Welcome back, {capitalizeFirstLetter(user?.username || user?.name || "User")}! 👋
              </h2>
              <p className="text-gray-600 mt-1">
                Ready to create amazing marketing content?
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Projects Section */}
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FolderOpen className="w-8 h-8 text-white" />
                  <h3 className="text-2xl font-bold text-white">My Projects</h3>
                </div>
                <button
                  onClick={() => setShowNewProjectModal(true)}
                  className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-full transition-colors flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  New Project
                </button>
              </div>
            </div>

            <div className="p-6">
              {projectsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                </div>
              ) : projects.length === 0 ? (
                <div className="text-center py-8">
                  <FolderOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">No projects yet</p>
                  <p className="text-gray-400 mb-4">
                    Create your first project to get started!
                  </p>
                  <button
                    onClick={() => setShowNewProjectModal(true)}
                    className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-3 rounded-full hover:from-indigo-600 hover:to-purple-700 transition-all duration-200"
                  >
                    Create New Project
                  </button>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {projects.map((project) => (
                    <div
                      key={project.id || project._id}
                      className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-200 hover:shadow-lg transition-shadow"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold text-gray-800 mb-1">
                            {project.name}
                          </h4>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {project.created_at
                                ? new Date(
                                    project.created_at
                                  ).toLocaleDateString()
                                : "N/A"}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              localStorage.setItem("ProjectName", project.name);
                              navigate("/preview", {
                                state: {
                                  name: user.username,
                                  user_id: user.id,
                                  projectName: project.name,
                                  project_id: project.id || project._id,
                                },
                              });
                            }}
                            className="bg-indigo-600 text-white px-3 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm"
                          >
                            Open
                          </button>

                          <button
                            onClick={() =>
                              handleDeleteProject(project.id || project._id)
                            }
                            className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* User Datasets Section (User DB) */}
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Database className="w-8 h-8 text-white" />
                  <h3 className="text-2xl font-bold text-white">User DB</h3>
                </div>
                <button
                  onClick={() => setShowNewDatasetModal(true)}
                  className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-full transition-colors flex items-center gap-2"
                >
                  <Upload className="w-5 h-5" />
                  Add Dataset
                </button>
              </div>
            </div>

            <div className="p-6">
              {datasetsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                </div>
              ) : datasets.length === 0 ? (
                <div className="text-center py-8">
                  <Database className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">No user datasets yet</p>
                  <p className="text-gray-400 mb-4">
                    Upload your first user dataset to get started!
                  </p>
                  <button
                    onClick={() => setShowNewDatasetModal(true)}
                    className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-6 py-3 rounded-full hover:from-emerald-600 hover:to-teal-700 transition-all duration-200"
                  >
                    Upload User Dataset
                  </button>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {datasets.map((dataset) => (
                    <div
                      key={dataset.id}
                      className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-200 hover:shadow-lg transition-shadow"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold text-gray-800 mb-2">
                            {dataset.dataset_name}
                          </h4>
                          <div className="flex flex-wrap gap-2 mb-2">
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                              {dataset.categories?.length || 0} Categories
                            </span>
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                              {dataset.locations?.length || 0} Locations
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteDataset(dataset.id)}
                          className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Shared Projects Section */}
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-orange-500 to-red-600 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FolderOpen className="w-8 h-8 text-white" />
                  <h3 className="text-2xl font-bold text-white">Shared Projects</h3>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="text-center py-8">
                <FolderOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No projects shared with you.</p>
                <p className="text-gray-400">Projects shared by other users will appear here.</p>
              </div>
            </div>
          </div>
          
          {/* Product Datasets Section (Product DB) */}
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Database className="w-8 h-8 text-white" />
                  <h3 className="text-2xl font-bold text-white">Product DB</h3>
                </div>
                <button
                  onClick={() => setShowNewProductDatasetModal(true)}
                  className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-full transition-colors flex items-center gap-2"
                >
                  <Upload className="w-5 h-5" />
                  Add Dataset
                </button>
              </div>
            </div>

            <div className="p-6">
              {productdatasetsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                </div>
              ) : productdatasets.length === 0 ? (
                <div className="text-center py-8">
                  <Database className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">No product datasets yet</p>
                  <p className="text-gray-400 mb-4">
                    Upload your first product dataset to get started!
                  </p>
                  <button
                    onClick={() => setShowNewProductDatasetModal(true)}
                    className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-3 rounded-full hover:from-indigo-600 hover:to-purple-700 transition-all duration-200"
                  >
                    Upload Product Dataset
                  </button>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {productdatasets.map((dataset) => {
                  console.log(dataset);
                  return (
                    <div
                      key={dataset.id || dataset._id}
                      className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-200 hover:shadow-lg transition-shadow"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold text-gray-800 mb-2">
                            {dataset.dataset_name}
                          </h4>
                          <div className="flex flex-wrap gap-2 mb-2">
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                              {dataset.rowCount || dataset.row_count || 0} Products
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteProductDataset(dataset.id || dataset._id)}
                          className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      
      {/* New Project Modal */}
      {showNewProjectModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-800">
                Create New Project
              </h3>
              <button
                onClick={() => {
                  setShowNewProjectModal(false);
                  setNewProjectName("");
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Name
                </label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  onKeyPress={handleProjectKeyPress}
                  placeholder="Enter project name..."
                  className="w-full px-4 py-3 border border-gray-300 text-gray-900 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  disabled={creatingProject}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleCreateProject}
                  disabled={creatingProject || !newProjectName.trim()}
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {creatingProject ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "Create & Configure"
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowNewProjectModal(false);
                    setNewProjectName("");
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-xl hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New User Dataset Modal (User DB) */}
      {showNewDatasetModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-800">Upload User Dataset</h3>
              <button
                onClick={() => {
                  setShowNewDatasetModal(false);
                  setNewDatasetName("");
                  setDatasetFile(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Dataset Name</label>
                <input
                  type="text"
                  value={newDatasetName}
                  onChange={(e) => setNewDatasetName(e.target.value)}
                  onKeyPress={handleDatasetKeyPress}
                  placeholder="e.g., Q3 Customer Data"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  disabled={uploadingDataset}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">CSV File</label>
                <label htmlFor="dataset-file-upload" className="w-full flex items-center justify-center px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-emerald-500 hover:bg-emerald-50 transition-colors">
                  <Upload className="w-5 h-5 text-gray-500 mr-2" />
                  <span className="text-gray-700">{datasetFile ? datasetFile.name : "Click to select a file (.csv)"}</span>
                </label>
                <input
                  id="dataset-file-upload"
                  type="file"
                  accept=".csv"
                  onChange={(e) => setDatasetFile(e.target.files[0])}
                  className="hidden"
                  disabled={uploadingDataset}
                />
              </div>
            </div>
            <div className="flex gap-3 pt-6">
              <button
                onClick={handleUploadDataset}
                disabled={uploadingDataset || !newDatasetName.trim() || !datasetFile}
                className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {uploadingDataset ? <Loader2 className="w-5 h-5 animate-spin" /> : "Upload Dataset"}
              </button>
            	<button
                onClick={() => setShowNewDatasetModal(false)}
                className="flex-1 bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-xl hover:bg-gray-300 transition-colors"
              >
                Cancel
            	</button>
            </div>
          </div>
        </div>
      )}

      {/* New Product Dataset Modal (Product DB) */}
      {showNewProductDatasetModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-800">Upload Product Dataset</h3>
            	<button
                onClick={() => {
                  setShowNewProductDatasetModal(false);
                  setNewProductDatasetName("");
                  setProductDatasetFile(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
            	>
                <X className="w-6 h-6" />
            	</button>
            </div>
            <div className="space-y-4">
            	<div>
              	<label className="block text-sm font-medium text-gray-700 mb-2">Dataset Name</label>
              	<input
                	type="text"
                	value={newProductDatasetName}
                	onChange={(e) => setNewProductDatasetName(e.target.value)}
                	onKeyPress={handleProductDatasetKeyPress}
                	placeholder="e.g., Latest Product Catalog"
                	className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                	disabled={uploadingProductDataset}
              	/>
            	</div>
            	<div>
              	<label className="block text-sm font-medium text-gray-700 mb-2">CSV File</label>
              	<label htmlFor="product-dataset-file-upload" className="w-full flex items-center justify-center px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition-colors">
                	<Upload className="w-5 h-5 text-gray-500 mr-2" />
                	<span className="text-gray-700">{productDatasetFile ? productDatasetFile.name : "Click to select a file (.csv)"}</span>
              	</label>
              	<input
                	id="product-dataset-file-upload"
                	type="file"
                	accept=".csv"
                	onChange={(e) => setProductDatasetFile(e.target.files[0])}
                	className="hidden"
                	disabled={uploadingProductDataset}
              	/>
            	</div>
            </div>
            <div className="flex gap-3 pt-6">
            	<button
              	onClick={handleUploadProductDataset}
              	disabled={uploadingProductDataset || !newProductDatasetName.trim() || !productDatasetFile}
              	className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            	>
              	{uploadingProductDataset ? <Loader2 className="w-5 h-5 animate-spin" /> : "Upload Dataset"}
            	</button>
            	<button
              	onClick={() => setShowNewProductDatasetModal(false)}
              	className="flex-1 bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-xl hover:bg-gray-300 transition-colors"
            	>
              	Cancel
            	</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;