import React, { useState, useEffect } from "react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui";
import {
  Menu,
  X,
  Github,
  Linkedin,
  BriefcaseBusiness,
  Code,
  Users,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const Home = () => {
  const [activeSection, setActiveSection] = useState("home");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleGetStarted = () => {
    if (user) {
      navigate("/dashboard");
    } else {
      navigate("/login");
    }
  };
  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setIsMenuOpen(false);
  };

  useEffect(() => {
    const handleScroll = () => {
      const sections = [
        "home",
        "how-it-works",
        "features",
        "preview",
        "creators",
      ];
      const currentSection = sections.find((section) => {
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

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    { id: "home", label: "Home" },
    { id: "how-it-works", label: "How It Works" },
    { id: "features", label: "Features" },
    { id: "preview", label: "Preview" },
    { id: "creators", label: "Creators" },
  ];

  return (
    <div className="min-h-screen w-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800 font-sans text-white overflow-x-hidden">
      {/* Navigation Bar */}
      <nav className="fixed top-0 inset-x-0 bg-black/20 backdrop-blur-lg border-b border-white/10 z-50 overflow-x-hidden">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
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
                      ? "text-purple-400 border-b-2 border-purple-400 pb-1"
                      : "text-white/80"
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
                    activeSection === item.id
                      ? "text-purple-400"
                      : "text-white/80"
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
      <section
        id="home"
        className="min-h-screen flex flex-col justify-center px-4 md:px-6 pt-20"
      >
        <div className="max-w-6xl mx-auto w-full">
          <div className="mb-8">
            <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-8 text-left leading-tight">
              Your next breakthrough campaign begins right here.
            </h1>
            <h2 className="text-3xl md:text-6xl font-extrabold mb-4 text-left">
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent">
                GenMark
              </span>
            </h2>
            <h3 className="text-2xl md:text-3xl font-bold text-white/90 mb-4 text-left">
              🎯Personalized Marketing Studio
            </h3>
            <p className="text-xl text-white/70 max-w-3xl mb-8 leading-relaxed text-left">
              Unleash AI-driven campaigns tailored for every audience —
              effortlessly create emails, social posts, videos, and more with
              cutting-edge AI models.
            </p>
          </div>
          <div className="flex justify-start md:justify-start">
            <Button
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-12 py-6 rounded-full shadow-2xl hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105 text-lg font-semibold"
              onClick={handleGetStarted}
            >
              🚀 Start Creating Now
            </Button>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section
        id="how-it-works"
        className="min-h-screen flex flex-col justify-center py-20 px-4 md:px-6 bg-gradient-to-br from-slate-800 to-purple-900"
      >
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              ✨ How It Works
            </span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              {
                step: "01",
                title: "Upload Customer Data",
                description:
                  "Import your customer dataset to identify and segment your target audience effectively.",
              },
              {
                step: "02",
                title: "Set Campaign Goals",
                description:
                  "Select your target audience, product to promote, and preferred output formats like email, images, or videos.",
              },
              {
                step: "03",
                title: "Generate Content",
                description:
                  "AI agents create personalized marketing content in multiple formats — text, images, and video — tailored to your audience.",
              },
              {
                step: "04",
                title: "Edit, Export & Automate",
                description:
                  "Easily edit generated content, export it in your desired format, or automate mail campaigns directly from the dashboard.",
              },
            ].map((step, idx) => (
              <Card
                key={idx}
                className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:transform hover:scale-105"
              >
                <CardHeader className="text-center pb-4">
                  <div className="text-4xl font-bold text-purple-400 mb-4">
                    {step.step}
                  </div>
                  <CardTitle className="text-2xl text-white">
                    {step.title}
                  </CardTitle>
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
      <section
        id="features"
        className="min-h-screen flex flex-col justify-center py-20 px-4 md:px-6 bg-gradient-to-br from-purple-900 to-slate-800"
      >
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
                description:
                  "Harness cutting-edge models like GPT-4, Stable Diffusion, Sora, and more for unprecedented creative output.",
                icon: "🤖",
              },
              {
                title: "Fully Customizable",
                description:
                  "Tailor every aspect of your content — text style, image aesthetics, video formats — exactly how you envision.",
                icon: "🎨",
              },
              {
                title: "Seamless Workflow",
                description:
                  "One unified platform to plan, create, preview, and deploy all your marketing materials efficiently.",
                icon: "⚡",
              },
            ].map((feature, idx) => (
              <Card
                key={idx}
                className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:transform hover:scale-105"
              >
                <CardHeader className="text-center pb-4">
                  <div className="text-4xl mb-4">{feature.icon}</div>
                  <CardTitle className="text-2xl text-white">
                    {feature.title}
                  </CardTitle>
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
<section
  id="preview"
  className="min-h-screen flex flex-col justify-center py-20 px-4 md:px-6 bg-gradient-to-br from-slate-800 to-purple-900"
>
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
          description: "AI-generated email content with stunning visuals",
          videoSrc: "/videos/email-campaign.mp4",
        },
        {
          title: "AI-Powered Content Editing",
          description: "Refine your copy with intelligent suggestions and on-brand tone",
          videoSrc: "/videos/editing-demo.mp4",
        },
        {
          title: "Video Marketing",
          description: "Dynamic video content that captures attention",
          videoSrc: "/videos/marketing-video.mp4",
        },
      ].map((demo, idx) => (
        <div key={idx} className="group cursor-pointer">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 shadow-2xl hover:shadow-3xl transition-all duration-300 overflow-hidden">
            <div className="h-64 relative overflow-hidden">
              <video
                src={demo.videoSrc}
                className="w-full h-full object-cover"
                muted
                playsInline
                loop
                autoPlay
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold text-white mb-2">
                {demo.title}
              </h3>
              <p className="text-white/70">{demo.description}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
</section>


      {/* Creators Section */}
      <section
        id="creators"
        className="min-h-screen flex flex-col justify-center py-20 px-4 md:px-6 bg-gradient-to-br from-purple-900 to-slate-800"
      >
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-8">
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              👥 Meet The Creators
            </span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                name: "Ishaan",
                role: "Co-Creator",
                description:
                  "Passionate about AI and creating tools that empower marketers to achieve extraordinary results.",
                github: "https://github.com/984-ISHU/",
                linkedin: "https://linkedin.com/in/ishaanmc",
                avatar: "👨‍💻",
                portfolio: "",
              },
              {
                name: "Karan",
                role: "Co-Creator",
                description:
                  "Specializes in machine learning and building scalable AI solutions that transform how businesses operate.",
                github: "https://github.com/sladereaperr",
                linkedin: "https://www.linkedin.com/in/karanjadhav2003/",
                avatar: "👨‍💻",
                portfolio: "https://karanjadhav2003.vercel.app/",
              },
            ].map((creator, idx) => (
              <Card
                key={idx}
                className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:transform hover:scale-105"
              >
                <CardContent className="p-8 text-center">
                  <div className="text-6xl mb-6">{creator.avatar}</div>
                  <h3 className="text-2xl font-bold text-white mb-2">
                    {creator.name}
                  </h3>
                  <p className="text-purple-400 font-semibold mb-4">
                    {creator.role}
                  </p>
                  <p className="text-white/80 text-lg leading-relaxed mb-6">
                    {creator.description}
                  </p>
                  <div className="flex justify-center space-x-4">
                    <a
                      href={creator.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-white/10 hover:bg-white/20 p-3 rounded-full transition-all duration-300 group"
                    >
                      <Github className="w-6 h-6 text-white/70 group-hover:text-white transition-colors" />
                    </a>
                    <a
                      href={creator.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-white/10 hover:bg-white/20 p-3 rounded-full transition-all duration-300 group"
                    >
                      <Linkedin className="w-6 h-6 text-white/70 group-hover:text-white transition-colors" />
                    </a>
                    {creator.portfolio && (
                      <a
                        href={creator.portfolio}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-white/10 hover:bg-white/20 p-3 rounded-full transition-all duration-300 group"
                      >
                        <BriefcaseBusiness className="w-6 h-6 text-white/70 group-hover:text-white transition-colors" />
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center text-white/60 text-sm border-t border-white/10 bg-black/20 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <p>© 2025 GenMark. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
