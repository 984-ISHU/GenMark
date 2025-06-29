import { useEffect, useState } from "react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"; // adjust if needed
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"; // adjust if needed
import axios from "axios";

export default function AudienceSelector() {
  const [targetAudience, setTargetAudience] = useState("");

  const [datasets, setDatasets] = useState([]);
  const [selectedDataset, setSelectedDataset] = useState(null);
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [ageRange, setAgeRange] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [gender, setGender] = useState("");

  const ageOptions = ["ALL", "5-10", "11-18", "19-25", "26-40", "41-60", "60+"];

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

  return (
    <>
      {/* Dataset Selector */}
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
            <h3 className="text-lg font-semibold text-orange-600 mb-1">
              🔞 Age Range
            </h3>
            <Select onValueChange={setAgeRange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select age range" />
              </SelectTrigger>
              <SelectContent>
                {ageOptions.map((age) => (
                  <SelectItem key={age} value={age}>
                    {age}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            <h3 className="text-lg font-semibold text-pink-600 mb-1">
              👤 Gender
            </h3>
            <Select onValueChange={setGender}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="both">Both</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
