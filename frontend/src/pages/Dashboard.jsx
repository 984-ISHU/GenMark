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

  // New Project State
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [creatingProject, setCreatingProject] = useState(false);

  // New Dataset State
  const [showNewDatasetModal, setShowNewDatasetModal] = useState(false);
  const [newDatasetName, setNewDatasetName] = useState("");
  const [datasetFile, setDatasetFile] = useState(null);
  const [uploadingDataset, setUploadingDataset] = useState(false);

  // Initialize user data from context or fetch from API
  useEffect(() => {
    if (contextUser) {
      const userData = {
        id: contextUser.id || contextUser.user?.id,
        username: contextUser.username || contextUser.user?.username || "",
        email: contextUser.email || contextUser.user?.email || "",
      };
      setUser(userData);
      setLoading(false);
    } else {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          setLoading(false);
        } catch (error) {
          console.error("Error parsing stored user data:", error);
          fetchUserProfile();
        }
      } else {
        fetchUserProfile();
      }
    }
  }, [contextUser]);

  // Fetch user profile from API
  const fetchUserProfile = async () => {
    try {
      const response = await getUserProfile();
      setUser(response.data);
      localStorage.setItem("user", JSON.stringify(response.data));
    } catch (error) {
      console.error("Error fetching user profile:", error);
      toast.error("Failed to load user profile");
      navigate("/login");
    } finally {
      setLoading(false);
    }
  };

  // Fetch projects and datasets when user is loaded
  useEffect(() => {
    if (user) {
      fetchProjects();
      fetchDatasets();
    }
  }, [user]);

  // Fetch user's projects
  const fetchProjects = async () => {
    if (!user) return;
    console.log("Inside Fetch Projects");
    setProjectsLoading(true);
    try {
      const response = await getAllUserProjects(user.id);
      const userProjects = response.data;
      console.log("Current user:", user);
      setProjects(userProjects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      toast.error("Failed to fetch projects");
    } finally {
      setProjectsLoading(false);
    }
  };

  // Fetch user's datasets
  const fetchDatasets = async () => {
    if (!user) return;

    setDatasetsLoading(true);
    try {
      const response = await getUserDatasets(user.id);
      console.log("User Datasets recieved");
      const allDatasets = response.data;
      const userDatasets = allDatasets.filter(
        (dataset) =>
          dataset.user_id === user.id ||
          dataset.user_id === user.username ||
          dataset.created_by === user.id ||
          dataset.created_by === user.username
      );
      setDatasets(userDatasets);
    } catch (error) {
      console.error("Error fetching datasets:", error);
      toast.error("Failed to fetch datasets");
    } finally {
      setDatasetsLoading(false);
    }
  };

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
      fetchProjects();
    } catch (error) {
      console.error("Error deleting project:", error);
      toast.error("Failed to delete project");
    }
  };

  // Upload new dataset
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
      toast.success("Dataset uploaded successfully!");
      fetchDatasets();
      setShowNewDatasetModal(false);
      setNewDatasetName("");
      setDatasetFile(null);
    } catch (error) {
      console.error("Error uploading dataset:", error);
      toast.error("Failed to upload dataset");
    } finally {
      setUploadingDataset(false);
    }
  };

  // Delete dataset
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
      toast.success("Dataset deleted successfully");
      fetchDatasets();
    } catch (error) {
      console.error("Error deleting dataset:", error);
      toast.error("Failed to delete dataset");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-300 via-pink-400 to-indigo-300 flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 shadow-2xl">
          <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600 text-center">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-screen bg-gradient-to-br from-purple-300 via-pink-400 to-indigo-300 font-sans">
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
              <div className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-2">
                <User className="w-5 h-5 text-white" />
                <span className="text-white font-medium">
                  {user?.username || user?.name || "User"}
                </span>
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
                Welcome back, {user?.username || user?.name || "User"}! 👋
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
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                project.status === "completed"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {project.status || "in_progress"}
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

          {/* Datasets Section */}
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Database className="w-8 h-8 text-white" />
                  <h3 className="text-2xl font-bold text-white">My Datasets</h3>
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
                  <p className="text-gray-500 text-lg">No datasets yet</p>
                  <p className="text-gray-400 mb-4">
                    Upload your first dataset to get started!
                  </p>
                  <button
                    onClick={() => setShowNewDatasetModal(true)}
                    className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-6 py-3 rounded-full hover:from-emerald-600 hover:to-teal-700 transition-all duration-200"
                  >
                    Upload Dataset
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
                  placeholder="Enter project name..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  disabled={creatingProject}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleCreateProject}
                  disabled={creatingProject || !newProjectName.trim()}
                  className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 rounded-xl font-semibold hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {creatingProject ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Plus className="w-5 h-5" />
                  )}
                  {creatingProject ? "Creating..." : "Create Project"}
                </button>
                <button
                  onClick={() => {
                    setShowNewProjectModal(false);
                    setNewProjectName("");
                  }}
                  disabled={creatingProject}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Dataset Modal */}
      {showNewDatasetModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-800">
                Upload New Dataset
              </h3>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dataset Name
                </label>
                <input
                  type="text"
                  value={newDatasetName}
                  onChange={(e) => setNewDatasetName(e.target.value)}
                  placeholder="Enter dataset name..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  disabled={uploadingDataset}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CSV File
                </label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setDatasetFile(e.target.files[0])}
                  className="block w-full text-sm text-gray-600 file:mr-4 file:py-3 file:px-4 file:rounded-xl file:border-0 file:bg-gradient-to-r file:from-emerald-500 file:to-teal-600 file:text-white hover:file:from-emerald-600 hover:file:to-teal-700 file:transition-all file:duration-200"
                  disabled={uploadingDataset}
                />
                {datasetFile && (
                  <p className="text-sm text-gray-500 mt-2">
                    Selected: {datasetFile.name}
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleUploadDataset}
                  disabled={
                    uploadingDataset || !newDatasetName.trim() || !datasetFile
                  }
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-3 rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {uploadingDataset ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Upload className="w-5 h-5" />
                  )}
                  {uploadingDataset ? "Uploading..." : "Upload Dataset"}
                </button>
                <button
                  onClick={() => {
                    setShowNewDatasetModal(false);
                    setNewDatasetName("");
                    setDatasetFile(null);
                  }}
                  disabled={uploadingDataset}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
