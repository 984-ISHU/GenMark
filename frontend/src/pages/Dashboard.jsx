import { Navigate, useNavigate } from "react-router-dom";
import { useState } from "react";

export default function Dashboard() {
  const [projectName, setProjectName] = useState("");
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  const handleCreate = () => {
    console.log("Creating project:", projectName);
    setShowModal(false); // close the modal after creating
    setProjectName(""); // reset field
    localStorage.setItem("ProjectName", projectName);
    navigate("/project");
  };

  return (
    <div className="p-8 text-white relative">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="mt-6 space-y-4">
        <button
          className="bg-green-600 p-2 rounded"
          onClick={() => setShowModal(true)}
        >
          Create New Project
        </button>
        <div className="bg-gray-800 p-4 rounded">Previous Builds List Here</div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white text-black rounded-lg p-6 w-96 space-y-4">
            <h2 className="text-xl font-semibold">Enter Project Name</h2>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Project Name"
              className="w-full p-2 border border-gray-300 rounded"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowModal(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                className="bg-green-600 text-white px-4 py-2 rounded"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
