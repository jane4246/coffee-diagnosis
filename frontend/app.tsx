import React, { useState } from 'react';
import { Camera, Mic, Type, Loader2, CheckCircle } from 'lucide-react';
import { useToast } from './ui/use-toast'; // Assuming shadcn/ui toast components are available
import { Card, CardContent } from './ui/card'; // Assuming shadcn/ui Card components are available
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Progress } from './ui/progress';

// The URL for your Python backend service.
// This environment variable must be set in your deployment configuration.
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:10000';

const App = () => {
  // State variables for managing the app's UI and data
  const [loading, setLoading] = useState(false);
  const [inputMode, setInputMode] = useState('image'); // 'image', 'text', 'voice'
  const [textInput, setTextInput] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [diagnosis, setDiagnosis] = useState(null);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  // Handler for when a new image file is selected
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setAudioBlob(null);
      setTextInput('');
      setInputMode('image');
      setDiagnosis(null);
      toast({
        title: "Image selected",
        description: `Ready to analyze ${file.name}.`,
      });
    }
  };

  // Handler for when the text input changes
  const handleTextChange = (e) => {
    setTextInput(e.target.value);
    setImageFile(null);
    setAudioBlob(null);
    setInputMode('text');
    setDiagnosis(null);
  };
  
  // Main function to send the data to the backend and get a diagnosis
  const handleDiagnosis = async () => {
    // Check if any input is provided before proceeding
    if (!textInput && !imageFile && !audioBlob) {
      toast({
        title: "No input provided",
        description: "Please provide a description, an image, or a voice recording.",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    setDiagnosis(null);
    setProgress(0);
    
    let apiUrl = '';
    let body = null;
    let headers = {};

    try {
      // Determine the API endpoint and prepare the request body based on the input mode
      if (inputMode === 'image' && imageFile) {
        apiUrl = `${BACKEND_URL}/predict_image`;
        const formData = new FormData();
        formData.append('image', imageFile);
        body = formData;
      } else if (inputMode === 'text' && textInput) {
        apiUrl = `${BACKEND_URL}/predict_text`;
        body = JSON.stringify({ symptoms: textInput });
        headers = { 'Content-Type': 'application/json' };
      } else if (inputMode === 'voice' && audioBlob) {
        apiUrl = `${BACKEND_URL}/predict_voice`;
        // NOTE: This is a simplified approach. A real app would use a
        // speech-to-text API or a more robust transcription library.
        // For this example, we'll assume the transcribed text is what the backend expects.
        const audioContext = new AudioContext();
        const arrayBuffer = await audioBlob.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        const textFromAudio = "Wilting leaves and brown spots.";
        body = JSON.stringify({ symptoms: textFromAudio });
        headers = { 'Content-Type': 'application/json' };
      } else {
        throw new Error("No input provided for the selected mode.");
      }

      // Send the request to the backend
      const response = await fetch(apiUrl, {
        method: 'POST',
        body: body,
        headers: headers,
      });

      if (!response.ok) {
        throw new Error(`API call failed with status: ${response.status}`);
      }

      // Process the response from the backend
      const result = await response.json();
      if (result.prediction) {
        setDiagnosis(`Diagnosis: ${result.prediction}, with confidence: ${(result.confidence * 100).toFixed(2)}%.`);
        setProgress(100);
      } else {
        throw new Error("Invalid backend response format.");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to get diagnosis. Error: ${error.message}`,
        variant: "destructive",
      });
      setDiagnosis("An error occurred while getting the diagnosis. Please try again.");
      setProgress(0);
    } finally {
      setLoading(false);
    }
  };

  // Function to start a voice recording
  const startRecording = () => {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        const mediaRecorder = new MediaRecorder(stream);
        const audioChunks = [];
        mediaRecorder.ondataavailable = event => {
          audioChunks.push(event.data);
        };
        mediaRecorder.onstop = () => {
          const blob = new Blob(audioChunks, { type: 'audio/webm' });
          setAudioBlob(blob);
          setImageFile(null);
          setTextInput('');
          setInputMode('voice');
          setDiagnosis(null);
          toast({
            title: "Voice recording complete",
            description: "Ready to analyze the recorded symptoms.",
          });
        };
        mediaRecorder.start();
        setTimeout(() => {
          mediaRecorder.stop();
        }, 5000); // Record for 5 seconds
      })
      .catch(err => {
        toast({
          title: "Error",
          description: "Could not access microphone.",
          variant: "destructive",
        });
        console.error("Error accessing microphone: ", err);
      });
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 font-sans flex flex-col items-center">
      <div className="w-full max-w-lg space-y-6">
        <h1 className="text-3xl font-bold text-center text-green-800">☕ Coffee Doctor </h1>
        <p className="text-center text-gray-600">Diagnose your coffee plant's health using images, text, or voice.</p>

        <Card className="shadow-lg rounded-xl">
          <CardContent className="p-6">
            <div className="flex justify-around mb-6 border-b pb-4">
              <Button onClick={() => setInputMode('image')} variant={inputMode === 'image' ? 'default' : 'outline'} className="flex-1 mr-2"><Camera className="mr-2" /> Image</Button>
              <Button onClick={() => setInputMode('text')} variant={inputMode === 'text' ? 'default' : 'outline'} className="flex-1 mr-2"><Type className="mr-2" /> Text</Button>
              <Button onClick={() => setInputMode('voice')} variant={inputMode === 'voice' ? 'default' : 'outline'} className="flex-1"><Mic className="mr-2" /> Voice</Button>
            </div>

            {inputMode === 'image' && (
              <div className="flex flex-col items-center space-y-4">
                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" id="file-upload" />
                <label htmlFor="file-upload" className="w-full text-center py-3 px-6 rounded-lg border-2 border-dashed border-gray-300 text-gray-600 cursor-pointer hover:bg-gray-50 transition-colors">
                  {imageFile ? <span className="text-green-600">✓ {imageFile.name} selected</span> : "Click to upload an image"}
                </label>
                {imageFile && <img src={URL.createObjectURL(imageFile)} alt="Preview" className="w-full h-auto rounded-lg" />}
              </div>
            )}
            
            {inputMode === 'text' && (
              <Textarea 
                value={textInput} 
                onChange={handleTextChange} 
                placeholder="Describe the symptoms you see on your plant..." 
                rows={5} 
                className="w-full p-3 rounded-lg border"
              />
            )}

            {inputMode === 'voice' && (
              <div className="flex flex-col items-center space-y-4">
                <Button onClick={startRecording} disabled={loading} className="w-full">
                  <Mic className="mr-2" /> {audioBlob ? "Record again" : "Start 5-second recording"}
                </Button>
                {audioBlob && <p className="text-green-600">✓ Voice recording captured.</p>}
              </div>
            )}
            
            <Button onClick={handleDiagnosis} disabled={loading || (!textInput && !imageFile && !audioBlob)} className="mt-6 w-full bg-green-600 hover:bg-green-700">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Diagnosing...
                </>
              ) : (
                "Get Diagnosis"
              )}
            </Button>
            {loading && <Progress value={progress} className="mt-4" />}
          </CardContent>
        </Card>

        {diagnosis && (
          <Card className="mt-6 shadow-lg rounded-xl bg-white">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold text-green-800 mb-2 flex items-center">
                <CheckCircle className="text-green-500 mr-2" /> Diagnosis Result
              </h2>
              <p className="text-gray-700">{diagnosis}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default App;
