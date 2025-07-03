// src/pages/Edit.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  RefreshCw, 
  Save, 
  ArrowLeft, 
  Edit3, 
  Image as ImageIcon, 
  Video,
  FileText,
  Sparkles,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  getProject,
  getProjectOutputs,
  regenerateText,
  regenerateImage,
  regenerateVideo,
  updateTextContent,
  getRegenerationStatus,
  getGeneratedImage,
  triggerWorkflow
} from '../lib/api';
import { toast } from 'sonner';

const Editor = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  
  // State management
  const [project, setProject] = useState(null);
  const [outputs, setOutputs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState({
    text: false,
    image: false,
    video: false
  });
  const [activeTab, setActiveTab] = useState('text');
  
  // Edit states
  const [textModifications, setTextModifications] = useState('');
  const [imageModifications, setImageModifications] = useState('');
  const [videoModifications, setVideoModifications] = useState('');
  const [directTextEdit, setDirectTextEdit] = useState('');
  const [isEditingDirectly, setIsEditingDirectly] = useState(false);
  
  // Image preview
  const [imagePreview, setImagePreview] = useState(null);

  // Load project and outputs data
  useEffect(() => {
    const loadProjectData = async () => {
      try {
        setLoading(true);
        
        const [projectRes, outputsRes] = await Promise.all([
          getProject(projectId),
          getProjectOutputs(projectId)
        ]);
        
        setProject(projectRes.data);
        setOutputs(outputsRes.data);
        
        // Set initial text for direct editing
        if (outputsRes.data?.text) {
          setDirectTextEdit(outputsRes.data.text);
        }
        
        // Load image preview if available
        if (outputsRes.data?.image) {
          loadImagePreview(outputsRes.data.image);
        }
        
      } catch (error) {
        console.error('Error loading project data:', error);
        toast.error('Failed to load project data');
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      loadProjectData();
    }
  }, [projectId]);

  // Load image preview
  const loadImagePreview = async (imageId) => {
    try {
      const response = await getGeneratedImage(imageId);
      const imageUrl = URL.createObjectURL(response.data);
      setImagePreview(imageUrl);
    } catch (error) {
      console.error('Error loading image preview:', error);
    }
  };

  // Handle text regeneration
  const handleTextRegeneration = async () => {
    if (!textModifications.trim()) {
      toast.error('Please provide modification instructions');
      return;
    }

    try {
      setRegenerating(prev => ({ ...prev, text: true }));
      
      const payload = {
        current_output: outputs.text,
        modifications: textModifications,
        additional_context: {
          product_name: project.product_name,
          target_audience: project.target_audience,
          output_format: project.output_format
        }
      };
      
      await regenerateText(projectId, payload);
      
      // Poll for completion
      await pollRegenerationStatus('text');
      
      toast.success('Text regenerated successfully');
      setTextModifications('');
      
    } catch (error) {
      console.error('Error regenerating text:', error);
      toast.error('Failed to regenerate text');
    } finally {
      setRegenerating(prev => ({ ...prev, text: false }));
    }
  };

  // Handle image regeneration
  const handleImageRegeneration = async () => {
    if (!imageModifications.trim()) {
      toast.error('Please provide modification instructions');
      return;
    }

    try {
      setRegenerating(prev => ({ ...prev, image: true }));
      
      const payload = {
        current_output: outputs.image,
        modifications: imageModifications,
        additional_context: {
          product_name: project.product_name,
          target_audience: project.target_audience,
          output_format: project.output_format
        }
      };
      
      await regenerateImage(projectId, payload);
      
      // Poll for completion
      await pollRegenerationStatus('image');
      
      toast.success('Image regenerated successfully');
      setImageModifications('');
      
    } catch (error) {
      console.error('Error regenerating image:', error);
      toast.error('Failed to regenerate image');
    } finally {
      setRegenerating(prev => ({ ...prev, image: false }));
    }
  };

  // Handle video regeneration
  const handleVideoRegeneration = async () => {
    if (!videoModifications.trim()) {
      toast.error('Please provide modification instructions');
      return;
    }

    try {
      setRegenerating(prev => ({ ...prev, video: true }));
      
      const payload = {
        current_output: outputs.video,
        modifications: videoModifications,
        additional_context: {
          product_name: project.product_name,
          target_audience: project.target_audience,
          output_format: project.output_format
        }
      };
      
      await regenerateVideo(projectId, payload);
      
      // Poll for completion
      await pollRegenerationStatus('video');
      
      toast.success('Video regenerated successfully');
      setVideoModifications('');
      
    } catch (error) {
      console.error('Error regenerating video:', error);
      toast.error('Failed to regenerate video');
    } finally {
      setRegenerating(prev => ({ ...prev, video: false }));
    }
  };

  // Handle direct text update
  const handleDirectTextUpdate = async () => {
    if (!directTextEdit.trim()) {
      toast.error('Text content cannot be empty');
      return;
    }

    try {
      await updateTextContent(projectId, { text: directTextEdit });
      setOutputs(prev => ({ ...prev, text: directTextEdit }));
      setIsEditingDirectly(false);
      toast.success('Text updated successfully');
    } catch (error) {
      console.error('Error updating text:', error);
      toast.error('Failed to update text');
    }
  };

  // Poll regeneration status
  const pollRegenerationStatus = async (type) => {
    const maxAttempts = 30;
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      try {
        const response = await getRegenerationStatus(projectId);
        
        if (response.data.status === 'completed') {
          // Refresh outputs
          const outputsRes = await getProjectOutputs(projectId);
          setOutputs(outputsRes.data);
          
          // Refresh image preview if image was regenerated
          if (type === 'image' && outputsRes.data?.image) {
            loadImagePreview(outputsRes.data.image);
          }
          
          return;
        }
        
        if (response.data.status === 'failed') {
          throw new Error('Regeneration failed');
        }
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        attempts++;
        
      } catch (error) {
        console.error('Error polling status:', error);
        break;
      }
    }
    
    throw new Error('Regeneration timed out');
  };

  // Handle complete regeneration
  const handleCompleteRegeneration = async () => {
    try {
      setRegenerating({ text: true, image: true, video: true });
      await triggerWorkflow(projectId, 'regenerate');
      
      // Poll for completion
      await pollRegenerationStatus('complete');
      
      toast.success('All content regenerated successfully');
    } catch (error) {
      console.error('Error in complete regeneration:', error);
      toast.error('Failed to regenerate content');
    } finally {
      setRegenerating({ text: false, image: false, video: false });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!project || !outputs) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <h2 className="text-xl font-semibold mb-2">Project Not Found</h2>
          <p className="text-gray-600 mb-4">The project you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/')}>Go Back Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate(`/project/${projectId}`)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Project
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{project.name}</h1>
            <p className="text-gray-600">Edit Marketing Content</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{project.status}</Badge>
          <Button
            onClick={handleCompleteRegeneration}
            disabled={regenerating.text || regenerating.image || regenerating.video}
            className="flex items-center gap-2"
          >
            {regenerating.text || regenerating.image || regenerating.video ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            Regenerate All
          </Button>
        </div>
      </div>

      {/* Project Info */}
      <Card>
        <CardHeader>
          <CardTitle>Project Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-sm font-medium">Product</Label>
              <p className="text-gray-700">{project.product_name}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Target Audience</Label>
              <p className="text-gray-700">{project.target_audience}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Output Format</Label>
              <p className="text-gray-700">{project.output_format}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Editor */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Edit3 className="w-5 h-5" />
            Content Editor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="text" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Text
              </TabsTrigger>
              <TabsTrigger value="image" className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                Image
              </TabsTrigger>
              <TabsTrigger value="video" className="flex items-center gap-2">
                <Video className="w-4 h-4" />
                Video
              </TabsTrigger>
            </TabsList>

            {/* Text Tab */}
            <TabsContent value="text" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Current Text Content</Label>
                  {isEditingDirectly ? (
                    <div className="space-y-2">
                      <Textarea
                        value={directTextEdit}
                        onChange={(e) => setDirectTextEdit(e.target.value)}
                        rows={6}
                        className="mt-2"
                      />
                      <div className="flex gap-2">
                        <Button onClick={handleDirectTextUpdate} className="flex items-center gap-2">
                          <Save className="w-4 h-4" />
                          Save Changes
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setIsEditingDirectly(false);
                            setDirectTextEdit(outputs.text);
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2 p-4 bg-gray-50 rounded-lg">
                      <p className="text-gray-700 whitespace-pre-wrap">{outputs.text}</p>
                      <Button
                        variant="outline"
                        onClick={() => setIsEditingDirectly(true)}
                        className="mt-2 flex items-center gap-2"
                      >
                        <Edit3 className="w-4 h-4" />
                        Edit Directly
                      </Button>
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="text-modifications" className="text-sm font-medium">
                    AI Regeneration Instructions
                  </Label>
                  <Textarea
                    id="text-modifications"
                    placeholder="Describe what changes you want to make to the text content..."
                    value={textModifications}
                    onChange={(e) => setTextModifications(e.target.value)}
                    rows={4}
                    className="mt-2"
                  />
                  <Button
                    onClick={handleTextRegeneration}
                    disabled={regenerating.text || !textModifications.trim()}
                    className="mt-2 flex items-center gap-2"
                  >
                    {regenerating.text ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                    Regenerate Text
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* Image Tab */}
            <TabsContent value="image" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Current Image</Label>
                  {imagePreview ? (
                    <div className="mt-2 p-4 bg-gray-50 rounded-lg">
                      <img
                        src={imagePreview}
                        alt="Generated content"
                        className="max-w-full h-auto rounded-lg"
                      />
                    </div>
                  ) : (
                    <div className="mt-2 p-8 bg-gray-50 rounded-lg text-center">
                      <ImageIcon className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                      <p className="text-gray-500">No image generated yet</p>
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="image-modifications" className="text-sm font-medium">
                    AI Regeneration Instructions
                  </Label>
                  <Textarea
                    id="image-modifications"
                    placeholder="Describe what changes you want to make to the image..."
                    value={imageModifications}
                    onChange={(e) => setImageModifications(e.target.value)}
                    rows={4}
                    className="mt-2"
                  />
                  <Button
                    onClick={handleImageRegeneration}
                    disabled={regenerating.image || !imageModifications.trim()}
                    className="mt-2 flex items-center gap-2"
                  >
                    {regenerating.image ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                    Regenerate Image
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* Video Tab */}
            <TabsContent value="video" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Current Video</Label>
                  {outputs.video ? (
                    <div className="mt-2 p-4 bg-gray-50 rounded-lg">
                      <video
                        src={outputs.video}
                        controls
                        className="max-w-full h-auto rounded-lg"
                      />
                    </div>
                  ) : (
                    <div className="mt-2 p-8 bg-gray-50 rounded-lg text-center">
                      <Video className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                      <p className="text-gray-500">No video generated yet</p>
                    </div>
                  )}
                </div>

                <Alert>
                  <AlertCircle className="w-4 h-4" />
                  <AlertDescription>
                    Video generation is currently in development. This feature will be available soon.
                  </AlertDescription>
                </Alert>

                <div>
                  <Label htmlFor="video-modifications" className="text-sm font-medium">
                    AI Regeneration Instructions
                  </Label>
                  <Textarea
                    id="video-modifications"
                    placeholder="Describe what changes you want to make to the video..."
                    value={videoModifications}
                    onChange={(e) => setVideoModifications(e.target.value)}
                    rows={4}
                    className="mt-2"
                    disabled
                  />
                  <Button
                    onClick={handleVideoRegeneration}
                    disabled={true}
                    className="mt-2 flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Regenerate Video (Coming Soon)
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Generation Status */}
      {(regenerating.text || regenerating.image || regenerating.video) && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-blue-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Regenerating content...</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Editor;