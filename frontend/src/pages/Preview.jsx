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
} from "lucide-react";
import { useEffect, useState, useRef } from "react";
import {
  getSpecificProject,
  getGeneratedOutput,
  getGeneratedImageURL,
} from "@/lib/api";

const Preview = () => {
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

    const pollInterval = 2000;
    const timeoutDuration = 30000;
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
  }, [state, navigate, textOutput, imageURL]);

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

      {/* Greeting */}
      <div className="mb-10 text-center">
        <h2 className="text-3xl font-semibold text-gray-800">
          🎉 Hey {name}, here's your generated content for{" "}
          <span className="text-purple-700 font-bold">{projectName}</span>!
        </h2>
        <p className="text-gray-600 mt-2">
          Review and edit your AI-generated marketing outputs below.
        </p>
      </div>

      {/* Edit Section */}
      <div className="mb-12">
        <h3 className="text-2xl font-semibold text-gray-800 mb-6 px-10">
          Edit Content
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 px-10">
          {/* Image Output */}
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
                  disabled={imageLoading || !imageURL}
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
              {imageLoading ? (
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                  <p className="text-purple-600">Generating image...</p>
                </div>
              ) : imageURL ? (
                <div className="w-auto max-w-full">
                  <img
                    alt="Generated"
                    src={imageURL}
                    className="rounded-xl max-w-full max-h-[600px] object-contain"
                  />
                </div>
              ) : (
                <div className="text-center">
                  <Image className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500 italic">
                    Image not generated yet.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Text Output */}
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
                  disabled={textLoading || !textOutput}
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
                >
                  <Copy className="w-4 h-4" />
                  Copy Text
                </Button>
              </div>
            </CardHeader>
            <CardContent className="h-80 overflow-y-auto">
              {textLoading ? (
                <div className="text-center pt-20">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                  <p className="text-indigo-600">Generating text...</p>
                </div>
              ) : textOutput ? (
                <div className="p-4 text-gray-800 whitespace-pre-wrap text-sm bg-indigo-50 rounded-lg border border-indigo-100 h-full overflow-y-auto">
                  {textOutput}
                </div>
              ) : (
                <div className="text-center pt-20">
                  <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500 italic">
                    Text not generated yet.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center gap-4 mt-8">
        <Button
          onClick={() => navigate(`/editor`, { state })}
          className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold py-3 px-8 rounded-3xl shadow-md hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 flex items-center gap-2"
        >
          <Edit3 className="w-5 h-5" />
          Open Editor
        </Button>
      </div>
    </div>
  );
};

export default Preview;
