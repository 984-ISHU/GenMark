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
import { Loader2, ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react"; // <-- Icons added
import { useAuth } from "@/auth/AuthContext";
import axios from "axios";
import {
  getUserDatasets,
  createProjectAndProduct,
  createProjectFormData,
  getUserProductDatasets,
  getProductDatasetContent,
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

  // Product DB selection and slider states
  const [productDatasets, setProductDatasets] = useState([]);
  const [selectedProductDataset, setSelectedProductDataset] = useState("");
  const [productDatasetContent, setProductDatasetContent] = useState([]);
  const [currentProductIndex, setCurrentProductIndex] = useState(0); // <-- Tracks slider index
  const [productDbLoading, setProductDbLoading] = useState(false);
  const [productContentLoading, setProductContentLoading] = useState(false);

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
          setUser(normalizedUser);
        } catch (error) {
          console.error("Error parsing stored user data:", error);
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

  // Fetch all datasets when user is available
  useEffect(() => {
    const fetchAllDatasets = async () => {
      if (!user) return;
  
      setDatasetsLoading(true);
      try {
        const response = await getUserDatasets(user.id);
        setDatasets(Array.isArray(response.data) ? response.data : response.data.datasets || []);
      } catch (error) {
        console.error("Error fetching datasets:", error);
        toast.error("Failed to load user datasets");
      } finally {
        setDatasetsLoading(false);
      }
  
      setProductDbLoading(true);
      try {
        const response = await getUserProductDatasets(user.id);
        setProductDatasets(response.data || []);
      } catch (error) {
        console.error("Error fetching product datasets:", error);
        toast.error("Failed to load product datasets");
      } finally {
        setProductDbLoading(false);
      }
    };
  
    fetchAllDatasets();
  }, [user]);
  
  // Fetch content when a product dataset is selected
  useEffect(() => {
    const fetchProductContent = async () => {
      if (!selectedProductDataset) {
        setProductDatasetContent([]);
        return;
      }
  
      const selectedDb = productDatasets.find((db) => db.id === selectedProductDataset);
      if (!selectedDb) return;
  
      setProductContentLoading(true);
      try {
        const response = await getProductDatasetContent(selectedDb.id);
        setProductDatasetContent(response.data || []);
        setCurrentProductIndex(0); // Reset slider to the first product
      } catch (error) {
        console.error("Error fetching product dataset content:", error);
        toast.error("Failed to load products from dataset");
        setProductDatasetContent([]);
      } finally {
        setProductContentLoading(false);
      }
    };
    fetchProductContent();
  }, [selectedProductDataset, productDatasets]);

  // Autofill form when slider index changes
  useEffect(() => {
    if (productDatasetContent.length > 0 && currentProductIndex >= 0 && currentProductIndex < productDatasetContent.length) {
      const product = productDatasetContent[currentProductIndex];
  
      if (product) {
        setProductName(product.product_name || "");
        setPrice(String(product.dollars) || "");
        setDiscount(String(product.discount) || "");
        setProductUrl(product.product_url || "");
        setDescription(product.description || "");
        setProductImages([]); // Clear any manually uploaded images
      }
    } else {
      // Clear form if no product is selected or content is empty
      setProductName("");
      setPrice("");
      setDiscount("");
      setProductUrl("");
      setDescription("");
    }
  }, [currentProductIndex, productDatasetContent]);

  // Update categories and locations when dataset changes
  useEffect(() => {
    const selected = datasets.find((d) => d.dataset_name === selectedDataset);
    if (selected) {
      const newCategories = selected.categories || [];
      const newLocations = selected.locations || [];
      setCategories(newCategories);
      setLocations(newLocations);
      if (!category && newCategories.length > 0) setCategory(newCategories[0]);
      if (!location && newLocations.length > 0) setLocation(newLocations[0]);
    } else {
      setCategories([]);
      setLocations([]);
    }
  }, [selectedDataset, datasets]);

  // Update target audience preview
  useEffect(() => {
    const ageStr = isAllSelected ? "ALL Ages" : selectedAges.join(", ");
    const genderStr = selectedGender || "Not specified";
    const locationStr = location || "Not specified";
    const categoryStr = category || "Not specified";
    const combined = `Category: ${categoryStr} | Location: ${locationStr} | Gender: ${genderStr} | Ages: ${ageStr}`;
    setTargetAudience(combined);
  }, [category, location, selectedGender, selectedAges, isAllSelected]);

  // Handlers
  const handleNextProduct = () => {
    setCurrentProductIndex((prev) => (prev + 1) % productDatasetContent.length);
  };
  
  const handlePrevProduct = () => {
    setCurrentProductIndex((prev) => (prev - 1 + productDatasetContent.length) % productDatasetContent.length);
  };

  const toggleAge = (age) => {
    if (age === "ALL") {
      setSelectedAges((prev) => (prev.includes("ALL") ? [] : ["ALL"]));
    } else {
      setSelectedAges((prev) => {
        const withoutAll = prev.filter((a) => a !== "ALL");
        return withoutAll.includes(age) ? withoutAll.filter((a) => a !== age) : [...withoutAll, age];
      });
    }
  };

  const validateForm = () => {
    // ... (validation logic remains the same)
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
    if (!selectedDataset) errors.push("Please select a user dataset");
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

  const handleGenerate = async () => {
    // ... (generation logic remains the same)
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

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter((file) => file.type.startsWith("image/"));
    setProductImages(validFiles);
    if (validFiles.length > 0) toast.success(`${validFiles.length} image(s) uploaded successfully`);
  };

  // Loading and initial states
  if (loading) {
    return (
      <div className="min-h-screen w-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800 font-sans flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 shadow-2xl">
          <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600 text-center">Loading Project...</p>
        </div>
      </div>
    );
  }

  if (project_name === null) return null;

  const renderProductSlider = () => {
    if (!selectedProductDataset) return null;
  
    if (productContentLoading) {
      return <div className="flex items-center justify-center h-48"><Loader2 className="w-8 h-8 animate-spin text-purple-500" /></div>;
    }
  
    if (productDatasetContent.length === 0) {
      return <p className="text-center text-sm text-gray-500 py-4">No products found in this dataset.</p>;
    }
    
    // Safely parse image URL from the stringified array format
    let imageUrl = "";
    try {
        const imageString = productDatasetContent[currentProductIndex]?.image;
        if(imageString) imageUrl = JSON.parse(imageString)[0];
    } catch (e) {
        console.error("Could not parse image URL:", e);
    }
  
    return (
      <div className="relative space-y-2">
        <div className="flex items-center justify-center space-x-2">
          <Button onClick={handlePrevProduct} size="icon" variant="ghost" disabled={productDatasetContent.length <= 1}>
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <div className="flex-grow text-center overflow-hidden w-full">
            <div className="bg-purple-100 rounded-lg p-2 flex flex-col items-center gap-2">
              <img
                key={currentProductIndex} // Add key to force re-render on change
                src={imageUrl}
                alt={productDatasetContent[currentProductIndex]?.product_name}
                className="w-full h-32 object-contain rounded-md animate-fade-in"
                onError={(e) => { e.target.onerror = null; e.target.src='https://via.placeholder.com/150?text=No+Image'; }}
              />
              <p className="text-sm font-semibold text-purple-800 truncate">
                {productDatasetContent[currentProductIndex]?.product_name}
              </p>
            </div>
          </div>
          <Button onClick={handleNextProduct} size="icon" variant="ghost" disabled={productDatasetContent.length <= 1}>
            <ChevronRight className="h-6 w-6" />
          </Button>
        </div>
        <p className="text-xs text-center text-gray-500">
          {currentProductIndex + 1} / {productDatasetContent.length}
        </p>
      </div>
    );
  };
  

  return (
    <div className="min-h-screen w-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800 font-sans p-6 overflow-hidden">
      {/* Header */}
      <div className="fixed top-0 inset-x-0 bg-black/20 backdrop-blur-lg border-b border-white/10 z-50 overflow-x-hidden">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-extrabold text-white tracking-tight">GenMark</h1>
              <p className="text-white/90 mt-1 font-medium">🎯 Personalized Marketing Studio</p>
            </div>
            <div className="flex items-center gap-4">
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
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6 scale-75">
        {/* Product Details Card */}
        <Card className="bg-[rgb(216,205,255)] backdrop-blur-lg border border-purple-200 shadow-2xl hover:shadow-purple-300 transition-shadow duration-300 rounded-2xl p-6">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-bold text-purple-700 flex items-center justify-center gap-2">
              <span className="w-9 h-9 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-lg">📦</span>
              Product Details
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-5">
            {/* START: New Product Slider Section */}
            <div className="space-y-3 bg-purple-50 p-4 rounded-xl border border-purple-200">
                <label className="block text-sm font-medium text-gray-700">
                    Autofill from Product DB
                </label>
                {productDbLoading ? (
                  <div className="flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin"/></div>
                ) : (
                  <Select onValueChange={setSelectedProductDataset} value={selectedProductDataset}>
                      <SelectTrigger><SelectValue placeholder="Select a Product DB" /></SelectTrigger>
                      <SelectContent>
                          {productDatasets.map((db) => (
                              <SelectItem key={db.id} value={db.id}>{db.dataset_name}</SelectItem>
                          ))}
                      </SelectContent>
                  </Select>
                )}
                {renderProductSlider()}
                <p className="text-xs text-center text-gray-500 pt-2">... or enter details manually below.</p>
            </div>
            {/* END: New Product Slider Section */}

            {/* Product Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
              <input type="text" placeholder="e.g., AI Marketing Bot" value={productName} className="w-full p-3 bg-white rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition" onChange={(e) => setProductName(e.target.value)} />
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price *</label>
              <input type="number" placeholder="Enter price" value={price} min="0" step="0.01" className="w-full p-3 bg-white rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition appearance-none" onChange={(e) => setPrice(e.target.value)} />
            </div>

            {/* Discount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Discount (%) *</label>
              <input type="number" placeholder="Enter discount percentage" min="0" max="100" value={discount} className="w-full p-3 bg-white rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition" onChange={(e) => { const value = Number(e.target.value); if (value >= 0 && value <= 100) setDiscount(e.target.value); else if (e.target.value === "") setDiscount(""); }} />
            </div>

            {/* Product URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product URL *</label>
              <input type="text" placeholder="https://www.example.com/product" value={productUrl} className="w-full p-3 bg-white rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition" onChange={(e) => setProductUrl(e.target.value)} />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
              <textarea placeholder="Write a detailed description of your product..." value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="w-full p-3 bg-white rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition resize-none" />
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Upload Product Images *</label>
              <input type="file" multiple accept="image/*" onChange={handleFileUpload} className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-gradient-to-r file:from-purple-500 file:to-pink-500 file:text-white hover:file:from-purple-600 hover:file:to-pink-600 file:transition-all file:duration-200" />
              {productImages.length > 0 && <p className="text-sm text-green-600 mt-2">{productImages.length} image(s) selected</p>}
            </div>
          </CardContent>
        </Card>

        {/* Target Audience Card */}
        <Card className="bg-[rgb(216,205,255)] backdrop-blur-sm border border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl p-6 space-y-6">
          <CardHeader className="text-center pb-4"><CardTitle className="text-2xl font-bold text-purple-600">🎯 Target Audience</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            {/* Dataset Selection */}
            <div>
              <h3 className="text-lg font-semibold text-orange-600 mb-1">📊 Choose User Dataset *</h3>
              {datasetsLoading ? (
                <div className="flex items-center justify-center p-4"><Loader2 className="w-6 h-6 animate-spin text-orange-600" /><span className="ml-2 text-gray-600">Loading datasets...</span></div>
              ) : (
                <Select onValueChange={(value) => setSelectedDataset(value)} value={selectedDataset}>
                  <SelectTrigger className="w-full bg-white/90"><SelectValue placeholder="Select a user dataset" /></SelectTrigger>
                  <SelectContent>{datasets.map((ds) => (<SelectItem key={ds.dataset_name} value={ds.dataset_name}>{ds.dataset_name}</SelectItem>))}</SelectContent>
                </Select>
              )}
            </div>
            {/* Age Range, Category, Location, Gender, etc. remain the same */}
            <div>
              <h3 className="text-lg font-semibold text-orange-600 mb-2">🔞 Age Range *</h3>
              <div className="flex flex-wrap gap-2">
                {ageOptions.map((age) => {
                  const isSelected = selectedAges.includes(age);
                  const isDisabled = isAllSelected && age !== "ALL";
                  return (<button key={age} onClick={() => toggleAge(age)} disabled={isDisabled} className={`px-4 py-2 rounded-full border transition ${ isSelected ? "bg-orange-600 text-white border-orange-600" : "bg-white text-gray-800 border-gray-300 hover:bg-orange-100"} ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}`}>{age}</button>);
                })}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-orange-600 mb-1">📚 Category *</h3>
              <Select disabled={!selectedDataset || categories.length === 0} onValueChange={setCategory} value={category}>
                <SelectTrigger className="w-full bg-white/90"><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>{categories.map((cat) => (<SelectItem key={cat} value={cat}>{cat}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-orange-600 mb-1">📍 Location *</h3>
              <Select disabled={!selectedDataset || locations.length === 0} onValueChange={setLocation} value={location}>
                <SelectTrigger className="w-full bg-white/90"><SelectValue placeholder="Select location" /></SelectTrigger>
                <SelectContent>{locations.map((loc) => (<SelectItem key={loc} value={loc}>{loc}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-pink-600 mb-2">👤 Gender *</h3>
              <div className="flex flex-wrap gap-2">
                {genderOptions.map((gender) => (<button key={gender} onClick={() => setSelectedGender(gender)} className={`px-4 py-2 rounded-full border transition capitalize ${ selectedGender === gender ? "bg-pink-600 text-white border-pink-600" : "bg-white text-gray-800 border-gray-300 hover:bg-pink-100"}`}>{gender}</button>))}
              </div>
            </div>
            {targetAudience && (<div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200"><h4 className="text-sm font-medium text-blue-800 mb-1">Target Audience Preview:</h4><p className="text-sm text-blue-700">{targetAudience}</p></div>)}
          </CardContent>
        </Card>

        {/* Output Format Card */}
        <Card className="bg-[rgb(216,205,255)] backdrop-blur-md border border-indigo-200 shadow-xl hover:shadow-indigo-300 transition-all duration-300 rounded-2xl text-sm sm:text-base">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-bold text-indigo-700 flex items-center justify-center gap-3">
              <span className="w-9 h-9 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white text-lg">🎨</span>
              Output Format
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <div className="space-y-2">
              <label htmlFor="output-description" className="block text-l font-medium text-gray-700">💭 Describe your custom output format *</label>
              <Textarea id="output-description" className="w-full bg-white/90 text-xl text-gray-800 p-4 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-300 transition-all duration-200 shadow-sm placeholder-gray-400" placeholder="e.g., 'A catchy social media post with emojis...'" rows={6} value={customOutputDescription} onChange={(e) => setCustomOutputDescription(e.target.value)} />
              <p className="text-l text-gray-500">Tip: Be specific about tone, format, platform, style, and target audience preferences.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Generate Button */}
      <div className="mt-8 flex flex-col items-center justify-center space-y-4">
        <Button onClick={handleGenerate} disabled={creating} className="w-full max-w-md text-white py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg transition-all duration-200 text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3">
          {creating ? (<><Loader2 className="w-6 h-6 animate-spin" />Creating Project...</>) : (<>🚀 Generate Marketing Content</>)}
        </Button>
        <p className="text-sm text-white/50 text-center">* Required fields must be filled before generating content</p>
      </div>
    </div>
  );
};

export default Project;