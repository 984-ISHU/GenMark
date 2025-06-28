// src/pages/Dashboard.jsx
export default function Dashboard() {
  return (
    <div className="p-8 text-white">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="mt-6 space-y-4">
        <button className="bg-green-600 p-2 rounded">Create New Project</button>
        <div className="bg-gray-800 p-4 rounded">Previous Builds List Here</div>
      </div>
    </div>
  );
}