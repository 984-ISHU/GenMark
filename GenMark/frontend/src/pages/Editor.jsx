// src/pages/Editor.jsx
export default function Editor() {
  return (
    <div className="p-8 text-white">
      <h1 className="text-2xl font-bold mb-4">Editing Page</h1>
      <textarea className="w-full h-96 p-4 bg-gray-800 text-white rounded" placeholder="Edit your campaign here..." />
    </div>
  );
}