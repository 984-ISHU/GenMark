import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Edit3,
  FileText,
  Image,
  ArrowDownToLine,
  Copy,
  Mail,
  Loader2,
} from "lucide-react";
import { useEffect, useState, useRef } from "react";
import {
  getSpecificProject,
  getGeneratedOutput,
  getGeneratedImageURL,
} from "@/lib/api";

// Enhanced loading component for generation state
const GeneratingLoader = () => (
  <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6">
    <div className="relative">
      <Loader2 className="w-16 h-16 text-purple-600 animate-spin" />
      <div className="absolute inset-0 w-16 h-16 border-4 border-purple-200 rounded-full animate-pulse"></div>
    </div>
    <div className="text-center space-y-2">
      <h3 className="text-2xl font-semibold text-gray-800">
        🎨 Generating Your Content...
      </h3>
      <p className="text-gray-600 max-w-md">
        Our AI is crafting your marketing materials. This may take a few moments.
      </p>
    </div>
    <div className="flex space-x-1">
      <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
      <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
      <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
    </div>
  </div>
);

// Simple loading bar component for individual sections
const LoadingBar = ({ color = "indigo", label }) => (
  <div className="flex flex-col items-center justify-center w-full py-8">
    <div className={`w-48 h-3 bg-gray-200 rounded-full overflow-hidden`}>
      <div
        className={`h-3 rounded-full animate-pulse bg-${color}-600`}
        style={{ width: "70%" }}
      ></div>
    </div>
    <p className={`mt-2 text-${color}-600 font-semibold`}>{label}</p>
  </div>
);

