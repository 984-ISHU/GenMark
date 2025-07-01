import React from "react";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { useNavigate } from "react-router-dom";

const HomePage = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate("/login?redirect=/dashboard");
  };

  return (
    <div className="min-h-screen w-screen bg-gradient-to-br from-purple-300 via-pink-400 to-indigo-300 font-sans text-gray-800">
      
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center text-center py-20 px-6">
        <h1 className="text-5xl font-extrabold text-purple-700 mb-4">
          GenMark: Personalized Marketing Studio
        </h1>
        <p className="text-lg text-white/90 max-w-2xl mb-6">
          Unleash AI-driven campaigns tailored for every audience — effortlessly create emails, social posts, videos, and more.
        </p>
        <Button className="bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white px-8 py-4 rounded-3xl shadow-lg hover:from-purple-700 hover:to-fuchsia-700 transition-all" onClick={handleGetStarted}>
          🚀 Get Started
        </Button>
      </section>

      {/* How it Works */}
      <section className="py-16 px-8">
        <h2 className="text-3xl font-bold text-center text-purple-700 mb-10">✨ How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {["Choose Product", "Select Output", "Generate & Share"].map((step, idx) => (
            <Card key={idx} className="bg-white/70 backdrop-blur-sm rounded-2xl border border-purple-100 shadow-lg hover:shadow-xl transition-all">
              <CardHeader>
                <CardTitle className="text-xl text-center">{step}</CardTitle>
              </CardHeader>
              <CardContent className="text-center text-gray-700">
                {idx === 0 && "Pick from existing products or add your own with details and images."}
                {idx === 1 && "Decide the output format — email, post, image, or video, customized for your audience."}
                {idx === 2 && "Let GenMark generate high-quality marketing content ready to deploy."}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Key Features */}
      <section className="py-16 px-8 bg-white/20 backdrop-blur-sm">
        <h2 className="text-3xl font-bold text-center text-indigo-700 mb-10">🚀 Why Choose GenMark?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {[
            { title: "AI-Powered", desc: "Harness top models like GPT-4, Stable Diffusion, Sora, and more." },
            { title: "Customizable", desc: "Tailor outputs exactly how you want — text, image, video formats." },
            { title: "Effortless Workflow", desc: "One platform to plan, create, and preview marketing material." },
          ].map((feature, idx) => (
            <Card key={idx} className="bg-white/70 rounded-2xl border border-indigo-100 shadow-lg hover:shadow-xl transition-all">
              <CardHeader>
                <CardTitle className="text-xl text-center">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-center text-gray-700">{feature.desc}</CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Live Preview / Demos */}
      <section className="py-16 px-8">
        <h2 className="text-3xl font-bold text-center text-pink-700 mb-10">🎥 Live Preview</h2>
        <div className="flex flex-wrap justify-center gap-6">
          <div className="w-72 h-48 bg-white/60 rounded-xl shadow-md flex items-center justify-center text-gray-600">
            Demo 1 (Email + Image)
          </div>
          <div className="w-72 h-48 bg-white/60 rounded-xl shadow-md flex items-center justify-center text-gray-600">
            Demo 2 (Social Post)
          </div>
          <div className="w-72 h-48 bg-white/60 rounded-xl shadow-md flex items-center justify-center text-gray-600">
            Demo 3 (Video Teaser)
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 px-8 bg-white/10 backdrop-blur-sm">
        <h2 className="text-3xl font-bold text-center text-purple-700 mb-10">💬 What Our Users Say</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {[
            { name: "Alex R.", quote: "GenMark transformed how we create campaigns — fast, creative, and stunning outputs." },
            { name: "Priya S.", quote: "Love the flexibility and model choices. Our social media engagement skyrocketed!" },
          ].map((t, idx) => (
            <Card key={idx} className="bg-white/70 rounded-2xl border border-purple-100 shadow-lg hover:shadow-xl transition-all">
              <CardContent className="p-6">
                <p className="italic mb-4">"{t.quote}"</p>
                <p className="font-bold text-right">— {t.name}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 text-center text-white/80 text-sm">
        © 2025 GenMark. All rights reserved.
      </footer>
    </div>
  );
};

export default HomePage;
