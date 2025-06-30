import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
// import AudienceSelector from "@/components/AudienceSelector";
import { Textarea } from "@/components/ui";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"; // adjust if needed
import axios from "axios";

const Project = () => {
  const navigate = useNavigate();
  const project_name = localStorage.getItem("ProjectName");

  useEffect(() => {
    if (project_name === null) {
      toast.error("Unknown Project", {
        description: "Please try again.",
      });

      setTimeout(() => {
        navigate("/dashboard");
      }, 1000); // wait 2 seconds before navigating
    }
  }, [project_name, navigate]);

  if (project_name === null) return null; // prevent rendering until redirect

  const user_data = localStorage.getItem("user");
  const user = JSON.parse(user_data);
  const [customOutputDescription, setCustomOutputDescription] = useState("");
  const [productName, setProductName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [discount, setDiscount] = useState("");
  const [productImages, setProductImages] = useState([]);
  const [targetAudience, setTargetAudience] = useState("");

  const [datasets, setDatasets] = useState([]);
  const [selectedDataset, setSelectedDataset] = useState(null);
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [selectedGender, setSelectedGender] = useState("");
  const ageOptions = ["ALL", "5-10", "11-18", "19-25", "26-40", "41-60", "60+"];
  const genderOptions = ["male", "female", "both"];
  const [selectedAges, setSelectedAges] = useState([]);
  const isAllSelected = selectedAges.includes("ALL");

  const toggleAge = (age) => {
    if (age === "ALL") {
      // Selecting "ALL" clears others and selects only "ALL"
      setSelectedAges((prev) => (prev.includes("ALL") ? [] : ["ALL"]));
    } else {
      // If "ALL" was selected before, remove it
      setSelectedAges((prev) => {
        const withoutAll = prev.filter((a) => a !== "ALL");
        return withoutAll.includes(age)
          ? withoutAll.filter((a) => a !== age)
          : [...withoutAll, age];
      });
    }
  };

  useEffect(() => {
    const fetchDatasets = async () => {
      try {
        const res = await axios.get("/api/datasets/");
        setDatasets(res.data);
      } catch (err) {
        console.error("Error fetching datasets:", err);
      }
    };
    fetchDatasets();
  }, []);

  useEffect(() => {
    const selected = datasets.find((d) => d.dataset_name === selectedDataset);
    if (selected) {
      setCategories(selected.categories || []);
      setLocations(selected.locations || []);
    }
  }, [selectedDataset, datasets]);

  useEffect(() => {
    const ageStr = isAllSelected ? "ALL Ages" : selectedAges.join(", ");
    const genderStr = selectedGender;
    const locationStr = location;
    const categoryStr = category;

    const combined = `Category: ${categoryStr} | Location: ${locationStr} | Gender: ${genderStr} | Ages: ${ageStr}`;
    setTargetAudience(combined);
  }, [category, location, selectedGender, selectedAges]);

  const handleGenerate = async () => {
    if (
      !productName ||
      !description ||
      !price ||
      !discount ||
      !selectedDataset ||
      !category ||
      !location ||
      !selectedGender ||
      !customOutputDescription ||
      productImages.length === 0 ||
      !targetAudience
    ) {
      toast.error("All fields are required");
      return;
    }

    const formData = new FormData();
    formData.append("user_id", user.username); // or however you're storing it
    formData.append("name", project_name);
    formData.append("target_audience", targetAudience); // from AudienceSelector
    formData.append("output_format", customOutputDescription);
    formData.append("product_name", productName);
    formData.append("description", description);
    formData.append("price", price);
    formData.append("discount", discount);

    productImages.forEach((file) => {
      formData.append("product_images", file);
    });

    try {
      const response = await fetch("/api/project/create", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Failed to create project");

      const data = await response.json();
      toast.success("Project created successfully!");
      console.log(data); // maybe store project_id?
    } catch (error) {
      toast.error("Error creating project", {
        description: error.message,
      });
    }
  };

  return (
    <div className="min-h-screen w-screen bg-gradient-to-br from-purple-300 via-pink-400 to-indigo-300 font-sans p-6 overflow-hidden">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-4xl font-extrabold text-purple-700 tracking-tight">
            GenMark
          </h1>
          <p className="text-font-bold mt-1 ">
            🎯Personalized Marketing Studio
          </p>
        </div>
        <div>
          <button
            className="bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white font-semibold py-2 px-6 rounded-3xl shadow-md hover:from-purple-700 hover:to-fuchsia-700 transition-all duration-200"
            onClick={() => {
              localStorage.removeItem("ProjectName");
              navigate("/dashboard");
            }}
          >
            🧠 Back to Dashboard
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                Product Name
              </label>
              <input
                type="text"
                placeholder="e.g., AI Marketing Bot"
                value={productName}
                className="w-full p-3 bg-white rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                onChange={(e) => setProductName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price
              </label>
              <input
                type="number"
                placeholder="$"
                value={price}
                className="no-spinner w-full p-3 bg-white rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Discount
              </label>
              <input
                type="number"
                placeholder="%"
                min="0"
                max="100"
                value={discount}
                className="no-spinner w-full p-3 bg-white rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
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

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                placeholder="Write a short description..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full p-3 bg-white rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition resize-none"
              />
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Images
              </label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => setProductImages(Array.from(e.target.files))}
                className="block w-full text-sm text-gray-600
          file:mr-4 file:py-2 file:px-4
          file:rounded-full file:border-0
          file:bg-gradient-to-r file:from-purple-500 file:to-pink-500
          file:text-white hover:file:from-purple-600 hover:file:to-pink-600
          file:transition-all file:duration-200"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/70 backdrop-blur-sm border border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl p-6 space-y-6">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-bold text-purple-600">
              🎯 Target Audience
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Dataset */}
            <div>
              <h3 className="text-lg font-semibold text-orange-600 mb-1">
                📊 Choose Dataset
              </h3>
              <Select onValueChange={(value) => setSelectedDataset(value)}>
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
            </div>

            {/* Age Range */}
            <div>
              <h3 className="text-lg font-semibold text-orange-600 mb-2">
                🔞 Age Range
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
                📚 Category
              </h3>
              <Select
                disabled={!selectedDataset || categories.length === 0}
                onValueChange={setCategory}
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
                📍 Location
              </h3>
              <Select
                disabled={!selectedDataset || locations.length === 0}
                onValueChange={setLocation}
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
                👤 Gender
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
          </CardContent>
        </Card>

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
            {/* Custom Output Description */}
            <div className="space-y-2">
              <label
                htmlFor="output-description"
                className="block text-sm font-medium text-gray-700"
              >
                💭 Describe your custom output format
              </label>
              <Textarea
                id="output-description"
                className="w-full bg-white/90 text-gray-800 p-4 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-300 transition-all duration-200 shadow-sm placeholder-gray-400"
                placeholder="e.g., 'A catchy tweet with emojis and a matching image for Gen Z audiences.'"
                rows={4}
                value={customOutputDescription}
                onChange={(e) => setCustomOutputDescription(e.target.value)}
              />
              <p className="text-xs text-gray-500">
                Tip: Be specific about tone, format, media, or audience.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      {/* CTA Button */}
      <div className="flex justify-center mt-10">
        <Button
          onClick={handleGenerate}
          className="text-white px-8 py-3 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg transition"
        >
          🚀 Generate
        </Button>
      </div>
    </div>
  );
};

export default Project;
