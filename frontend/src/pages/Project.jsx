import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Button,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Input,
  Textarea,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Checkbox,
} from "../components/ui";

import heirSeriesImage from '../assets/products/JORDAN+HEIR+SERIES+PF.avif';
import Luka77Image from '../assets/products/JORDAN+LUKA+.77+PF.avif';
import Luka4Image from '../assets/products/JORDAN+LUKA+4+PF.avif';
import Tatum3Image from '../assets/products/JORDAN+TATUM+3+PF.avif';
import Tatum3Image1 from '../assets/products/JORDAN+TATUM+3+PF (1).avif';
import Zion4Image from '../assets/products/JORDAN+ZION+4+PF.avif';


const Project = () => {
  const navigate = useNavigate();
  const [productId, setProductId] = useState("");
  const [selectedModels, setSelectedModels] = useState({
    text: "GPT-4",
    image: "Stable Diffusion",
    video: "RunwayML",
  });
  const [selectedOutputFormat, setSelectedOutputFormat] = useState("");
  const [customOutputDescription, setCustomOutputDescription] = useState("");
  const [showAllProducts, setShowAllProducts] = useState(false);

  const products = [
  { id: "1", name: "HEIR SERIES", image: heirSeriesImage},
  { id: "2", name: "LUKA .77", image: Luka77Image },
  { id: "3", name: "LUKA 4", image: Luka4Image },
  { id: "4", name: "TATUM 3", image: Tatum3Image},
  { id: "5", name: "TATUM 3", image: Tatum3Image1 },
  { id: "6", name: "ZION 4", image: Zion4Image},
];

  const outputFormats = [
    { id: "email-image", name: "📧 Email with Image" },
    { id: "text-only", name: "📝 Text Only" },
    { id: "email-video", name: "📧 Email with Video" },
    { id: "image-only", name: "🖼️ Image Only" },
    { id: "social-post", name: "📱 Social Media Post" },
    { id: "video-only", name: "📽️ Video Only" },
  ];

  const textModels = ["GPT-4", "GPT-3.5", "Mistral", "Gemini Pro"];
  const imageModels = ["Stable Diffusion", "DALL·E 3", "Midjourney", "Imagen 3"];
  const videoModels = ["RunwayML", "Sora (OpenAI)", "Pika Labs", "DeepMotion"];

  const handleModelChange = (type, model) => {
    setSelectedModels((prev) => ({ ...prev, [type]: model }));
  };

  const [showAddForm, setShowAddForm] = useState(false);

  return (
    // Main container with a deep dark background and subtle radial gradient for depth
    <div className="h-[100vh] w-screen bg-gradient-to-br from-purple-300 via-pink-400 to-indigo-300 font-sans p-6 overflow-hidden">
        <div className="flex items-center justify-between px-8">
          <div>
            <h1 className="text-4xl font-extrabold text-purple-700 tracking-tight">
              GenMark
            </h1>
            <p className="text-font-bold mt-1">
            🎯Personalized Marketing Studio
            </p>
          </div>
          <div>
            <button
              className="bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white font-semibold py-2 px-6 rounded-3xl shadow-md hover:from-purple-700 hover:to-fuchsia-700 transition-all duration-200"
              onClick={() => navigate("/dashboard")}
            >
              🧠 Back to Dashboard
            </button>
          </div>
      </div>
      {/* Responsive grid layout with a maximum width */}
      <div className="grid grid-cols-3 h-[90vh] gap-4 p-6 w-full">
        {/* Column 1 - Products */}
          <Card className="bg-white/70 backdrop-blur-sm border border-purple-100 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl font-bold text-purple-700 flex items-center justify-center gap-2">
                <span className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-sm">
                  📦
                </span>
                Products
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6">
              {/* Scrollable Product Grid */}
              <div
                className="grid grid-cols-2 gap-4 overflow-y-auto scrollbar-hide mb-6 pr-2"
                style={{ maxHeight: "300px" }}
              >
                {products.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => setProductId(product.id)}
                    className={`cursor-pointer p-3 rounded-xl border-2 transition-all duration-300 transform hover:scale-105
                      ${productId === product.id
                        ? "bg-gradient-to-br from-purple-100 to-pink-100 border-purple-400 shadow-lg"
                        : "bg-white/80 border-gray-200 hover:bg-purple-50 hover:border-purple-300 shadow-sm"
                      }`}
                  >
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-32 object-cover rounded-lg mb-2"
                    />
                    <div className="text-center font-semibold text-gray-700 text-sm">
                      {product.name}
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Product Form */}
              {showAddForm && (
                <div className="mb-6 space-y-4">
                  <input
                    type="text"
                    placeholder="Product Name"
                    className="w-full p-3 bg-white/80 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-200"
                  />
                  <textarea
                    placeholder="Description"
                    rows="3"
                    className="w-full p-3 bg-white/80 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-200 scrollbar-hide"
                  />
                  <input
                    type="url"
                    placeholder="Website URL (optional)"
                    className="w-full p-3 bg-white/80 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-200"
                  />
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-gradient-to-r file:from-purple-500 file:to-pink-500 file:text-white hover:file:from-purple-600 hover:file:to-pink-600 file:transition-all file:duration-200"
                  />
                  <Button
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold py-3 rounded-xl shadow-lg transition-all duration-300"
                    onClick={() => console.log("Product Added")}
                  >
                    ✨ Add Product
                  </Button>
                </div>
              )}

              {/* Add New Product Button */}
              <Button
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
                onClick={() => setShowAddForm(!showAddForm)}
              >
                {showAddForm ? "❌ Cancel" : "➕ Add New Product"}
              </Button>
            </CardContent>
          </Card>

          {/* Column 2 - Output Format */}
          <Card className="bg-white/70 backdrop-blur-sm border border-purple-100 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl font-bold text-indigo-700 flex items-center justify-center gap-2">
                <span className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm">
                  🎨
                </span>
                Output Format
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6">
              {/* Output Format Buttons */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                {outputFormats.map((format) => (
                  <Button
                    key={format.id}
                    variant="outline"
                    className={`flex items-center justify-center p-4 h-16 rounded-xl text-sm font-medium transition-all duration-300 border-2
                      ${selectedOutputFormat === format.id
                        ? "bg-gradient-to-br from-indigo-100 to-purple-100 border-indigo-400 text-indigo-700 shadow-lg transform scale-105"
                        : "bg-white/80 border-gray-200 text-gray-700 hover:bg-indigo-50 hover:border-indigo-300 shadow-sm"
                      }`}
                    onClick={() => setSelectedOutputFormat(format.id)}
                  >
                    {format.name}
                  </Button>
                ))}
              </div>

              {/* Custom Output Description */}
              <div className="mb-6">
                <label className="block text-sm font-semibold mb-3 text-gray-700">
                  💭 Describe your custom output format:
                </label>
                <Textarea
                  className="w-full bg-white/80 text-gray-700 p-4 rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 transition-all duration-200 shadow-sm"
                  placeholder="E.g., 'A short, punchy tweet with a single relevant image, targeting Gen Z.'"
                  rows="4"
                  value={customOutputDescription}
                  onChange={(e) => setCustomOutputDescription(e.target.value)}
                />
              </div>

              {/* Save Template Button */}
              <Button
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
                onClick={() => console.log("Save Template")}
              >
                💾 Save Template
              </Button>
            </CardContent>
          </Card>

        {/* Column 3 - Select Models */}
<Card className="bg-white/70 backdrop-blur-sm border border-purple-100 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl font-bold text-orange-600 flex items-center justify-center gap-2">
                <span className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white text-sm">
                  🤖
                </span>
                Select Models
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6">
              {/* Text Model Selection */}
              <div className="mb-6">
                <label className="block text-sm font-semibold mb-3 text-gray-700">
                  📝 Text Model
                </label>
                <Select
                  value={selectedModels.text}
                  onValueChange={(value) => handleModelChange("text", value)}
                >
                  <SelectTrigger className="w-full h-12 bg-white/80 text-gray-700 rounded-xl border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-200 transition-all duration-200 shadow-sm">
                    <SelectValue placeholder="Select a text model" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border border-gray-200 shadow-lg">
                    <SelectGroup>
                      <SelectLabel className="text-gray-600 font-semibold">Text Generation Models</SelectLabel>
                      {textModels.map((model) => (
                        <SelectItem key={model} value={model} className="rounded-lg">
                          {model}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              {/* Image Model Selection */}
              <div className="mb-6">
                <label className="block text-sm font-semibold mb-3 text-gray-700">
                  🖼️ Image Model
                </label>
                <Select
                  value={selectedModels.image}
                  onValueChange={(value) => handleModelChange("image", value)}
                >
                  <SelectTrigger className="w-full h-12 bg-white/80 text-gray-700 rounded-xl border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-200 transition-all duration-200 shadow-sm">
                    <SelectValue placeholder="Select an image model" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border border-gray-200 shadow-lg">
                    <SelectGroup>
                      <SelectLabel className="text-gray-600 font-semibold">Image Generation Models</SelectLabel>
                      {imageModels.map((model) => (
                        <SelectItem key={model} value={model} className="rounded-lg">
                          {model}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              {/* Video Model Selection */}
              <div className="mb-8">
                <label className="block text-sm font-semibold mb-3 text-gray-700">
                  🎬 Video Model
                </label>
                <Select
                  value={selectedModels.video}
                  onValueChange={(value) => handleModelChange("video", value)}
                >
                  <SelectTrigger className="w-full h-12 bg-white/80 text-gray-700 rounded-xl border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-200 transition-all duration-200 shadow-sm">
                    <SelectValue placeholder="Select a video model" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border border-gray-200 shadow-lg">
                    <SelectGroup>
                      <SelectLabel className="text-gray-600 font-semibold">Video Generation Models</SelectLabel>
                      {videoModels.map((model) => (
                        <SelectItem key={model} value={model} className="rounded-lg">
                          {model}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              {/* Generate Campaign Button */}
              <Button
                className="w-full h-14 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                onClick={() => console.log("Generate Campaign")}
              >
                🚀 Generate Campaign
              </Button>
            </CardContent>
          </Card>
      </div>
    </div>
  );
};

export default Project;