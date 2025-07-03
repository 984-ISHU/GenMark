import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import {
  getSpecificProject,
  getGeneratedOutput,
  getGeneratedImageURL,
} from "@/lib/api";

const PreviewPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state;

  const [textOutput, setTextOutput] = useState("");
  const [imageURL, setImageURL] = useState("");
  const [textLoading, setTextLoading] = useState(true);
  const [imageLoading, setImageLoading] = useState(true);

  const textLoadingRef = useRef(true);
  const imageLoadingRef = useRef(true);

  useEffect(() => {
    if (!state) {
      navigate("/dashboard");
      return;
    }

    const pollInterval = 2000; // every 3 seconds
    const timeoutDuration = 30000; // 30 seconds
    const startTime = Date.now();

    const poll = async () => {
      try {
        const projectRes = await getSpecificProject(
          state.user_id,
          state.project_id
        );
        const generated_outputs_id = projectRes.data.generated_outputs_id;
        if (!generated_outputs_id) return;

        const outputRes = await getGeneratedOutput(generated_outputs_id);
        const { text, image } = outputRes.data;

        if (text && !textOutput) {
          setTextOutput(text);
          setTextLoading(false);
          textLoadingRef.current = false;
        }

        if (image && !imageURL) {
          setImageURL(getGeneratedImageURL(image));
          setImageLoading(false);
          imageLoadingRef.current = false;
        }

        if (
          (textLoadingRef.current || imageLoadingRef.current) &&
          Date.now() - startTime < timeoutDuration
        ) {
          setTimeout(poll, pollInterval);
        }
      } catch (err) {
        console.error("Polling error:", err);
        setTextLoading(false);
        setImageLoading(false);
        textLoadingRef.current = false;
        imageLoadingRef.current = false;
      }
    };

    poll();
  }, [state, navigate]);

  if (!state) return null;

  const name = state.name;
  const projectName = state.projectName;

  return (
    <div className="min-h-screen w-screen bg-gradient-to-br from-purple-200 via-pink-100 to-indigo-100 font-sans p-6 overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-4xl font-extrabold text-purple-700 tracking-tight">
            GenMark
          </h1>
          <p className="text-purple-600 font-medium mt-2">
            Project: {projectName}
          </p>
        </div>
        <div>
          <button
            className="bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white font-semibold py-2 px-6 rounded-3xl shadow-md hover:from-purple-700 hover:to-fuchsia-700 transition-all duration-200 flex items-center gap-2"
            onClick={() => navigate("/dashboard")}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
        </div>
      </div>

      {/* Greeting */}
      <div className="mb-10 text-center">
        <h2 className="text-3xl font-semibold text-gray-800">
          🎉 Hey {name}, here’s your generated content for{" "}
          <span className="text-purple-700 font-bold">{projectName}</span>!
        </h2>
        <p className="text-gray-600 mt-2">
          Review your AI-generated marketing outputs below.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Image Output */}
        <Card className="bg-white/90 border border-purple-300 shadow-lg rounded-2xl overflow-hidden">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-purple-700">
              🖼️ Image Output
            </CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center items-center p-4">
            {imageLoading ? (
              <p className="text-purple-600 animate-pulse">
                ⏳ Generating image...
              </p>
            ) : imageURL ? (
              <img
                src={imageURL}
                alt="Generated"
                className="rounded-xl object-contain max-w-full h-auto"
              />
            ) : (
              <p className="text-gray-500 italic">
                ❌ Image not generated yet.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Text Output */}
        <Card className="bg-white/90 border border-indigo-300 shadow-lg rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-indigo-700">
              📝 Text Output
            </CardTitle>
          </CardHeader>
          <CardContent>
            {textLoading ? (
              <p className="text-indigo-600 animate-pulse">
                ⏳ Generating text...
              </p>
            ) : textOutput ? (
              <div className="p-2 text-gray-800 whitespace-pre-wrap text-sm bg-indigo-50 rounded-lg border border-indigo-100">
                {textOutput}
              </div>
            ) : (
              <p className="text-gray-500 italic">❌ Text not generated yet.</p>
            )}
          </CardContent>
        </Card>

        {/* Video Output */}
        {/* {outputs.videoOutput && (
          <Card className="bg-white/90 border border-pink-300 shadow-lg rounded-2xl overflow-hidden">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-pink-700">
                🎬 Video Output
              </CardTitle>
            </CardHeader>
            <CardContent>
              <video
                controls
                className="w-full rounded-xl"
                src={outputs.videoOutput}
              >
                Your browser does not support the video tag.
              </video>
            </CardContent>
          </Card>
        )} */}
      </div>
    </div>
  );
};

export default PreviewPage;
