import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Loader2, ArrowLeft } from "lucide-react";
import { useAuth } from "@/auth/AuthContext";
import axios from "axios";
import {
  getUserDatasets,
  createProjectAndProduct,
  createProjectFormData,
} from "@/lib/api";

const Project = () => {
  const navigate = useNavigate();
  const { user: contextUser } = useAuth();
  const project_name = localStorage.getItem("ProjectName");

  // Loading states
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [datasetsLoading, setDatasetsLoading] = useState(false);

  // User state
  const [user, setUser] = useState(null);

  // Form states
  const [customOutputDescription, setCustomOutputDescription] = useState("");
  const [productName, setProductName] = useState("");
  const [description, setDescription] = useState("");
  const [productUrl, setProductUrl] = useState("");
  const [price, setPrice] = useState("");
  const [discount, setDiscount] = useState("");
  const [productImages, setProductImages] = useState([]);
  const [targetAudience, setTargetAudience] = useState("");

  // Dataset and selection states
  const [datasets, setDatasets] = useState([]);
  const [selectedDataset, setSelectedDataset] = useState("");
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [selectedGender, setSelectedGender] = useState("");

  // Age selection
  const ageOptions = ["ALL", "5-10", "11-18", "19-25", "26-40", "41-60", "60+"];
  const genderOptions = ["male", "female", "both"];
  const [selectedAges, setSelectedAges] = useState([]);
  const isAllSelected = selectedAges.includes("ALL");

  useEffect(() => {
    if (!selectedGender) {
      setSelectedGender("both");
    }

    if (selectedAges.length === 0) {
      setSelectedAges(["ALL"]);
    }
  }, []);


  // Initialize user data
  useEffect(() => {
    if (contextUser) {
      const userData = {
        id: contextUser.id || contextUser.user?.id,
        username: contextUser.username || contextUser.user?.username || "",
        email: contextUser.email || contextUser.user?.email || "",
      };
      console.log("Context User:", userData);
      setUser(userData);
    } else {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          const normalizedUser = {
            id: parsedUser.id || parsedUser.user?.id,
            username: parsedUser.username || parsedUser.user?.username,
            email: parsedUser.email || parsedUser.user?.email,
          };
          console.log("Normalized user:", normalizedUser);
          setUser(normalizedUser);
        } catch (error) {
          console.error("稀 parsing stored user data:", error);
          toast.error("Session expired. Please login again.");
          navigate("/login");
          return;
        }
      } else {
        toast.error("Please login to continue.");
        navigate("/login");
        return;
      }
    }
    setLoading(false);
  }, [contextUser, navigate]);

  // Check project name and redirect if not found
  useEffect(() => {
    if (!loading && project_name === null) {
      toast.error("Unknown Project", {
        description: "Please try again.",
      });
      setTimeout(() => {
        navigate("/dashboard");
      }, 1000);
    }
  }, [project_name, navigate, loading]);

  // Fetch datasets when component mounts
  useEffect(() => {
    const fetchDatasets = async () => {
      if (!user) return;

      setDatasetsLoading(true);
      try {
        const response = await getUserDatasets(user.id);
        console.log("Got User datasets");
        setDatasets(
          Array.isArray(response.data)
            ? response.data
            : response.data.datasets || []
        );
      } catch (error) {
        console.error("Error fetching datasets:", error);
        toast.error("Failed to load datasets");
      } finally {
        setDatasetsLoading(false);
      }
    };

    fetchDatasets();
  }, [user]);

  // Update categories and locations when dataset changes
  useEffect(() => {
    const selected = datasets.find((d) => d.dataset_name === selectedDataset);
    if (selected) {
      const newCategories = selected.categories || [];
      const newLocations = selected.locations || [];

      setCategories(newCategories);
      setLocations(newLocations);

      if (!category && newCategories.length > 0) {
        setCategory(newCategories[0]);
      }

      if (!location && newLocations.length > 0) {
        setLocation(newLocations[0]);
      }
    } else {
      setCategories([]);
      setLocations([]);
    }
  }, [selectedDataset, datasets]);

  // Update target audience when selections change
  useEffect(() => {
    const ageStr = isAllSelected ? "ALL Ages" : selectedAges.join(", ");
    const genderStr = selectedGender || "Not specified";
    const locationStr = location || "Not specified";
    const categoryStr = category || "Not specified";

    const combined = `Category: ${categoryStr} | Location: ${locationStr} | Gender: ${genderStr} | Ages: ${ageStr}`;
    setTargetAudience(combined);
  }, [category, location, selectedGender, selectedAges, isAllSelected]);

  // Age selection handler
  const toggleAge = (age) => {
    if (age === "ALL") {
      setSelectedAges((prev) => (prev.includes("ALL") ? [] : ["ALL"]));
    } else {
      setSelectedAges((prev) => {
        const withoutAll = prev.filter((a) => a !== "ALL");
        return withoutAll.includes(age)
          ? withoutAll.filter((a) => a !== age)
          : [...withoutAll, age];
      });
    }
  };

  // Form validation
  const validateForm = () => {
    const errors = [];

    if (!productName.trim()) errors.push("Product name is required");
    if (!description.trim()) errors.push("Description is required");
    if (!price || parseFloat(price) <= 0)
      errors.push("Valid price is required");
    if (!discount || parseFloat(discount) < 0 || parseFloat(discount) > 100) {
      errors.push("Discount must be between 0 and 100");
    }
    if (!productUrl.trim()) {
      errors.push("Product Url is required");
    }
    if (!selectedDataset) errors.push("Please select a dataset");
    if (!category) errors.push("Please select a category");
    if (!location) errors.push("Please select a location");
    if (!selectedGender) errors.push("Please select a gender");
    if (selectedAges.length === 0)
      errors.push("Please select at least one age range");
    if (!customOutputDescription.trim())
      errors.push("Output format description is required");
    if (productImages.length === 0)
      errors.push("Please upload at least one product image");

    return errors;
  };

  // Handle project creation
  const handleGenerate = async () => {
    if (!user || !user.id) {
      toast.error("User not found. Please login again.");
      navigate("/login");
      return;
    }

    const validationErrors = validateForm();

    if (validationErrors.length > 0) {
      toast.error("Please fix the following errors:", {
        description: validationErrors.join(", "),
      });
      return;
    }

    setCreating(true);

    try {
      const projectData = {
        userId: user.id,
        name: project_name,
        targetAudience,
        selectedDataset: selectedDataset,
        outputFormat: customOutputDescription,
        productName,
        description,
        productUrl,
        price,
        discount,
        productImages,
      };
      const formData = createProjectFormData(projectData);
      const response = await createProjectAndProduct(formData);

      toast.success("Project created successfully!", {
        description: "Your marketing content is being generated.",
      });

      console.log("Project created:", response);

      setTimeout(() => {
        navigate("/preview", {
          state: {
            name: user.username,
            selected_dataset: selectedDataset,
            user_id: user.id,
            projectName: project_name,
            project_id: response.data.project_id,
          },
        });
      }, 1000);
    } catch (error) {
      console.error("Error creating project:", error);
      toast.error("Failed to create project", {
        description: error.message || "Please try again.",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleAutofillFromUrl = async () => {
  if (!productUrl) {
    alert("Please enter a valid product URL first.");
    return;
  }

  try {
    const res = await axios.get(
      `https://genmark-mzoy.onrender.com/scrape-product`,
      { params: { url: productUrl } }
    );
    const data = res.data;

    setProductName(data.product_name || "");
    setPrice(data.price || "");
    setDescription(data.description || "");

    if (data.image) {
      const imgBlob = await fetch(data.image).then(r => r.blob());
      const file = new File([imgBlob], "product.jpg", { type: imgBlob.type });
      setProductImages([file]);
    }
  } catch (err) {
    console.error(err);
    alert("Could not fetch product details. The website might be blocking scraping.");
  }
};


  // Handle file upload
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter((file) => {
      const isValid = file.type.startsWith("image/");
      if (!isValid) {
        toast.error(`${file.name} is not a valid image file`);
      }
      return isValid;
    });

    setProductImages(validFiles);

    if (validFiles.length > 0) {
      toast.success(`${validFiles.length} image(s) uploaded successfully`);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen w-screen bg-gradient-to-br from-purple-300 via-pink-400 to-indigo-300 flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 shadow-2xl">
          <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600 text-center">Loading Project...</p>
        </div>
      </div>
    );
  }

  // Prevent rendering if no project name
  if (project_name === null) return null;

  return (
    <div className="min-h-screen w-screen bg-gradient-to-br from-purple-300 via-pink-400 to-indigo-300 font-sans p-6 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-4xl font-extrabold text-purple-700 tracking-tight">
            GenMark
          </h1>
          <p className="text-font-bold mt-1">
            🎯 Personalized Marketing Studio
          </p>
          <p className="text-purple-600 font-medium mt-2">
            Project: {project_name}
          </p>
        </div>
        <div>
          <button
            className="bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white font-semibold py-2 px-6 rounded-3xl shadow-md hover:from-purple-700 hover:to-fuchsia-700 transition-all duration-200 flex items-center gap-2"
            onClick={() => {
              localStorage.removeItem("ProjectName");
              navigate("/dashboard");
            }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product Details Card */}
        <Card className="bg-white/80 backdrop-blur-lg border border-purple-200 shadow-2xl hover:shadow-purple-300 transition-shadow duration-300 rounded-2xl p-6">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-bold text-purple-700 flex items-center justify-center gap-2">
              <span className="w-9 h-9 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-lg">
                📦
              </span>
              Product Details
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-5">
            {/* Product Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Name *
              </label>
              <input
                type="text"
                placeholder="e.g., AI Marketing Bot"
                value={productName}
                className="w-full p-3 bg-white rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                onChange={(e) => setProductName(e.target.value)}
              />
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price *
              </label>
              <input
                type="number"
                placeholder="Enter price"
                value={price}
                min="0"
                step="0.01"
                className="w-full p-3 bg-white rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>

            {/* Discount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Discount (%) *
              </label>
              <input
                type="number"
                placeholder="Enter discount percentage"
                min="0"
                max="100"
                value={discount}
                className="w-full p-3 bg-white rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                onChange={(e) => {
                  const value = Number(e.target.value);
                  if (value >= 0 && value <= 100) {
                    setDiscount(e.target.value);
                  } else if (e.target.value === "") {
                    setDiscount("");
                  }
                }}
              />
            </div>

            {/* Product URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product URL *
              </label>
              <input
                type="text"
                placeholder="https://www.example.com/product"
                value={productUrl}
                className="w-full p-3 bg-white rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                onChange={(e) => setProductUrl(e.target.value)}
              />
              <Button
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl"
                onClick={handleAutofillFromUrl}
              >
                Autofill from URL
              </Button>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                placeholder="Write a detailed description of your product..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full p-3 bg-white rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition resize-none"
              />
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Product Images *
              </label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileUpload}
                className="block w-full text-sm text-gray-600
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:bg-gradient-to-r file:from-purple-500 file:to-pink-500
                file:text-white hover:file:from-purple-600 hover:file:to-pink-600
                file:transition-all file:duration-200"
              />
              {productImages.length > 0 && (
                <p className="text-sm text-green-600 mt-2">
                  {productImages.length} image(s) selected
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Target Audience Card */}
        <Card className="bg-white/70 backdrop-blur-sm border border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl p-6 space-y-6">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-bold text-purple-600">
              🎯 Target Audience
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Dataset Selection */}
            <div>
              <h3 className="text-lg font-semibold text-orange-600 mb-1">
                📊 Choose Dataset *
              </h3>
              {datasetsLoading ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="w-6 h-6 animate-spin text-orange-600" />
                  <span className="ml-2 text-gray-600">
                    Loading datasets...
                  </span>
                </div>
              ) : (
                <Select
                  onValueChange={(value) => setSelectedDataset(value)}
                  value={selectedDataset}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a dataset" />
                  </SelectTrigger>
                  <SelectContent>
                    {datasets.map((ds) => (
                      <SelectItem key={ds.dataset_name} value={ds.dataset_name}>
                        {ds.dataset_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Age Range */}
            <div>
              <h3 className="text-lg font-semibold text-orange-600 mb-2">
                🔞 Age Range *
              </h3>
              <div className="flex flex-wrap gap-2">
                {ageOptions.map((age) => {
                  const isSelected = selectedAges.includes(age);
                  const isDisabled = isAllSelected && age !== "ALL";

                  return (
                    <button
                      key={age}
                      onClick={() => toggleAge(age)}
                      disabled={isDisabled}
                      className={`px-4 py-2 rounded-full border transition 
                        ${
                          isSelected
                            ? "bg-orange-600 text-white border-orange-600"
                            : "bg-white text-gray-800 border-gray-300 hover:bg-orange-100"
                        }
                        ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}
                      `}
                    >
                      {age}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Category */}
            <div>
              <h3 className="text-lg font-semibold text-orange-600 mb-1">
                📚 Category *
              </h3>
              <Select
                disabled={!selectedDataset || categories.length === 0}
                onValueChange={setCategory}
                value={category}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Location */}
            <div>
              <h3 className="text-lg font-semibold text-orange-600 mb-1">
                📍 Location *
              </h3>
              <Select
                disabled={!selectedDataset || locations.length === 0}
                onValueChange={setLocation}
                value={location}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((loc) => (
                    <SelectItem key={loc} value={loc}>
                      {loc}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Gender */}
            <div>
              <h3 className="text-lg font-semibold text-pink-600 mb-2">
                👤 Gender *
              </h3>
              <div className="flex flex-wrap gap-2">
                {genderOptions.map((gender) => (
                  <button
                    key={gender}
                    onClick={() => setSelectedGender(gender)}
                    className={`px-4 py-2 rounded-full border transition capitalize
                      ${
                        selectedGender === gender
                          ? "bg-pink-600 text-white border-pink-600"
                          : "bg-white text-gray-800 border-gray-300 hover:bg-pink-100"
                      }`}
                  >
                    {gender}
                  </button>
                ))}
              </div>
            </div>

            {/* Target Audience Preview */}
            {targetAudience && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="text-sm font-medium text-blue-800 mb-1">
                  Target Audience Preview:
                </h4>
                <p className="text-sm text-blue-700">{targetAudience}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Output Format Card */}
        <Card className="bg-white/80 backdrop-blur-md border border-indigo-200 shadow-xl hover:shadow-indigo-300 transition-all duration-300 rounded-2xl">
          <CardHeader className="text-center pb-2 pt-6">
            <CardTitle className="text-2xl font-bold text-indigo-700 flex items-center justify-center gap-3">
              <span className="w-9 h-9 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white text-lg">
                🎨
              </span>
              Output Format
            </CardTitle>
            <p className="text-sm text-gray-500 mt-2">
              Customize how your AI-generated content should look.
            </p>
          </CardHeader>

          <CardContent className="px-6 pb-6">
            <div className="space-y-2">
              <label
                htmlFor="output-description"
                className="block text-sm font-medium text-gray-700"
              >
                💭 Describe your custom output format *
              </label>
              <Textarea
                id="output-description"
                className="w-full bg-white/90 text-gray-800 p-4 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-300 transition-all duration-200 shadow-sm placeholder-gray-400"
                placeholder="e.g., 'A catchy social media post with emojis, compelling headline, and call-to-action for Instagram targeting young professionals aged 25-35.'"
                rows={6}
                value={customOutputDescription}
                onChange={(e) => setCustomOutputDescription(e.target.value)}
              />
              <p className="text-xs text-gray-500">
                Tip: Be specific about tone, format, platform, style, and target
                audience preferences.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Generate Button */}
      <div className="flex justify-center mt-10">
        <Button
          onClick={handleGenerate}
          disabled={creating}
          className="text-white px-12 py-4 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg transition-all duration-200 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
        >
          {creating ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              Creating Project...
            </>
          ) : (
            <>🚀 Generate Marketing Content</>
          )}
        </Button>
      </div>

      {/* Required Fields Notice */}
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          * Required fields must be filled before generating content
        </p>
      </div>
    </div>
  );
};

export default Project;
