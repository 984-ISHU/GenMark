import { toast } from "sonner";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Send,
  Save,
  RefreshCw,
  Image as ImageIcon,
  FileText,
  Wand2,
  Copy,
  Check,
  Download,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  getSpecificProject,
  getGeneratedOutput,
  getGeneratedImageURL,
  editTextRequest,
  editImageRequest,
  getEditedImage,
  storeEditedText,
  storeEditedImage,
  deleteEditedImage,
} from "@/lib/api";

const Editor = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state;

  // Content state
  const [textOutput, setTextOutput] = useState("");
  const [imageURL, setImageURL] = useState("");
  const [originalText, setOriginalText] = useState("");
  const [originalImageId, setOriginalImageId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [copied, setCopied] = useState(false);

  // UI state
  const [activeTab, setActiveTab] = useState("text");
  const [instruction, setInstruction] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setSaving] = useState(false);

  // Load initial data
  useEffect(() => {
    if (!state) {
      navigate("/dashboard");
      return;
    }

    setProjectId(state.project_id);
    setActiveTab(state.activeTab || "text");

    // Set initial content from state if available
    if (state.currentText) {
      setTextOutput(state.currentText);
      setOriginalText(state.currentText);
    }
    if (state.currentImageURL) {
      setImageURL(state.currentImageURL);
      console.log(imageURL);
    }

    loadProjectData();
  }, [state, navigate]);

  useEffect(() => {
    return () => {
      // Cleanup image URLs on unmount
      if (imageURL && imageURL.startsWith("blob:")) {
        URL.revokeObjectURL(imageURL);
      }
    };
  }, [imageURL]);

  const loadProjectData = async () => {
    let imageWasLoadedLocally = false;

    try {
      // 1. Try to load locally stored edited image
      try {
        const blob = await getEditedImage();
        console.log("Block Output:", blob);
        const url = URL.createObjectURL(blob);
        setImageURL(url);
        console.log("Setting URL 2nnd:", url);
        imageWasLoadedLocally = true;
        console.log("Loaded locally edited image");
      } catch (err) {
        console.log("No edited image found, fallback to original from GridFS");
      }

      // 2. Load text and image (if needed) from GridFS
      const projectRes = await getSpecificProject(
        state.user_id,
        state.project_id
      );
      const generated_outputs_id = projectRes.data.generated_outputs_id;

      if (generated_outputs_id) {
        const outputRes = await getGeneratedOutput(generated_outputs_id);
        const { text, image } = outputRes.data;

        if (text) {
          setTextOutput(text);
          setOriginalText(text);
        }

        if (image && !imageWasLoadedLocally) {
          setOriginalImageId(image);
          console.log("3rd:", getGeneratedImageURL(image));
          setImageURL(getGeneratedImageURL(image));
        }
      }
    } catch (error) {
      console.error("Error loading project data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditContentText = async () => {
    if (!instruction.trim()) return;

    setIsEditing(true);
    try {
      const response = await editTextRequest(
        projectId,
        instruction,
        originalText
      );

      setTextOutput(response.data.text);
      setInstruction("");
    } catch (error) {
      console.error("Error editing content:", error);
      alert("Failed to edit content. Please try again.");
    } finally {
      setIsEditing(false);
    }
  };

  const handleEditContentImage = async () => {
    if (!instruction.trim()) return;

    setIsEditing(true);
    try {
      // Just trigger the backend image generation — no image_id will be returned
      await editImageRequest(projectId, instruction, originalImageId);

      // Reload image from local `EditImage.jpg`
      const response = await fetch(
        "http://127.0.0.1:8000/api/edit/edited/image",
        { cache: "no-store" }
      );
      // prevent stale image caching
      if (!response.ok) throw new Error("Failed to fetch edited image");

      const blob = await response.blob();
      const imageUrl = URL.createObjectURL(blob);

      setImageURL(imageUrl);
      setInstruction("");

      console.log("✅ Image edited and loaded");
    } catch (error) {
      console.error("Error editing content:", error);
      alert("Failed to edit content. Please try again.");
    } finally {
      setIsEditing(false);
    }
  };

  const handleSaveChanges = async () => {
    setSaving(true);
    try {
      // 1. Upload Text
      const textFormData = new FormData();
      textFormData.append("text", textOutput);

      const textUploadResponse = await storeEditedText(projectId, textFormData);
      if (textUploadResponse.status === 200) {
        console.log("✅ Text uploaded successfully.");
      } else {
        console.warn(
          "⚠️ Text upload response was not 200:",
          textUploadResponse
        );
      }

      // 2. Try uploading image if EditImage.jpg exists
      try {
        const blob = await getEditedImage(); // ⛔ will throw if not found
        const imageFormData = new FormData();
        imageFormData.append(
          "image_output",
          new File([blob], "EditedImage.jpg", { type: "image/jpeg" })
        );

        const imageUploadResponse = await storeEditedImage(
          projectId,
          imageFormData
        );
        console.log("✅ Image uploaded:", imageUploadResponse.data);
      } catch (err) {
        console.log("⚠️ No edited image found. Skipping image upload.");
      }

      await deleteEditedImage();
      toast.success("Changes saved successfully!"); // ✅ TOAST ADDED

      // 3. Navigate back to preview
      navigate("/preview", {
        state: {
          ...state,
          currentText: textOutput,
          currentImageURL: imageURL,
        },
      });
    } catch (error) {
      console.error("❌ Error saving changes:", error);
      toast.error("Failed to save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(textOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500); // Reset after 1.5s
  };

  const handleDownloadImage = () => {
    if (imageURL) {
      const link = document.createElement("a");
      link.href = imageURL;
      link.download = "edited-image.png";
      link.click();
    }
  };

  if (!state) return null;

  const { name, projectName } = state;

  return (
    <div className="min-h-screen w-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800 font-sans">
      {/* Header */}

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
              <Button
                onClick={() => {
                  toast.custom((t) => (
                    <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white p-4 rounded-xl shadow-lg w-[300px] space-y-3">
                      <p className="text-base font-semibold">Are you sure?</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        You have unsaved changes. Go back without saving?
                      </p>
                      <div className="flex justify-end gap-2 mt-2">
                        <button
                          onClick={() => toast.dismiss(t)}
                          className="text-sm font-medium px-4 py-1.5 rounded-md bg-purple-100 text-purple-700 hover:bg-purple-200 transition"
                        >
                          Cancel
                        </button>

                        <button
                          onClick={async () => {
                            toast.dismiss(t);
                            try {
                              const response = await deleteEditedImage();
                              if (!response.ok) {
                                console.warn(
                                  "⚠️ Edited image not found or already deleted."
                                );
                              }
                            } catch (err) {
                              console.error(
                                "❌ Error deleting edited image:",
                                err
                              );
                            }
                            navigate("/preview", { state });
                          }}
                          className="text-sm bg-red-600 hover:bg-red-700 text-white px-4 py-1 rounded-md"
                        >
                          Go Back
                        </button>
                      </div>
                    </div>
                  ));
                }}
                className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-2 hover:bg-white/30 transition-colors text-white text-sm sm:text-base"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Preview
              </Button>

              <Button
                onClick={handleSaveChanges}
                disabled={isSaving}
                className="bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold py-2.5 px-6 rounded-full shadow-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 flex items-center gap-2 text-sm sm:text-base"
              >
                {isSaving ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <Save className="w-5 h-5" />
                )}
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 w-full mb-8 gap-2 bg-transparent">
            <TabsTrigger
              value="text"
              className="rounded-full py-2.5 px-4 sm:px-6 text-sm sm:text-base font-semibold transition-all duration-200
    flex items-center justify-center gap-2
    bg-white/5 hover:bg-white/10 text-white/80
    data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-indigo-600
    data-[state=active]:text-white"
            >
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Text Editor</span>
            </TabsTrigger>
            <TabsTrigger
              value="image"
              className="rounded-full py-2.5 px-4 sm:px-6 text-sm sm:text-base font-semibold transition-all duration-200
    flex items-center justify-center gap-2
    bg-white/5 hover:bg-white/10 text-white/80
    data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-indigo-600
    data-[state=active]:text-white"
            >
              <ImageIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Image Editor</span>
            </TabsTrigger>
          </TabsList>

          {/* Text Editor Tab */}
          <TabsContent value="text" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Text Content */}
              <Card className="bg-white/90 border border-indigo-300 shadow-lg rounded-3xl">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg font-semibold text-indigo-700 flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Current Text
                  </CardTitle>
                  <div className="flex gap-2">
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
                        </>
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="h-96">
                  <Textarea
                    value={textOutput}
                    onChange={(e) => setTextOutput(e.target.value)}
                    placeholder="Generated text will appear here..."
                    className="h-full resize-none border-indigo-200 focus:border-indigo-400 focus:ring-indigo-300 text-sm"
                    disabled={isLoading}
                  />
                </CardContent>
              </Card>

              {/* Text Edit Controls */}
              <Card className="bg-white/90 border border-purple-300 shadow-lg rounded-3xl">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-purple-700 flex items-center gap-2">
                    <Wand2 className="w-5 h-5" />
                    AI Text Editor
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Tell the AI how to modify your text:
                    </label>
                    <Textarea
                      value={instruction}
                      onChange={(e) => setInstruction(e.target.value)}
                      placeholder="e.g., Make it more professional, add emojis, make it shorter, change the tone to friendly..."
                      className="h-32 resize-none border-purple-200 focus:border-purple-400 focus:ring-purple-300"
                      disabled={isEditing}
                    />
                  </div>

                  <Button
                    onClick={handleEditContentText}
                    disabled={isEditing || !instruction.trim()}
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold py-3 px-6 rounded-full shadow-md hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 flex items-center justify-center gap-2 text-sm sm:text-base"
                  >
                    {isEditing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Editing...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Apply Changes
                      </>
                    )}
                  </Button>

                  {/* Quick Actions */}
                  {/* Quick Actions */}
                  <div className="border-t border-purple-200 pt-5">
                    <p className="text-sm font-semibold text-gray-700 mb-3">
                      Quick Actions:
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        {
                          label: "🎓 Professional",
                          prompt: "Make it more professional and formal",
                        },
                        {
                          label: "😄 Add Emojis",
                          prompt: "Add emojis and make it more engaging",
                        },
                        {
                          label: "✂️ Shorten",
                          prompt: "Make it shorter and more concise",
                        },
                        {
                          label: "🧾 Expand",
                          prompt: "Make it longer with more details",
                        },
                      ].map(({ label, prompt }, idx) => (
                        <Button
                          key={idx}
                          variant="outline"
                          size="sm"
                          onClick={() => setInstruction(prompt)}
                          className="text-xs sm:text-sm rounded-full border border-purple-300 bg-white text-purple-700 hover:bg-purple-50 transition duration-200 px-4 py-2 shadow-sm"
                        >
                          {label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Image Editor Tab */}
          <TabsContent value="image" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Image Content */}
              <Card className="bg-white/90 border border-purple-300 shadow-lg rounded-3xl">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg font-bold text-purple-700 flex items-center gap-2">
                    <ImageIcon className="w-5 h-5" />
                    Current Image
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownloadImage}
                      disabled={!imageURL}
                      className="flex items-center gap-2 text-purple-600 border-purple-300 hover:bg-purple-50"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="flex justify-center items-center p-4">
                  {isLoading ? (
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                      <p className="text-purple-600">Loading image...</p>
                    </div>
                  ) : imageURL ? (
                    <div className="max-w-full max-h-[80vh] overflow-auto">
                      <img
                        src={imageURL}
                        alt="Generated content"
                        className="rounded-xl w-auto h-auto max-w-full max-h-[80vh] mx-auto"
                      />
                    </div>
                  ) : (
                    <div className="text-center">
                      <ImageIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-500 italic">No image available</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Image Edit Controls */}
              <Card className="bg-white/90 border border-indigo-300 shadow-lg rounded-3xl">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-indigo-700 flex items-center gap-2">
                    <Wand2 className="w-5 h-5" />
                    AI Image Editor
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Tell the AI how to modify your image:
                    </label>
                    <Textarea
                      value={instruction}
                      onChange={(e) => setInstruction(e.target.value)}
                      placeholder="e.g., Change the background color to blue, add text overlay, make it brighter, remove the logo..."
                      className="h-32 resize-none border-indigo-200 focus:border-indigo-400 focus:ring-indigo-300"
                      disabled={isEditing}
                    />
                  </div>
                  <Button
                    onClick={handleEditContentImage}
                    disabled={isEditing || !instruction.trim() || !imageURL}
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold py-3 px-6 rounded-full shadow-md hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    {isEditing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Editing...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Apply Changes
                      </>
                    )}
                  </Button>

                  {/* Quick Actions */}
                  <div className="border-t border-purple-200 pt-5">
                    <p className="text-sm font-semibold text-gray-700 mb-3">
                      Quick Actions:
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
                      {[
                        {
                          label: "✨ Brighten",
                          prompt: "Make the image brighter and more vibrant",
                        },
                        {
                          label: "🧼 Clean Background",
                          prompt: "Add a professional clean background",
                        },
                        {
                          label: "📝 Add Text",
                          prompt: "Add text overlay with the product name",
                        },
                        {
                          label: "🎨 Modern Style",
                          prompt:
                            "Change the style to be more modern and minimalist",
                        },
                      ].map(({ label, prompt }, idx) => (
                        <Button
                          key={idx}
                          variant="outline"
                          onClick={() => setInstruction(prompt)}
                          className="rounded-full border border-purple-300 bg-white text-purple-700 hover:bg-purple-50 transition duration-200 px-4 py-2 text-xs sm:text-sm shadow-sm"
                        >
                          {label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Editor;
