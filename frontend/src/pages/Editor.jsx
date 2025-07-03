import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from "react-router-dom";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Loader2, 
  ArrowLeft, 
  Edit3, 
  Image, 
  FileText,
  Send,
  Bot,
  User,
  CheckCircle,
  X,
  Eye,
  Sparkles
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const Editor = () => {
  // Mock navigation functions for demo
  const chatEndRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const navState = location.state;

  if (!navState) {
    navigate("/dashboard");
    return null;
  }

  const activeTabFromNav = navState.activeTab || 'text';

  const projectId = navState.project_id;

  // Now use `navState` instead of hardcoded values:
  const [project, setProject] = useState({
    name: navState.projectName || 'Project',
    product_name: navState.product_name || '',
    target_audience: navState.target_audience || '',
    output_format: navState.output_format || '',
    status: 'completed'
  });

  const [outputs, setOutputs] = useState({
    text: navState.currentText || 'Your generated text content will appear here...',
    image: navState.currentImageURL || null,
    video: null
  });
  
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(activeTabFromNav);
  
  // Chat state
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: `Hello! I'm here to help you edit your ${activeTab} content. What changes would you like to make?`,
      timestamp: new Date()
    }
  ]);
  
  const [currentMessage, setCurrentMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  
  // Simulated content states for demo
  const [editedText, setEditedText] = useState(outputs.text);
  const [editedImage, setEditedImage] = useState(outputs.image);

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle sending message
  const handleSendMessage = async () => {
    if (!currentMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: currentMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setIsGenerating(true);

    // Simulate AI response
    setTimeout(() => {
      const botResponse = {
        id: Date.now() + 1,
        type: 'bot',
        content: generateBotResponse(currentMessage, activeTab),
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botResponse]);
      setIsGenerating(false);
      
      // Simulate content update
      if (activeTab === 'text') {
        setEditedText(prev => updateTextContent(prev, currentMessage));
      } else if (activeTab === 'image') {
        // For demo, we'll just show a loading state
        setTimeout(() => {
          setEditedImage('https://via.placeholder.com/400x300/8B5CF6/FFFFFF?text=Updated+Image');
        }, 2000);
      }
    }, 1500);
  };

  // Generate bot response based on user input
  const generateBotResponse = (userInput, contentType) => {
    const responses = {
      text: [
        "I've updated your text content based on your request. The changes focus on making it more engaging and targeted to your audience.",
        "Great! I've revised the text to be more compelling. The new version emphasizes key benefits and includes a stronger call-to-action.",
        "Perfect! I've made the text more concise and impactful. The updated version should better resonate with your target audience."
      ],
      image: [
        "I'm working on updating your image based on your specifications. This may take a moment to process.",
        "I've modified the image composition and style according to your feedback. The new version should better align with your brand.",
        "Excellent! I've enhanced the image with the changes you requested. The updated version includes better visual elements."
      ]
    };
    
    const typeResponses = responses[contentType] || responses.text;
    return typeResponses[Math.floor(Math.random() * typeResponses.length)];
  };

  // Update text content based on user input
  const updateTextContent = (originalText, userInput) => {
    // Simple simulation - in reality, this would call an AI service
    if (userInput.toLowerCase().includes('shorter')) {
      return originalText.substring(0, Math.floor(originalText.length * 0.7)) + '...';
    } else if (userInput.toLowerCase().includes('longer')) {
      return originalText + '\n\nAdditional content has been added to provide more detail and context for your audience.';
    } else {
      return originalText.replace(/\b\w+\b/g, (word, index) => {
        return Math.random() > 0.9 ? word.toUpperCase() : word;
      });
    }
  };

  // Handle tab change
  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    const welcomeMessage = {
      id: Date.now(),
      type: 'bot',
      content: `Now editing ${newTab} content. What changes would you like to make?`,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, welcomeMessage]);
  };

  // Handle apply changes
  const handleApplyChanges = () => {
    setOutputs(prev => ({
      ...prev,
      text: editedText,
      image: editedImage
    }));
    
    const confirmMessage = {
      id: Date.now(),
      type: 'bot',
      content: 'Changes applied successfully! Your content has been updated.',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, confirmMessage]);
  };

  // Handle preview toggle
  const togglePreview = () => {
    setPreviewMode(!previewMode);
  };

  // Handle back to preview
  const handleBackToPreview = () => {
    navigate(`/preview`, { 
      state: { 
        ...navState,
        currentText: editedText,
        currentImageURL: editedImage
      } 
    });
  };

  return (
    <div className="min-h-screen w-screen bg-gradient-to-br from-purple-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 pl-2">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{project.name}</h1>
              <p className="text-gray-600">AI-Powered Content Editor</p>
            </div>
          </div>
          <div className="flex items-center gap-3 pr-1">
            <Button
              variant="ghost"
              onClick={handleBackToPreview}
              className="flex items-center gap-2 text-purple-600 hover:text-purple-700"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Preview
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-200px)]">
          {/* Content Panel */}
          <Card className="bg-white/90 border border-purple-200 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-700">
                <Edit3 className="w-5 h-5" />
                Content Editor
              </CardTitle>
            </CardHeader>
            <CardContent className="h-full overflow-hidden">
              <Tabs value={activeTab} onValueChange={handleTabChange}>
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="text" className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Text
                  </TabsTrigger>
                  <TabsTrigger value="image" className="flex items-center gap-2">
                    <Image className="w-4 h-4" />
                    Image
                  </TabsTrigger>
                </TabsList>

                {/* Text Tab */}
                <TabsContent value="text" className="h-96 overflow-y-auto">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-700">Current Text Content</h3>
                      <div className="flex gap-2">
                        <Button
                          onClick={handleApplyChanges}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Apply Changes
                        </Button>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                      <div className="text-sm text-gray-700 whitespace-pre-wrap">
                        {previewMode ? outputs.text : editedText}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Image Tab */}
                <TabsContent value="image" className="h-96 overflow-y-auto">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-700">Current Image</h3>
                      <div className="flex gap-2">
                        <Button
                          onClick={handleApplyChanges}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Apply Changes
                        </Button>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                      {(previewMode ? outputs.image : editedImage) ? (
                        <img
                          src={previewMode ? outputs.image : editedImage}
                          alt="Generated content"
                          className="w-full h-auto rounded-lg shadow-md"
                        />
                      ) : (
                        <div className="h-48 flex items-center justify-center text-gray-500">
                          <div className="text-center">
                            <Image className="w-12 h-12 mx-auto mb-2" />
                            <p>No image generated yet</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Chat Panel */}
          <Card className="bg-white/90 border border-indigo-200 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-indigo-700">
                <Bot className="w-5 h-5" />
                AI Assistant
              </CardTitle>
            </CardHeader>
            <CardContent className="h-full flex flex-col">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto space-y-4 mb-4 max-h-96">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.type === 'user'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {message.type === 'bot' && <Bot className="w-4 h-4 mt-1 flex-shrink-0" />}
                        {message.type === 'user' && <User className="w-4 h-4 mt-1 flex-shrink-0" />}
                        <div className="text-sm">{message.content}</div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {isGenerating && (
                  <div className="flex justify-start">
                    <div className="max-w-xs lg:max-w-md px-4 py-2 rounded-lg bg-gray-100 text-gray-800">
                      <div className="flex items-center gap-2">
                        <Bot className="w-4 h-4" />
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input */}
              <div className="flex gap-2">
                <Input
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  placeholder={`Describe changes for ${activeTab} content...`}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!currentMessage.trim() || isGenerating}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>

              {/* Quick Actions */}
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCurrentMessage("Make it shorter and more concise");
                    setTimeout(handleSendMessage, 100);
                  }}
                  className="text-xs"
                >
                  Make it shorter
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCurrentMessage("Make it more engaging and compelling");
                    setTimeout(handleSendMessage, 100);
                  }}
                  className="text-xs"
                >
                  More engaging
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCurrentMessage("Add more details and context");
                    setTimeout(handleSendMessage, 100);
                  }}
                  className="text-xs"
                >
                  Add details
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Editor;