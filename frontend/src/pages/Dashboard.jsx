import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Bell,
  User,
  Grid3X3,
  List,
  Filter,
  Database,
  Sparkles,
  Clock,
  Star,
  ArrowRight,
  X,
  Folder,
  Users,
  Edit,
  Trash2,
  Upload,
  FileText,
  Image,
  Video,
  Target,
  Calendar,
  Save,
  Download,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Dashboard = () => {
  // User data (would come from authentication)
  const [user] = useState({
    id: "user123",
    name: "John Doe",
    email: "john@example.com",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face"
  });

  // Navigation state
  const [currentPage, setCurrentPage] = useState("dashboard");
  
  // Projects state
  const [projects, setProjects] = useState([
    {
      id: "1",
      name: "Brand Campaign 2024",
      target_audience: "Young Adults 18-35",
      output_format: "image",
      status: "in_progress",
      created_at: new Date("2024-01-15"),
      user_id: "user123"
    },
    {
      id: "2", 
      name: "Product Launch",
      target_audience: "Tech Professionals",
      output_format: "video",
      status: "completed",
      created_at: new Date("2024-01-10"),
      user_id: "user123"
    }
  ]);

  // Datasets state
  const [datasets, setDatasets] = useState([
    {
      id: "1",
      user_id: "user123",
      project_id: "1",
      dataset_name: "Customer Demographics",
      file_size: "2.4 MB",
      uploaded_at: new Date("2024-01-16")
    },
    {
      id: "2",
      user_id: "user123", 
      project_id: "2",
      dataset_name: "Product Analytics",
      file_size: "1.8 MB",
      uploaded_at: new Date("2024-01-12")
    }
  ]);

  // Modal states
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isDatasetModalOpen, setIsDatasetModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [editingDataset, setEditingDataset] = useState(null);

  // Form states
  const [projectForm, setProjectForm] = useState({
    name: "",
    target_audience: "",
    output_format: "",
    status: "in_progress"
  });

  const [datasetForm, setDatasetForm] = useState({
    project_id: "",
    dataset_name: "",
    file: null
  });

  const [viewMode, setViewMode] = useState("grid");
  const [searchQuery, setSearchQuery] = useState("");

  // Shared projects (static for now)
  const sharedProjects = [
    {
      id: "shared1",
      name: "Team Presentation",
      owner: "Sarah Chen",
      lastEdited: "1 day ago",
      gradient: "from-indigo-500 to-purple-500",
    },
    {
      id: "shared2", 
      name: "Client Proposal",
      owner: "Mike Johnson",
      lastEdited: "4 days ago",
      gradient: "from-teal-500 to-green-500",
    },
  ];

  // Helper functions
  const getOutputFormatIcon = (format) => {
    switch(format) {
      case 'image': return <Image className="w-4 h-4 text-white" />;
      case 'video': return <Video className="w-4 h-4 text-white" />;
      case 'text': return <FileText className="w-4 h-4 text-white" />;
      default: return <FileText className="w-4 h-4 text-white" />;
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Project CRUD operations
  const handleCreateProject = () => {
    const newProject = {
      id: Date.now().toString(),
      ...projectForm,
      user_id: user.id,
      created_at: new Date()
    };
    setProjects([...projects, newProject]);
    setProjectForm({ name: "", target_audience: "", output_format: "", status: "in_progress" });
    setIsProjectModalOpen(false);
  };

  const handleUpdateProject = () => {
    setProjects(projects.map(p => 
      p.id === editingProject.id 
        ? { ...editingProject, ...projectForm }
        : p
    ));
    setEditingProject(null);
    setProjectForm({ name: "", target_audience: "", output_format: "", status: "in_progress" });
    setIsProjectModalOpen(false);
  };

  const handleDeleteProject = (projectId) => {
    setProjects(projects.filter(p => p.id !== projectId));
    // Also delete associated datasets
    setDatasets(datasets.filter(d => d.project_id !== projectId));
  };

  const openEditProject = (project) => {
    setEditingProject(project);
    setProjectForm({
      name: project.name,
      target_audience: project.target_audience,
      output_format: project.output_format,
      status: project.status
    });
    setIsProjectModalOpen(true);
  };

  // Dataset CRUD operations
  const handleCreateDataset = () => {
    const newDataset = {
      id: Date.now().toString(),
      user_id: user.id,
      project_id: datasetForm.project_id,
      dataset_name: datasetForm.dataset_name,
      file_size: datasetForm.file ? `${(datasetForm.file.size / 1024 / 1024).toFixed(1)} MB` : "Unknown",
      uploaded_at: new Date()
    };
    setDatasets([...datasets, newDataset]);
    setDatasetForm({ project_id: "", dataset_name: "", file: null });
    setIsDatasetModalOpen(false);
  };

  const handleDeleteDataset = (datasetId) => {
    setDatasets(datasets.filter(d => d.id !== datasetId));
  };

  // Filter projects based on search
  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.target_audience.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const ProjectCard = ({ project }) => (
    <Card className="group relative overflow-hidden bg-white border shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              {getOutputFormatIcon(project.output_format)}
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">{project.name}</CardTitle>
              <CardDescription className="text-sm flex items-center">
                <Target className="w-3 h-3 mr-1" />
                {project.target_audience}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                openEditProject(project);
              }}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteProject(project.id);
              }}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="flex items-center justify-between mb-3">
          <Badge className={`text-xs ${getStatusColor(project.status)}`}>
            {project.status.replace('_', ' ')}
          </Badge>
          <div className="flex items-center text-sm text-gray-500">
            <Calendar className="w-4 h-4 mr-1" />
            {project.created_at.toLocaleDateString()}
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 capitalize">
            {project.output_format} output
          </span>
          <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-purple-500 transition-colors" />
        </div>
      </CardContent>
    </Card>
  );

  const DatasetCard = ({ dataset }) => {
    const project = projects.find(p => p.id === dataset.project_id);
    return (
      <Card className="group bg-white border shadow-md hover:shadow-lg transition-all duration-300">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                <Database className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold">{dataset.dataset_name}</CardTitle>
                <CardDescription className="text-sm">
                  {project ? project.name : 'Unknown Project'}
                </CardDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDeleteDataset(dataset.id)}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>{dataset.file_size}</span>
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              {dataset.uploaded_at.toLocaleDateString()}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Render different pages
  const renderContent = () => {
    switch(currentPage) {
      case 'projects':
        return (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">My Projects</h2>
                <p className="text-gray-600">Manage your marketing projects</p>
              </div>
              <Button
                onClick={() => {
                  setEditingProject(null);
                  setProjectForm({ name: "", target_audience: "", output_format: "", status: "in_progress" });
                  setIsProjectModalOpen(true);
                }}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Project
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          </div>
        );

      case 'datasets':
        return (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">My Datasets</h2>
                <p className="text-gray-600">Manage your data files</p>
              </div>
              <Button
                onClick={() => {
                  setDatasetForm({ project_id: "", dataset_name: "", file: null });
                  setIsDatasetModalOpen(true);
                }}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Dataset
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {datasets.map((dataset) => (
                <DatasetCard key={dataset.id} dataset={dataset} />
              ))}
            </div>
          </div>
        );

      case 'profile':
        return (
          <div className="max-w-2xl mx-auto space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900">Profile</h2>
              <p className="text-gray-600">Manage your account settings</p>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback>{user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-semibold">{user.name}</h3>
                    <p className="text-gray-600">{user.email}</p>
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-purple-600">{projects.length}</div>
                      <div className="text-sm text-gray-600">Projects</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">{datasets.length}</div>
                      <div className="text-sm text-gray-600">Datasets</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return (
          <div className="space-y-12">
            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl p-8 text-white relative overflow-hidden">
              <div className="relative z-10">
                <h2 className="text-3xl font-bold mb-2">Welcome back, {user.name}! 👋</h2>
                <p className="text-purple-100 mb-6">Ready to create something amazing today?</p>
                <div className="flex items-center space-x-8">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{projects.length}</div>
                    <div className="text-purple-200 text-sm">Active Projects</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{datasets.length}</div>
                    <div className="text-purple-200 text-sm">Datasets</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">98%</div>
                    <div className="text-purple-200 text-sm">Success Rate</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Projects */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">Recent Projects</h2>
                  <p className="text-gray-600">Your latest marketing projects</p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage('projects')}
                  className="hover:bg-purple-50"
                >
                  View All <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {projects.slice(0, 3).map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            </section>

            {/* Shared Projects */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">Shared With You</h2>
                  <p className="text-gray-600">Projects your teammates have shared</p>
                </div>
                <Badge variant="secondary" className="bg-blue-50 text-blue-600">
                  2 New
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {sharedProjects.map((project) => (
                  <Card key={project.id} className="bg-white border shadow-md hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${project.gradient} flex items-center justify-center`}>
                          <Folder className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{project.name}</CardTitle>
                          <CardDescription>Shared by {project.owner}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {project.lastEdited}
                        </div>
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  GENMARK
                </h1>
              </div>
              <nav className="hidden md:flex space-x-2">
                {[
                  { id: 'dashboard', label: 'Dashboard' },
                  { id: 'projects', label: 'Projects' },
                  { id: 'datasets', label: 'Datasets' },
                  { id: 'profile', label: 'Profile' }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setCurrentPage(item.id)}
                    className={`px-3 py-2 rounded-lg font-medium transition-colors duration-200 ${
                      currentPage === item.id
                        ? 'text-purple-600 bg-purple-50'
                        : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </nav>
            </div>

            <div className="flex items-center space-x-4">
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search projects..."
                  className="pl-10 w-64"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" />
              </Button>
              <Avatar className="w-10 h-10 cursor-pointer" onClick={() => setCurrentPage('profile')}>
                <AvatarImage src={user.avatar} />
                <AvatarFallback>{user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {renderContent()}
      </main>

      {/* Project Modal */}
      <Dialog open={isProjectModalOpen} onOpenChange={setIsProjectModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingProject ? 'Edit Project' : 'Create New Project'}
            </DialogTitle>
            <DialogDescription>
              {editingProject ? 'Update your project details' : 'Start your next marketing project'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Project Name</label>
              <Input
                value={projectForm.name}
                onChange={(e) => setProjectForm({...projectForm, name: e.target.value})}
                placeholder="Enter project name..."
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Target Audience</label>
              <Input
                value={projectForm.target_audience}
                onChange={(e) => setProjectForm({...projectForm, target_audience: e.target.value})}
                placeholder="e.g., Young Adults 18-35"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Output Format</label>
              <select 
                value={projectForm.output_format} 
                onChange={(e) => setProjectForm({...projectForm, output_format: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="">Select output format</option>
                <option value="image">Image</option>
                <option value="video">Video</option>
                <option value="text">Text</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Status</label>
              <select 
                value={projectForm.status} 
                onChange={(e) => setProjectForm({...projectForm, status: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="draft">Draft</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={() => setIsProjectModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={editingProject ? handleUpdateProject : handleCreateProject}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              <Save className="w-4 h-4 mr-2" />
              {editingProject ? 'Update' : 'Create'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dataset Modal */}
      <Dialog open={isDatasetModalOpen} onOpenChange={setIsDatasetModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Dataset</DialogTitle>
            <DialogDescription>
              Upload a new dataset for your projects
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Project</label>
              <select 
                value={datasetForm.project_id} 
                onChange={(e) => setDatasetForm({...datasetForm, project_id: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="">Select project</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Dataset Name</label>
              <Input
                value={datasetForm.dataset_name}
                onChange={(e) => setDatasetForm({...datasetForm, dataset_name: e.target.value})}
                placeholder="Enter dataset name..."
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">File</label>
              <Input
                type="file"
                onChange={(e) => setDatasetForm({...datasetForm, file: e.target.files[0]})}
                accept=".csv,.xlsx,.json"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={() => setIsDatasetModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateDataset}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;