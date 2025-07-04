import React, { useState, useEffect } from "react";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { Menu, X } from "lucide-react";

const Home = () => {
  const [activeSection, setActiveSection] = useState('home');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleGetStarted = () => {
    // Navigate to login page - replace with your actual navigation logic
    window.location.href = "/login?redirect=/dashboard";
  };

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMenuOpen(false);
  };

  useEffect(() => {
    const handleScroll = () => {
      const sections = ['home', 'how-it-works', 'features', 'preview', 'testimonials'];
      const currentSection = sections.find(section => {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          return rect.top <= 100 && rect.bottom >= 100;
        }
        return false;
      });
      if (currentSection) {
        setActiveSection(currentSection);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'how-it-works', label: 'How It Works' },
    { id: 'features', label: 'Features' },
    { id: 'preview', label: 'Preview' },
    { id: 'testimonials', label: 'Testimonials' }
  ];

  return (
    <div className="w-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800 font-sans text-white">
      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 bg-black/20 backdrop-blur-lg border-b border-purple-400/10 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              GenMark
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className={`text-sm font-medium transition-all duration-300 hover:text-purple-400 ${
                    activeSection === item.id 
                      ? 'text-purple-400 border-b-2 border-purple-400 pb-1' 
                      : 'text-white/80'
                  }`}
                >
                  {item.label}
                </button>
              ))}
              <Button 
                onClick={handleGetStarted}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-full shadow-lg hover:from-purple-700 hover:to-pink-700 transition-all"
              >
                Get Started
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden text-white"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden mt-4 py-4 bg-black/40 backdrop-blur-lg rounded-lg">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className={`block w-full text-left px-4 py-2 text-sm font-medium transition-all duration-300 hover:text-purple-400 ${
                    activeSection === item.id ? 'text-purple-400' : 'text-white/80'
                  }`}
                >
                  {item.label}
                </button>
              ))}
              <div className="px-4 py-2">
                <Button 
                  onClick={handleGetStarted}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-full shadow-lg hover:from-purple-700 hover:to-pink-700 transition-all"
                >
                  Get Started
                </Button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="min-h-screen flex flex-col items-center justify-center text-center px-6 pt-20">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-6xl md:text-7xl font-extrabold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent">
                GenMark
              </span>
            </h1>
            <h2 className="text-2xl md:text-3xl font-bold text-white/90 mb-4">
              Personalized Marketing Studio
            </h2>
            <p className="text-xl text-white/70 max-w-3xl mx-auto mb-8 leading-relaxed">
              Unleash AI-driven campaigns tailored for every audience — effortlessly create emails, social posts, videos, and more with cutting-edge AI models.
            </p>
          </div>
          <Button 
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-12 py-6 rounded-full shadow-2xl hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105 text-lg font-semibold"
            onClick={handleGetStarted}
          >
            🚀 Start Creating Now
          </Button>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="min-h-screen flex flex-col justify-center py-20 px-6 bg-gradient-to-br from-slate-800 to-purple-900">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              ✨ How It Works
            </span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Choose Product",
                description: "Pick from existing products or add your own with detailed descriptions and compelling images."
              },
              {
                step: "02", 
                title: "Select Output",
                description: "Decide the output format — email campaigns, social posts, images, or videos, customized for your target audience."
              },
              {
                step: "03",
                title: "Generate & Share", 
                description: "Let GenMark generate high-quality marketing content powered by AI, ready to deploy across all channels."
              }
            ].map((step, idx) => (
              <Card key={idx} className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:transform hover:scale-105">
                <CardHeader className="text-center pb-4">
                  <div className="text-4xl font-bold text-purple-400 mb-4">{step.step}</div>
                  <CardTitle className="text-2xl text-white">{step.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-center text-white/80 text-lg leading-relaxed">
                  {step.description}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section id="features" className="min-h-screen flex flex-col justify-center py-20 px-6 bg-gradient-to-br from-purple-900 to-slate-800">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              🚀 Why Choose GenMark?
            </span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { 
                title: "AI-Powered", 
                description: "Harness cutting-edge models like GPT-4, Stable Diffusion, Sora, and more for unprecedented creative output.",
                icon: "🤖"
              },
              { 
                title: "Fully Customizable", 
                description: "Tailor every aspect of your content — text style, image aesthetics, video formats — exactly how you envision.",
                icon: "🎨"
              },
              { 
                title: "Seamless Workflow", 
                description: "One unified platform to plan, create, preview, and deploy all your marketing materials efficiently.",
                icon: "⚡"
              },
            ].map((feature, idx) => (
              <Card key={idx} className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:transform hover:scale-105">
                <CardHeader className="text-center pb-4">
                  <div className="text-4xl mb-4">{feature.icon}</div>
                  <CardTitle className="text-2xl text-white">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-center text-white/80 text-lg leading-relaxed">
                  {feature.description}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Live Preview / Demos */}
      <section id="preview" className="min-h-screen flex flex-col justify-center py-20 px-6 bg-gradient-to-br from-slate-800 to-purple-900">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">
            <span className="bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
              🎥 Live Preview
            </span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Email + Image Campaign",
                description: "AI-generated email content with stunning visuals"
              },
              {
                title: "Social Media Post",
                description: "Engaging posts optimized for each platform"
              },
              {
                title: "Video Marketing",
                description: "Dynamic video content that captures attention"
              }
            ].map((demo, idx) => (
              <div key={idx} className="group cursor-pointer">
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:transform hover:scale-105 overflow-hidden">
                  <div className="h-64 bg-gradient-to-br from-purple-600/20 to-pink-600/20 flex items-center justify-center relative">
                    <div className="text-6xl text-white/60 group-hover:text-white/80 transition-all duration-300">
                      {idx === 0 && "📧"}
                      {idx === 1 && "📱"}
                      {idx === 2 && "🎬"}
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-white mb-2">{demo.title}</h3>
                    <p className="text-white/70">{demo.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="min-h-screen flex flex-col justify-center py-20 px-6 bg-gradient-to-br from-purple-900 to-slate-800">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              💬 What Our Users Say
            </span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              { 
                name: "Alex Rodriguez", 
                role: "Marketing Director",
                quote: "GenMark completely transformed how we create campaigns. The AI generates content that's not just fast, but genuinely creative and stunning. Our conversion rates have doubled.",
                rating: 5
              },
              { 
                name: "Priya Sharma", 
                role: "Social Media Manager",
                quote: "The flexibility and variety of AI models available is incredible. Our social media engagement has skyrocketed, and we're creating content we never thought possible before.",
                rating: 5
              },
            ].map((testimonial, idx) => (
              <Card key={idx} className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 shadow-2xl hover:shadow-3xl transition-all duration-300">
                <CardContent className="p-8">
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <span key={i} className="text-yellow-400 text-xl">⭐</span>
                    ))}
                  </div>
                  <p className="text-white/90 text-lg italic mb-6 leading-relaxed">
                    "{testimonial.quote}"
                  </p>
                  <div className="text-right">
                    <p className="font-bold text-white text-lg">{testimonial.name}</p>
                    <p className="text-white/70">{testimonial.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center text-white/60 text-sm border-t border-white/10 bg-black/20 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-6">
          <p>© 2025 GenMark. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;