const Preview = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state;

  const [textOutput, setTextOutput] = useState("");
  const [imageURL, setImageURL] = useState("");
  const [videoURL, setVideoURL] = useState("");
  const [textLoading, setTextLoading] = useState(true);
  const [imageLoading, setImageLoading] = useState(true);
  const [videoLoading, setVideoLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(true);

  const textLoadingRef = useRef(true);
  const imageLoadingRef = useRef(true);
  const videoLoadingRef = useRef(true);

  useEffect(() => {
  if (!state) {
    navigate("/dashboard");
    return;
  }

  setTextLoading(true);
  setImageLoading(true);
  setVideoLoading(true);
  setIsGenerating(true);

  const pollInterval = 5000; // every 5 seconds
  const maxPollDuration = 15 * 60 * 1000; // 15 minutes
  const startTime = Date.now();

  const poll = async () => {
    try {
      const projectRes = await getSpecificProject(state.user_id, state.project_id);
      const generated_outputs_id = projectRes.data.generated_outputs_id;

      // 🔁 Retry if not yet ready
      if (!generated_outputs_id) {
        setTimeout(poll, pollInterval);
        return;
      }

      const outputRes = await getGeneratedOutput(generated_outputs_id);
      const { text, image, video } = outputRes.data;

      if (text) {
        setTextOutput(text);
        setTextLoading(false);
      }

      if (image) {
        const imageUrl = getGeneratedImageURL(image);
        setImageURL(imageUrl);
        setImageLoading(false);
      }

      if (video) {
        setVideoURL(video);
        setVideoLoading(false);
      }

      const done = !!text || !!image || !!video;
      if (done) {
        setIsGenerating(false);
      } else {
        setTimeout(poll, pollInterval);
      }
    } catch (err) {
      console.error("Polling error:", err);
      setTimeout(poll, pollInterval); // Retry on error
    }

    // Optional: Abort if polling exceeds 15 mins
    if (Date.now() - startTime > maxPollDuration) {
      console.warn("Polling exceeded maximum duration. Stopping.");
      setIsGenerating(false);
    }
  };

  poll();
}, [state, navigate]);


  const handleEditText = () => {
    navigate(`/editor`, {
      state: {
        ...state,
        activeTab: "text",
        currentText: textOutput,
      },
    });
  };

  const handleEditImage = () => {
    navigate(`/editor`, {
      state: {
        ...state,
        activeTab: "image",
        currentImageURL: imageURL,
      },
    });
  };

  if (!state) return null;

  const name = state.name;
  const projectName = state.projectName;

  // Determine which sections to show based on actual generated content only
  const showTextSection = Boolean(textOutput);
  const showImageSection = Boolean(imageURL);
  const showVideoSection = Boolean(videoURL);
  const hasGeneratedContent = showTextSection || showImageSection || showVideoSection;

  return (
    <div className="min-h-screen w-screen bg-gradient-to-br from-purple-200 via-pink-100 to-indigo-100 font-sans p-6 overflow-auto">
      {/* Header - Always visible */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-4xl font-extrabold text-purple-700 tracking-tight">
            GenMark
          </h1>
          <p className="text-purple-600 font-medium mt-2">
            Project: {projectName}
          </p>
        </div>
        <div className="flex gap-4">
          <button
            className="bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white font-semibold py-2 px-6 rounded-3xl shadow-md hover:from-purple-700 hover:to-fuchsia-700 transition-all duration-200 flex items-center gap-2"
            onClick={() => navigate("/dashboard")}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
          <button
            className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-semibold py-2 px-6 rounded-3xl shadow-md hover:from-indigo-700 hover:to-blue-700 transition-all duration-200 flex items-center gap-2"
            onClick={() => navigate("/automation", { state })}
          >
            <Mail className="w-4 h-4" />
            Go to Automation
          </button>
        </div>
      </div>

      {/* Body - Conditional based on generation state */}
      {isGenerating ? (
        // Show loading state while generating
        <div className="flex-1">
          <GeneratingLoader />
        </div>
      ) : (
        // Show content sections after generation is complete
        <>
          {/* Greeting - Only show after generation */}
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-semibold text-gray-800">
              🎉 Hey {name}, here's your generated content for{" "}
              <span className="text-purple-700 font-bold">{projectName}</span>!
            </h2>
            <p className="text-gray-600 mt-2">
              Review and edit your AI-generated marketing outputs below.
            </p>
          </div>

          {/* Content Sections - Only show relevant sections */}
          {hasGeneratedContent && (
            <div className="mb-12">
              <h3 className="text-2xl font-semibold text-gray-800 mb-6 px-10">
                Generated Content
              </h3>
              
              {/* Grid layout for text and image if both exist */}
              {(showTextSection || showImageSection) && (
                <div className={`grid gap-10 px-10 ${
                  showTextSection && showImageSection 
                    ? 'grid-cols-1 lg:grid-cols-2' 
                    : 'grid-cols-1'
                }`}>
                  
                  {/* Image Section - Only show if image exists or is loading */}
                  {showImageSection && (
                    <Card className="bg-white/90 border border-purple-300 shadow-lg rounded-2xl overflow-hidden">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-lg font-bold text-purple-700 flex items-center gap-2">
                          <Image className="w-5 h-5" />
                          Image Output
                        </CardTitle>
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleEditImage}
                            className="flex items-center gap-2 text-purple-600 border-purple-300 hover:bg-purple-50"
                            disabled={!imageURL}
                          >
                            <Edit3 className="w-4 h-4" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const link = document.createElement("a");
                              link.href = imageURL;
                              link.download = "generated-image.png";
                              link.click();
                            }}
                            className="flex items-center gap-2 text-purple-600 border-purple-300 hover:bg-purple-50"
                            disabled={!imageURL}
                          >
                            <ArrowDownToLine className="w-4 h-4" />
                            Download
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="flex justify-center items-center pt-10">
                        {imageURL ? (
                          <div className="w-auto max-w-full">
                            <img
                              alt="Generated"
                              src={imageURL}
                              className="rounded-xl max-w-full max-h-[600px] object-contain"
                            />
                          </div>
                        ) : null}
                      </CardContent>
                    </Card>
                  )}

                  {/* Video Section - Only show if video exists or is loading */}
              {showVideoSection && (
                <div className="mt-10 px-10">
                  <Card className="bg-white/90 border border-green-300 shadow-lg rounded-2xl">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-lg font-bold text-green-700 flex items-center gap-2">
                        🎥 Video Output
                      </CardTitle>
                      <div className="grid grid-cols-1 gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const link = document.createElement("a");
                            link.href = videoURL;
                            link.download = "generated-video.mp4";
                            link.click();
                          }}
                          className="flex items-center gap-2 text-purple-600 border-purple-300 hover:bg-purple-50"
                          disabled={!videoURL}
                        >
                          <ArrowDownToLine className="w-4 h-4" />
                          Download
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="flex justify-center items-center pt-6">
                      {videoURL ? (
                        <video
                          controls
                          src={videoURL}
                          className="rounded-xl max-w-full max-h-[600px]"
                        />
                      ) : null}
                    </CardContent>
                  </Card>
                </div>
              )}
              </div>
              )}

              {/* Text Section - Only show if text exists or is loading */}
                  {showTextSection && (
                    <Card className="bg-white/90 border border-indigo-300 shadow-lg rounded-2xl">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-lg font-bold text-indigo-700 flex items-center gap-2">
                          <FileText className="w-5 h-5" />
                          Text Output
                        </CardTitle>
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleEditText}
                            className="flex items-center gap-2 text-indigo-600 border-indigo-300 hover:bg-indigo-50"
                            disabled={!textOutput}
                          >
                            <Edit3 className="w-4 h-4" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              navigator.clipboard.writeText(textOutput);
                            }}
                            className="flex items-center gap-2 text-purple-600 border-purple-300 hover:bg-purple-50"
                            disabled={!textOutput}
                          >
                            <Copy className="w-4 h-4" />
                            Copy Text
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="h-80 overflow-y-auto">
                        {textOutput ? (
                          <div className="p-4 text-gray-800 whitespace-pre-wrap text-sm bg-indigo-50 rounded-lg border border-indigo-100 h-full overflow-y-auto">
                            {textOutput}
                          </div>
                        ) : null}
                      </CardContent>
                    </Card>
                  )}
            </div>
          )}

          {/* Action Buttons - Only show after generation */}
          <div className="flex justify-center gap-4 mt-8">
            <Button
              onClick={() => navigate(`/editor`, { state })}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold py-3 px-8 rounded-3xl shadow-md hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 flex items-center gap-2"
            >
              <Edit3 className="w-5 h-5" />
              Open Editor
            </Button>
            <Button
              onClick={() => window.location.reload()}
              className="bg-gray-200 text-gray-800 font-semibold py-3 px-8 rounded-3xl shadow-md hover:bg-gray-300 transition-all duration-200 flex items-center gap-2"
            >
              Refresh
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default Preview;