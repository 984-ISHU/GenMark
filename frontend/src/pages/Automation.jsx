import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Mail,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useEffect, useState, useRef } from "react";
import {
  getSpecificProject,
  getGeneratedOutput,
  getGeneratedImageURL,
  checkFilteredDatasetExists,
  getFilteredDataset,
} from "@/lib/api";

// Toast Component
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === "success" ? "bg-green-500" : "bg-red-500";
  const Icon = type === "success" ? CheckCircle : XCircle;

  return (
    <div
      className={`fixed top-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2 animate-in slide-in-from-right`}
    >
      <Icon className="w-5 h-5" />
      <span>{message}</span>
      <button onClick={onClose} className="ml-2 text-white hover:text-gray-200">
        ×
      </button>
    </div>
  );
};

const emailTemplates = [
  {
    id: "template1",
    name: "Modern Newsletter",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
        <h1 style="color: #333; text-align: center;">{projectName}</h1>
        <img src="{imageURL}" alt="Generated Image" style="width: 100%; height: auto; margin: 20px 0;" />
        <div style="background-color: white; padding: 20px; border-radius: 8px;">
          <p style="color: #333; line-height: 1.6;">Hey {name},</p>
          <p style="color: #333; line-height: 1.6;">{textOutput}</p>
          <div style="text-align: center; margin: 20px 0;">
            <a href="{productURL}" style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">View Product</a>
          </div>
        </div>
        <p style="text-align: center; color: #666; margin-top: 20px;">Generated by GenMark</p>
      </div>
    `,
  },
  {
    id: "template2",
    name: "Minimalist",
    html: `
      <div style="font-family: Helvetica, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2c3e50;">{projectName}</h2>
        <img src="{imageURL}" alt="Generated Image" style="width: 100%; margin: 10px 0;" />
        <p style="color: #34495e; font-size: 16px;">Hey {name},</p>
        <p style="color: #34495e; font-size: 16px;">{textOutput}</p>
        <p style="margin: 20px 0;">
          <a href="{productURL}" style="color: #3498db; text-decoration: none; font-weight: bold;">→ Check it out here</a>
        </p>
        <hr style="border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #7f8c8d; font-size: 12px; text-align: center;">Powered by GenMark</p>
      </div>
    `,
  },
  {
    id: "template3",
    name: "Bold Marketing",
    html: `
      <div style="font-family: Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #1e90ff; color: white;">
        <h1 style="text-align: center; font-size: 28px; text-transform: uppercase;">{projectName}</h1>
        <img src="{imageURL}" alt="Generated Image" style="width: 100%; border-radius: 10px; margin: 20px 0;" />
        <div style="background-color: rgba(255,255,255,0.9); color: #333; padding: 20px; border-radius: 10px;">
          <p style="font-size: 16px; line-height: 1.5;">Hey {name},</p>
          <p style="font-size: 16px; line-height: 1.5;">{textOutput}</p>
          <div style="text-align: center; margin: 20px 0;">
            <a href="{productURL}" style="background-color: #ff6b35; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; text-transform: uppercase;">Get Started Now</a>
          </div>
        </div>
        <p style="text-align: center; margin-top: 20px; font-size: 14px;">Created with GenMark</p>
      </div>
    `,
  },
  {
    id: "template4",
    name: "Elegant Promo",
    html: `
      <div style="max-width: 600px; margin: auto; font-family: 'Segoe UI', sans-serif; background: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
        <div style="background: linear-gradient(to right, #6366f1, #3b82f6); padding: 20px; text-align: center; color: white;">
          <h1 style="margin: 0;">{projectName}</h1>
        </div>
        <img src="{imageURL}" alt="Image" style="width: 100%; display: block;" />
        <div style="padding: 20px;">
          <p style="margin: 0 0 10px 0; font-size: 16px; color: #333;">Hi {name},</p>
          <p style="margin: 0 0 20px 0; font-size: 16px; color: #333;">{textOutput}</p>
          <div style="text-align: center; margin-top: 20px;">
            <a href="{productURL}" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">Explore Now</a>
          </div>
        </div>
        <div style="background: #f9fafb; text-align: center; padding: 16px; font-size: 12px; color: #888;">Sent with ❤️ by GenMark</div>
      </div>
    `,
  },
  {
    id: "template5",
    name: "Sleek Card",
    html: `
      <div style="font-family: Roboto, sans-serif; max-width: 600px; margin: auto; background: #ffffff; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <h2 style="color: #111827; font-size: 24px; margin-bottom: 10px;">{projectName}</h2>
        <img src="{imageURL}" alt="Visual" style="width: 100%; border-radius: 8px; margin: 20px 0;" />
        <p style="color: #374151; font-size: 15px;">Hello {name},</p>
        <p style="color: #374151; font-size: 15px;">{textOutput}</p>
        <div style="margin: 25px 0; text-align: center;">
          <a href="{productURL}" style="padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px;">View Details</a>
        </div>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
        <p style="font-size: 12px; color: #6b7280; text-align: center;">© 2025 GenMark. All rights reserved.</p>
      </div>
    `,
  },
  {
    id: "template6",
    name: "Dark Mode Feature",
    html: `
      <div style="max-width: 600px; margin: auto; background: #111827; color: #f9fafb; font-family: 'Helvetica Neue', sans-serif; border-radius: 10px; overflow: hidden;">
        <div style="padding: 24px; text-align: center;">
          <h1 style="margin-bottom: 10px;">{projectName}</h1>
          <p style="color: #9ca3af; font-size: 14px;">New release just for you</p>
        </div>
        <img src="{imageURL}" alt="Generated" style="width: 100%; display: block;" />
        <div style="padding: 24px;">
          <p style="font-size: 16px;">Hi {name},</p>
          <p style="font-size: 16px;">{textOutput}</p>
          <div style="text-align: center; margin: 24px 0;">
            <a href="{productURL}" style="background: #3b82f6; color: white; padding: 12px 28px; text-decoration: none; border-radius: 8px; display: inline-block;">Try It Now</a>
          </div>
        </div>
        <div style="background: #1f2937; padding: 16px; text-align: center; font-size: 12px; color: #9ca3af;">
          Crafted by GenMark • Unsubscribe anytime
        </div>
      </div>
    `,
  },
];

const Automation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state;

  const [textOutput, setTextOutput] = useState("");
  const [imageURL, setImageURL] = useState("");
  const [productURL, setProductURL] = useState("");
  const [productLoading, setProductLoading] = useState(true);
  const [textLoading, setTextLoading] = useState(true);
  const [imageLoading, setImageLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [currentTemplateIndex, setCurrentTemplateIndex] = useState(0);
  const [datasetHead, setDatasetHead] = useState([]);
  const [isDatasetLoading, setIsDatasetLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const textLoadingRef = useRef(true);
  const imageLoadingRef = useRef(true);

  // Helper function to capitalize names
  const capitalizeName = (name) => {
    if (!name) return "there";
    return name
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  // Toast helper functions
  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  const hideToast = () => {
    setToast(null);
  };

  useEffect(() => {
    if (!state) {
      navigate("/dashboard");
      return;
    }

    const fetchProductURL = async () => {
      try {
        const response = await fetch(
          `https://genmark-mzoy.onrender.com/api/project/products/${state.user_id}/${state.project_id}`
        );
        if (response.ok) {
          const productData = await response.json();
          console.log("Product API response:", productData);
          console.log("Product URL: ", productData.product_url);
          setProductURL(productData.product_url || "");
        } else {
          console.warn("Failed to fetch product URL");
        }
      } catch (err) {
        console.error("Error fetching product URL:", err);
      } finally {
        setProductLoading(false);
      }
    };

    const fetchFilteredDataset = async () => {
      try {
        const checkRes = await checkFilteredDatasetExists(
          state.user_id,
          state.project_id
        );

        if (!checkRes.data.exists) {
          // Wait for filtering to complete
          console.log("Found no filtered data");
        }

        // Now fetch filtered data
        const res = await getFilteredDataset(state.user_id, state.project_id);
        const data = await res.data;
        setDatasetHead(data);
      } catch (err) {
        console.error("Error fetching filtered dataset:", err);
      } finally {
        setIsDatasetLoading(false);
      }
    };

    const pollOutput = async () => {
      try {
        const projectRes = await getSpecificProject(
          state.user_id,
          state.project_id
        );
        const outputId = projectRes.data.generated_outputs_id;
        if (!outputId) return;

        const outputRes = await getGeneratedOutput(outputId);
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

        if (textLoadingRef.current || imageLoadingRef.current) {
          setTimeout(pollOutput, 2000);
        }
      } catch (err) {
        console.error("Polling error:", err);
        setTextLoading(false);
        setImageLoading(false);
        textLoadingRef.current = false;
        imageLoadingRef.current = false;
      }
    };

    fetchProductURL();
    fetchFilteredDataset();
    pollOutput();
  }, [state, navigate, textOutput, imageURL]);

  const handleSendEmail = async () => {
    if (!datasetHead || datasetHead.length === 0) return;

    setIsSending(true);
    try {
      const template = emailTemplates[currentTemplateIndex];
      let successCount = 0;
      let totalCount = datasetHead.length;

      for (const user of datasetHead) {
        const recipientEmail = user.Email;
        const recipientName = capitalizeName(user.Name || "there");

        const html = template.html
          .replace("{projectName}", state.projectName)
          .replace("{imageURL}", imageURL)
          .replace("{name}", recipientName)
          .replace("{textOutput}", textOutput)
          .replace("{productURL}", productURL || "#");

        const response = await fetch("https://genmark-mzoy.onrender.com/api/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subject: `GenMark: ${state.projectName}`,
            html_body: html,
            recipients: [recipientEmail],
          }),
        });

        if (response.ok) {
          successCount++;
        } else {
          console.warn(`Failed to send to ${recipientEmail}`);
        }
      }

      if (successCount === totalCount) {
        showToast(`Successfully sent ${successCount} emails!`, "success");
      } else {
        showToast(
          `Sent ${successCount} out of ${totalCount} emails`,
          "success"
        );
      }
    } catch (error) {
      console.error("Email sending error:", error);
      showToast("Failed to send emails", "error");
    } finally {
      setIsSending(false);
    }
  };

  const handlePreviousTemplate = () => {
    setCurrentTemplateIndex((prev) =>
      prev === 0 ? emailTemplates.length - 1 : prev - 1
    );
  };

  const handleNextTemplate = () => {
    setCurrentTemplateIndex((prev) =>
      prev === emailTemplates.length - 1 ? 0 : prev + 1
    );
  };

  const handleSaveDataset = async () => {
    try {
      const response = await fetch(
        "https://genmark-mzoy.onrender.com/api/datasets/save-filtered-head",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: state.user_id,
            project_id: state.project_id,
            rows: datasetHead,
          }),
        }
      );
      if (!response.ok) throw new Error("Failed to save updates");
      showToast("Dataset saved successfully!", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to save dataset", "error");
    }
  };

  if (!state) return null;

  const name = capitalizeName(state.name);
  const projectName = state.projectName;

  return (
    <div className="min-h-screen w-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800 font-sans">
      {/* Toast */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}

      <div className="bg-white/10 backdrop-blur-sm border-b border-white/20 mb-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-extrabold text-white tracking-tight">
                GenMark
              </h1>
              <p className="text-purple-400 font-medium mt-2">
                Project: {projectName}
              </p>
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
                onClick={() => navigate("/preview", { state })}
                className="bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white font-semibold py-2 px-6 rounded-full shadow-lg hover:from-purple-700 hover:to-fuchsia-700 transition-all duration-200"
              >
                Back to Automation
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Greeting */}
      <div className="px-6 lg:px-10 mb-10">
        <div className="bg-white/10 backdrop-blur-sm rounded-xl px-6 py-6 shadow-md border border-white/20 text-center">
          <h2 className="text-3xl font-semibold text-white">
            🎉 Hey {capitalizeName(name || "User")}, here's your generated
            content for{" "}
            <span className="text-purple-300 font-bold">{projectName}</span>!
          </h2>
          <p className="text-purple-100 mt-2 text-sm">
            Review and customize your AI-generated assets below.
          </p>
        </div>
      </div>

      {/* Email Preview Section */}
      <div className="mb-12 px-10 scale-75">
        <div className="relative flex items-center justify-center">
          <Button
            onClick={handlePreviousTemplate}
            className="bg-white text-gray-900 hover:bg-white-800 rounded-full p-2 absolute left-20 z-10"
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <div className="flex items-center justify-center w-full max-w-4xl relative">
            {emailTemplates.map((template, index) => {
              const isCurrent = index === currentTemplateIndex;
              const isLeft =
                index ===
                (currentTemplateIndex - 1 + emailTemplates.length) %
                  emailTemplates.length;
              const isRight =
                index === (currentTemplateIndex + 1) % emailTemplates.length;

              if (!isCurrent && !isLeft && !isRight) return null;

              const html =
                textOutput && imageURL && !textLoading && !imageLoading
                  ? template.html
                      .replace("{projectName}", state.projectName)
                      .replace("{imageURL}", imageURL)
                      .replace("{textOutput}", textOutput)
                      .replace("{name}", capitalizeName("sample user"))
                      .replace("{productURL}", productURL || "#")
                  : null;

              return (
                <div
                  key={template.id}
                  className={`transition-all duration-300 ${
                    isCurrent
                      ? "w-full max-w-2xl opacity-100 z-10"
                      : isLeft
                      ? "w-full max-w-2xl opacity-50 blur-sm absolute left-0 -translate-x-2/3"
                      : "w-full max-w-2xl opacity-50 blur-sm absolute right-0 translate-x-2/3"
                  }`}
                  style={{ filter: isCurrent ? "none" : "blur(4px)" }}
                >
                  <Card className="bg-white/90 border border-purple-300 shadow-lg rounded-2xl">
                    <CardHeader>
                      <CardTitle className="text-lg font-bold text-purple-700 flex items-center gap-2">
                        <Mail className="w-5 h-5" />
                        {template.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                      {html ? (
                        <div
                          className="border border-purple-100 rounded-lg"
                          dangerouslySetInnerHTML={{ __html: html }}
                        />
                      ) : (
                        <div className="text-center py-20">
                          <Mail className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                          <p className="text-gray-500 italic">
                            Waiting for content...
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
          <Button
            onClick={handleNextTemplate}
            className="bg-white text-gray-900 hover:bg-white-800 rounded-full p-2 absolute right-20 z-10"
          >
            <ChevronRight className="w-6 h-6" />
          </Button>
        </div>
      </div>

      {/* Dataset Section - List Format */}
      {!isDatasetLoading && datasetHead.length > 0 && (
        <div className="px-6 lg:px-10 mb-10 flex justify-center">
          <div className="w-1/2 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-purple-200 overflow-hidden">
            {/* Header with Save Button */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-bold text-white">
                  Email Recipients
                </h3>
                <p className="text-purple-100 text-sm mt-1">
                  * You can replace these names & mails with others for testing
                </p>
                <p className="text-purple-100 text-sm mt-1">
                  * Please save your changes before sending the email to ensure
                  it is sent to the updated address
                </p>
              </div>
              <Button
                onClick={handleSaveDataset}
                className="bg-white/20 hover:bg-white/30 text-white font-medium py-2 px-6 rounded-lg border border-white/30 transition-all duration-200"
              >
                Save Changes
              </Button>
            </div>

            {/* Recipients List */}
            <div className="p-6">
              <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {datasetHead.map((user, index) => (
                  <div
                    key={index}
                    className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* User ID */}
                      <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                          User ID
                        </label>
                        <div className="text-sm font-mono text-gray-800 bg-gray-50 px-3 py-2 rounded">
                          {user.user_id || `User ${index + 1}`}
                        </div>
                      </div>

                      {/* Name */}
                      <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                          Name
                        </label>
                        <input
                          type="text"
                          value={user.Name || ""}
                          onChange={(e) => {
                            const updated = [...datasetHead];
                            updated[index].Name = e.target.value;
                            setDatasetHead(updated);
                          }}
                          className="w-full text-sm px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="Enter name"
                        />
                      </div>

                      {/* Email */}
                      <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                          Email
                        </label>
                        <input
                          type="email"
                          value={user.Email || ""}
                          onChange={(e) => {
                            const updated = [...datasetHead];
                            updated[index].Email = e.target.value;
                            setDatasetHead(updated);
                          }}
                          className="w-full text-sm font-mono px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="Enter email address"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Send Email Button */}
      <div className="flex justify-center pb-10">
        <Button
          onClick={handleSendEmail}
          disabled={
            isSending || textLoading || imageLoading || !textOutput || !imageURL
          }
          className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-semibold py-3 px-8 rounded-3xl shadow-lg hover:from-indigo-700 hover:to-blue-700 transition-all duration-200 flex items-center gap-2 disabled:opacity-50"
        >
          <Mail className="w-5 h-5" />
          {isSending ? "Sending..." : "Send Email"}
        </Button>
      </div>
      <footer className="bg-white/10 backdrop-blur-sm text-center text-sm text-white p-8">
        <div className="container mx-auto px-4">
          <p>&copy; 2025 GenMark. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Automation;
