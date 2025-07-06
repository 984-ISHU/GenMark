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
  Check,
  Loader2,
} from "lucide-react";
import { useEffect, useState, useRef } from "react";
import {
  getSpecificProject,
  getGeneratedOutput,
  getGeneratedImageURL,
} from "@/lib/api";

// Helper function to capitalize first letter
const capitalizeFirstLetter = (str) => {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
};

// Enhanced loading component for generation state
const GeneratingLoader = () => (
  <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6">
    <div className="relative">
      <Loader2 className="w-16 h-16 text-purple-600 animate-spin" />
      <div className="absolute inset-0 w-16 h-16 border-4 border-purple-200 rounded-full animate-pulse"></div>
    </div>

    <div className="text-center space-y-2">
      <h3 className="text-2xl font-semibold text-white">
        🎨 Generating Your Content...
      </h3>
      <p className="text-white max-w-md">
        Our AI is crafting your marketing materials. This may take a few
        moments.
      </p>
    </div>

    {/* Estimated Wait Times */}
    <div className="bg-purple-50 border border-purple-200 text-purple-800 px-6 py-4 rounded-xl shadow-inner w-full max-w-md">
      <h4 className="text-sm font-semibold mb-2 text-purple-700">
        ⏱ Estimated Generation Times
      </h4>
      <ul className="text-sm space-y-1">
        <li>
          📝 <span className="font-medium">Text:</span> ~5 seconds
        </li>
        <li>
          🖼️ <span className="font-medium">Image:</span> ~15 seconds
        </li>
        <li>
          🎬 <span className="font-medium">Video:</span> ~30 seconds
        </li>
      </ul>
    </div>

    <div className="flex space-x-1">
      <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
      <div
        className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"
        style={{ animationDelay: "0.1s" }}
      ></div>
      <div
        className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"
        style={{ animationDelay: "0.2s" }}
      ></div>
    </div>
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
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(textOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500); // Reset after 1.5s
  };

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
        const projectRes = await getSpecificProject(
          state.user_id,
          state.project_id
        );
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
  const hasGeneratedContent =
    showTextSection || showImageSection || showVideoSection;

  return (
    <div className="min-h-screen w-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800 font-sans">
      {/* Header - Always visible */}
      <div className="bg-white/10 backdrop-blur-sm border-b border-white/20 mb-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-extrabold text-white tracking-tight">
                GenMark
              </h1>
              <p className="text-purple-600 font-medium mt-2">{projectName}</p>
            </div>
            <div className="flex items-center gap-4">
              <div
                className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-2 cursor-pointer hover:bg-white/30 transition-colors"
                onClick={() => navigate("/dashboard")}
              >
                <ArrowLeft className="w-4 h-4 text-white" />
                <span className="text-white font-medium text-sm sm:text-base">
                  Back to Dashboard
                </span>
              </div>

              <button
                onClick={() => navigate("/automation", { state })}
                className="bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white font-semibold py-2 px-6 rounded-full shadow-lg hover:from-purple-700 hover:to-fuchsia-700 transition-all duration-200"
              >
                Go to Automation
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Body - Conditional based on generation state */}
      <div className="transform scale-[0.8] origin-top">
        {isGenerating ? (
          // Show loading state while generating
          <div className="flex-1">
            <GeneratingLoader />
          </div>
        ) : (
          // Show content sections after generation is complete
          <>
            {/* Greeting - Only show after generation */}
            <div className="px-6 lg:px-10 mb-10">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-6 py-6 shadow-md border border-white/20 text-center">
                <h2 className="text-3xl font-semibold text-white">
                  🎉 Hey {capitalizeFirstLetter(name || "User")}, here’s your
                  generated content for{" "}
                  <span className="text-purple-300 font-bold">
                    {projectName}
                  </span>
                  !
                </h2>
                <p className="text-purple-100 mt-2 text-sm">
                  Review and customize your AI-generated assets below.
                </p>
              </div>
            </div>

            {/* Content Sections - Only show relevant sections */}
            {hasGeneratedContent && (
              <div className="mb-16">
                <h3 className="text-2xl font-semibold text-white mb-6 px-6 lg:px-10">
                  🎯 Your AI-Generated Results
                </h3>

                {/* Video + Image Grid */}
                {(showVideoSection || showImageSection) && (
                  <div
                    className={`grid gap-6 px-6 lg:px-10 ${
                      showVideoSection && showImageSection
                        ? "grid-cols-1 sm:grid-cols-2"
                        : "grid-cols-1"
                    }`}
                  >
                    {/* Video Section */}
                    {showVideoSection && (
                      <Card className="bg-[rgb(216,205,255)] border border-purple-200 shadow-xl rounded-2xl">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-lg font-bold text-green-700 flex items-center gap-2">
                            🎥 Video Output
                          </CardTitle>
                          <Button
                            onClick={() => {
                              window.open(videoURL, "_blank");
                            }}
                            className="bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white font-semibold py-2 px-6 rounded-3xl shadow-lg hover:from-purple-700 hover:to-fuchsia-700 transition-all duration-200 flex items-center gap-2"
                            disabled={!videoURL}
                          >
                            <ArrowDownToLine className="w-4 h-4" />
                            Download
                          </Button>
                        </CardHeader>
                        <CardContent className="flex justify-center items-center pt-6 pb-4">
                          <video
                            controls
                            src={videoURL}
                            className="rounded-xl w-full h-auto max-h-[400px]"
                          />
                        </CardContent>
                      </Card>
                    )}

                    {/* Image Section */}
                    {showImageSection && (
                      <Card className="bg-[rgb(216,205,255)] border border-purple-200 shadow-xl rounded-2xl overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-lg font-bold text-purple-700 flex items-center gap-2">
                            <Image className="w-5 h-5" />
                            Image Output
                          </CardTitle>
                          <div className="grid grid-cols-2 gap-2">
                            <Button
                              onClick={handleEditImage}
                              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold py-2 px-6 rounded-3xl shadow-md hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 flex items-center gap-2 min-w-[120px] justify-center"
                              disabled={!imageURL}
                            >
                              <Edit3 className="w-4 h-4" />
                              Edit
                            </Button>

                            <Button
                              onClick={() => {
                                const link = document.createElement("a");
                                link.href = imageURL;
                                link.target = "_blank";
                                link.download = "generated-image.png";
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                              }}
                              className="bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white font-semibold py-2 px-6 rounded-3xl shadow-lg hover:from-purple-700 hover:to-fuchsia-700 transition-all duration-200 flex items-center gap-2"
                              disabled={!imageURL}
                            >
                              <ArrowDownToLine className="w-4 h-4" />
                              Download
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="flex justify-center items-center pt-6 pb-4">
                          <img
                            alt="Generated"
                            src={imageURL}
                            className="rounded-xl w-full h-auto max-h-[400px] object-contain"
                          />
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}

                {/* Text Section */}
                {showTextSection && (
                  <div className="mt-10 px-6 lg:px-10">
                    <Card className="bg-[rgb(216,205,255)] border border-purple-200 shadow-xl rounded-2xl">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-lg font-bold text-indigo-700 flex items-center gap-2">
                          <FileText className="w-5 h-5" />
                          Text Output
                        </CardTitle>
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            onClick={handleEditText}
                            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold py-2 px-6 rounded-3xl shadow-md hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 flex items-center gap-2 min-w-[120px] justify-center"
                            disabled={!textOutput}
                          >
                            <Edit3 className="w-4 h-4" />
                            Edit
                          </Button>

                          <Button
                            onClick={handleCopy}
                            className="bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white font-semibold py-2 px-6 rounded-3xl shadow-lg hover:from-purple-700 hover:to-fuchsia-700 transition-all duration-200 flex items-center gap-2"
                            disabled={!textOutput}
                          >
                            {copied ? (
                              <>
                                <Check className="w-4 h-4 animate-bounce" />
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4" />
                                Copy
                              </>
                            )}
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="max-h-[320px] overflow-y-auto">
                        <div className="p-4 text-gray-800 whitespace-pre-wrap text-sm bg-indigo-50 rounded-lg border border-indigo-100 h-full">
                          {textOutput}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
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
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Preview;
