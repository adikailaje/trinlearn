
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { VideoPlayer } from './components/VideoPlayer';
import { ResponseItem } from './components/ResponseItem';
import { Loader } from './components/Loader';
import { ToggleSwitch } from './components/ToggleSwitch';
import { generateDescriptionFromFrame } from './services/geminiService';
import { rememberedMachinesService } from './services/rememberedMachinesService';
import { GeminiResponse, AppStatus, ParsedMachineInfo, AppProps } from './types';
import { DEFAULT_PROMPT, SUMMARIZE_UNKNOWN_PROMPT, GEMINI_MODEL_NAME, CAPTURE_INTERVAL_MS, IMAGE_QUALITY, IMAGE_SCALE_FACTOR, CHANGE_THRESHOLD } from './constants';
import { CameraIcon, StopIcon, ExclamationTriangleIcon, InformationCircleIcon, LogoutIcon, UserCircleIcon, BrainIcon, EyeIcon, SparklesIcon, DocumentTextIcon, BookmarkIcon } from './components/Icons';
import { useAuth } from './hooks/useAuth'; 

// Helper function to calculate pixel differences
const calculatePixelDifference = (imgData1: ImageData, imgData2: ImageData): number => {
  const data1 = imgData1.data;
  const data2 = imgData2.data;
  const len = data1.length;
  let difference = 0;

  if (imgData1.width !== imgData2.width || imgData1.height !== imgData2.height) {
    console.warn("Image dimensions mismatch for change detection. Assuming change.");
    return Number.MAX_SAFE_INTEGER;
  }

  const step = 4; // Process R, G, B, A values
  for (let i = 0; i < len; i += step) {
    difference += Math.abs(data1[i] - data2[i]); // R
    difference += Math.abs(data1[i+1] - data2[i+1]); // G
    difference += Math.abs(data1[i+2] - data2[i+2]); // B
  }
  return difference;
};


// Helper function to parse make/model/confidence/identifier response
const parseMachineInfo = (description: string): ParsedMachineInfo => {
  const lowerDesc = description.toLowerCase();

  let make: string | null = null;
  let model: string | null = null;
  let confidence: number | null = null;
  let machineNumber: string | null = null;
  let isMachineFormat = false;

  const confidencePattern = /Confidence:\s*(\d{1,3})\s*%/i;
  const confidenceMatch = description.match(confidencePattern);
  if (confidenceMatch && confidenceMatch[1]) {
    const parsedConfidence = parseInt(confidenceMatch[1], 10);
    if (!isNaN(parsedConfidence) && parsedConfidence >= 0 && parsedConfidence <= 100) {
      confidence = parsedConfidence;
    }
  }
  
  const identifierPattern = /(?:Identifier|Serial\sNumber|S\/N|Machine\sNo\.?):\s*([a-zA-Z0-9\-\_./]+)/i;
  const identifierMatch = description.match(identifierPattern);
  if (identifierMatch && identifierMatch[1]) {
    machineNumber = identifierMatch[1].trim();
  }


  if (lowerDesc.includes("not a machine")) {
    return { make: null, model: null, machineNumber, isMachineFormat: false, confidence };
  }

  const makePattern = /Make:\s*([^,]+)/i;
  const modelPattern = /Model:\s*([^,]+)/i;

  const makeMatch = description.match(makePattern);
  if (makeMatch && makeMatch[1]) {
    let extractedMake = makeMatch[1].trim();
    extractedMake = extractedMake.replace(/,\s*(confidence|identifier):.*$/i, '').trim();
     if (extractedMake.endsWith(',')) {
        extractedMake = extractedMake.slice(0, -1).trim();
      }
    if (extractedMake.toLowerCase() !== 'unknown' && extractedMake.toLowerCase() !== 'none' && extractedMake.length > 0) {
      make = extractedMake;
    }
    isMachineFormat = true;
  }

  const modelMatch = description.match(modelPattern);
  if (modelMatch && modelMatch[1]) {
    let extractedModel = modelMatch[1].trim();
    extractedModel = extractedModel.replace(/,\s*(confidence|identifier):.*$/i, '').trim();
    if (extractedModel.endsWith(',')) {
      extractedModel = extractedModel.slice(0, -1).trim();
    }
    const cleanModel = extractedModel.endsWith('.') ? extractedModel.slice(0, -1) : extractedModel;
    if (cleanModel.toLowerCase() !== 'unknown' && cleanModel.toLowerCase() !== 'none' && cleanModel.length > 0) {
      model = cleanModel;
    }
    isMachineFormat = true;
  }
  return { make, model, machineNumber, isMachineFormat, confidence };
};


const App: React.FC<AppProps> = ({ onNavigateToProfile, onNavigateToSavedMachines, onNavigateToMachineDetail, currentUser }) => {
  const { logout } = useAuth();
  const [appStatus, setAppStatus] = useState<AppStatus>(AppStatus.Idle);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [responses, setResponses] = useState<GeminiResponse[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showSuggestion, setShowSuggestion] = useState<boolean>(false);
  const [identifiedMachineForManualSearch, setIdentifiedMachineForManualSearch] = useState<{make: string; model: string} | null>(null);

  const [rememberMachinesEnabled, setRememberMachinesEnabled] = useState<boolean>(false);
  const [userRememberedMachinesCount, setUserRememberedMachinesCount] = useState<number>(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const intervalIdRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastAnalyzedFrameImageDataRef = useRef<ImageData | null>(null);
  const appStatusRef = useRef(appStatus);

  useEffect(() => {
    appStatusRef.current = appStatus;
  }, [appStatus]);

  const fetchRememberedMachinesCount = useCallback(async () => {
    if (currentUser) {
      try {
        const machines = await rememberedMachinesService.getRememberedMachines(currentUser.id);
        setUserRememberedMachinesCount(machines.length);
      } catch (e) {
        console.error("Failed to load remembered machines count:", e);
        setUserRememberedMachinesCount(0);
      }
    } else {
      setUserRememberedMachinesCount(0);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      rememberedMachinesService.getRememberToggleState(currentUser.id)
        .then(setEnabled => setRememberMachinesEnabled(setEnabled))
        .catch(e => console.error("Failed to load remember toggle state:", e));

      fetchRememberedMachinesCount();
    } else {
      setRememberMachinesEnabled(false);
      setUserRememberedMachinesCount(0);
    }
  }, [currentUser, fetchRememberedMachinesCount]);

  const handleToggleRememberMachines = async (enabled: boolean) => {
    if (!currentUser) return;
    setRememberMachinesEnabled(enabled);
    try {
      await rememberedMachinesService.setRememberToggleState(currentUser.id, enabled);
    } catch (e) {
      console.error("Failed to save remember toggle state:", e);
    }
  };

  const handleAddRememberedMachine = useCallback(async (rawGeminiDescription: string) => {
    if (!currentUser) return;
    try {
      const parsed = parseMachineInfo(rawGeminiDescription);
      let storageDesc: string;

      if (parsed.isMachineFormat) {
        if (parsed.make && parsed.model) {
          storageDesc = `Make: ${parsed.make}, Model: ${parsed.model}`;
          if(parsed.machineNumber) storageDesc += `, Identifier: ${parsed.machineNumber}`;
        } else if (parsed.make) {
          storageDesc = `Make: ${parsed.make}`;
           if(parsed.machineNumber) storageDesc += `, Identifier: ${parsed.machineNumber}`;
        } else if (parsed.model) {
          storageDesc = `Model: ${parsed.model}`;
           if(parsed.machineNumber) storageDesc += `, Identifier: ${parsed.machineNumber}`;
        } else {
          storageDesc = "Machine (Make/Model Unknown)";
          if(parsed.machineNumber) storageDesc += `, Identifier: ${parsed.machineNumber}`;
        }
      } else if (rawGeminiDescription.toLowerCase().includes("not a machine")) {
        storageDesc = "Not a machine";
      } else {
        storageDesc = rawGeminiDescription.replace(/,?\s*Confidence:\s*\d{1,3}\s*%/i, "").replace(/,\s*Identifier:\s*[a-zA-Z0-9\-\_./]+/i, "").trim();
      }

      await rememberedMachinesService.addRememberedMachine(currentUser.id, storageDesc);
      fetchRememberedMachinesCount();
    } catch (e) {
      console.error("Failed to add remembered machine:", e);
      throw e;
    }
  }, [currentUser, fetchRememberedMachinesCount]);


  const getBase64FromDataUrl = (dataUrl: string): string => {
    return dataUrl.substring(dataUrl.indexOf(',') + 1);
  };

  const stopAnalysis = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    setStream(null);
    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }
    setShowSuggestion(false);
    setError(null);
    setAppStatus(AppStatus.Idle);
  }, [stream]);

  const addResponseAndHandleUI = useCallback((
    responseData: Omit<GeminiResponse, 'id' | 'timestamp' | 'prompt' | 'model' | 'make' | 'modelName' | 'machineNumber' | 'originalGeminiOutput'> &
                  { isError?: boolean; description: string; confidence: number | null; rawGeminiText: string; }
    ) => {

    const parsedInfoForDisplay = parseMachineInfo(responseData.rawGeminiText);
    let displayDescription = responseData.description;

    if (!responseData.isError) {
        if (parsedInfoForDisplay.isMachineFormat) {
            if (parsedInfoForDisplay.make && parsedInfoForDisplay.model) {
                displayDescription = `Make: ${parsedInfoForDisplay.make}, Model: ${parsedInfoForDisplay.model}`;
            } else if (parsedInfoForDisplay.make) {
                displayDescription = `Make: ${parsedInfoForDisplay.make}`;
            } else if (parsedInfoForDisplay.model) {
                displayDescription = `Model: ${parsedInfoForDisplay.model}`;
            } else {
                const strippedUnknown = responseData.rawGeminiText
                    .replace(/,?\s*Confidence:\s*\d{1,3}\s*%/i, "")
                    .replace(/,\s*Identifier:\s*[a-zA-Z0-9\-\_./]+/i, "")
                    .trim();
                if (strippedUnknown.toLowerCase().includes("make:") || strippedUnknown.toLowerCase().includes("model:")) {
                    displayDescription = strippedUnknown;
                } else {
                    displayDescription = "Machine (Make/Model Unknown)";
                }
            }
            if (parsedInfoForDisplay.machineNumber) {
                displayDescription += `, Identifier: ${parsedInfoForDisplay.machineNumber}`;
            }
        } else if (responseData.rawGeminiText.toLowerCase().includes("not a machine")) {
            const matchNotAMachine = responseData.rawGeminiText.match(/^(Not a machine)/i);
            if (matchNotAMachine && matchNotAMachine[1]) {
                 displayDescription = matchNotAMachine[1];
            } else {
                 displayDescription = "Not a machine";
            }
        }
    }

    const responsePromptUsed = responseData.rawGeminiText.includes("Not a machine") && !parsedInfoForDisplay.isMachineFormat
                               ? SUMMARIZE_UNKNOWN_PROMPT
                               : DEFAULT_PROMPT;

    const newResponse: GeminiResponse = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      prompt: responsePromptUsed,
      model: GEMINI_MODEL_NAME,
      frameDataUrl: responseData.frameDataUrl,
      description: displayDescription, 
      isError: responseData.isError,
      confidence: responseData.isError ? null : responseData.confidence,
      make: parsedInfoForDisplay.make,
      modelName: parsedInfoForDisplay.model,
      machineNumber: parsedInfoForDisplay.machineNumber,
      originalGeminiOutput: responseData.rawGeminiText,
    };

    if (newResponse.make && newResponse.modelName && !newResponse.isError) {
      setResponses(prevResponses => {
        const otherSuccessfulResponses = prevResponses.filter(
          r => r.make && r.modelName && !r.isError
        );
        return [newResponse, ...otherSuccessfulResponses.slice(0, 19)];
      });
    } else {
      setResponses(prev => [newResponse, ...prev.slice(0, 19)]);
    }

    let shouldStopAnalysis = false;

    if (!responseData.isError && parsedInfoForDisplay.isMachineFormat && parsedInfoForDisplay.make && parsedInfoForDisplay.model) {
      setShowSuggestion(false);
      setError(null);
      setIdentifiedMachineForManualSearch({ make: parsedInfoForDisplay.make, model: parsedInfoForDisplay.model });
      
      const queryForFile = `filetype:pdf "${encodeURIComponent(parsedInfoForDisplay.model)}" "${encodeURIComponent(parsedInfoForDisplay.make)}" official manual support OR user guide OR service manual`;
      console.log("Query for query.txt:", queryForFile); 

      if (rememberMachinesEnabled && currentUser) {
         handleAddRememberedMachine(responseData.rawGeminiText);
      }
    } else if (!responseData.isError && parsedInfoForDisplay.isMachineFormat && (parsedInfoForDisplay.make === null || parsedInfoForDisplay.model === null)) {
      setShowSuggestion(true);
      setError(null);
      setIdentifiedMachineForManualSearch(null);
    } else if (!responseData.isError && !parsedInfoForDisplay.isMachineFormat && responseData.rawGeminiText.toLowerCase().includes("not a machine")) {
      setShowSuggestion(false);
      setError(null);
      setIdentifiedMachineForManualSearch(null);
        if (rememberMachinesEnabled && currentUser && responseData.confidence !== null && responseData.confidence >= 70) {
            handleAddRememberedMachine(responseData.rawGeminiText);
        }
    } else if (!responseData.isError && !parsedInfoForDisplay.isMachineFormat) {
       setShowSuggestion(true);
       setError(null);
       setIdentifiedMachineForManualSearch(null);
    } else if (responseData.isError) {
      setShowSuggestion(false);
      setIdentifiedMachineForManualSearch(null);
    }

    if (shouldStopAnalysis) { 
        stopAnalysis();
    } else {
        lastAnalyzedFrameImageDataRef.current = null;
    }

  }, [currentUser, rememberMachinesEnabled, handleAddRememberedMachine, stopAnalysis]);


  const captureFrameAndSend = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || videoRef.current.readyState < videoRef.current.HAVE_METADATA) {
      if(appStatusRef.current === AppStatus.ProcessingFrame) setAppStatus(AppStatus.Analyzing);
      return;
    }
    if (appStatusRef.current === AppStatus.ProcessingFrame) {
        return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth * IMAGE_SCALE_FACTOR;
    canvas.height = video.videoHeight * IMAGE_SCALE_FACTOR;

    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) {
      setError("Failed to get canvas context.");
      setShowSuggestion(false);
      setIdentifiedMachineForManualSearch(null);
      setAppStatus(AppStatus.Error);
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const currentFrameImageData = context.getImageData(0, 0, canvas.width, canvas.height);

    const isForcedByPreviousFailure = lastAnalyzedFrameImageDataRef.current === null;

    if (!isForcedByPreviousFailure) {
        if (lastAnalyzedFrameImageDataRef.current) { 
            const diff = calculatePixelDifference(currentFrameImageData, lastAnalyzedFrameImageDataRef.current);
            if (diff < CHANGE_THRESHOLD) {
                return;
            }
        }
    }
    
    setAppStatus(AppStatus.ProcessingFrame);
    setError(null);
    setShowSuggestion(false);

    const frameDataUrl = canvas.toDataURL('image/jpeg', IMAGE_QUALITY);
    const base64ImageData = getBase64FromDataUrl(frameDataUrl);

    try {
      lastAnalyzedFrameImageDataRef.current = currentFrameImageData;

      const initialDescriptionFromGemini = await generateDescriptionFromFrame(base64ImageData, DEFAULT_PROMPT);
      const parsedInfo = parseMachineInfo(initialDescriptionFromGemini);

      let finalDisplayDescription = initialDescriptionFromGemini;
      let finalConfidence: number | null = parsedInfo.confidence;
      let currentErrorForResponse = null;

      if (parsedInfo.isMachineFormat && parsedInfo.make && parsedInfo.model) {
        // Use initialDescriptionFromGemini and parsedInfo.confidence
      } else {
        if (parsedInfo.isMachineFormat && (parsedInfo.make === null || parsedInfo.model === null)) {
             // Use initialDescriptionFromGemini and parsedInfo.confidence
        } else if (!parsedInfo.isMachineFormat && initialDescriptionFromGemini.toLowerCase().includes("not a machine")) {
             // Use initialDescriptionFromGemini and parsedInfo.confidence
        } else if (!parsedInfo.isMachineFormat) {
            finalConfidence = null;
            try {
                const summaryDescriptionText = await generateDescriptionFromFrame(base64ImageData, SUMMARIZE_UNKNOWN_PROMPT);
                let summaryText = summaryDescriptionText.trim();
                const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
                const match = summaryText.match(fenceRegex);
                if (match && match[2]) summaryText = match[2].trim();
                summaryText = summaryText.split(/\s+/).slice(0, 2).join(" ");
                finalDisplayDescription = `${summaryText.charAt(0).toUpperCase() + summaryText.slice(1)} - Not a machine.`;
            } catch (summaryError: any) {
                currentErrorForResponse = `Failed to get object summary. ${summaryError.message || "Original analysis yielded unclear results."}`;
                setError(currentErrorForResponse);
                finalDisplayDescription = initialDescriptionFromGemini; // Keep original if summary fails
                finalConfidence = parsedInfo.confidence; // Keep original confidence
            }
        }
      }

      addResponseAndHandleUI({
        frameDataUrl,
        description: finalDisplayDescription, 
        isError: !!currentErrorForResponse,
        confidence: currentErrorForResponse ? null : finalConfidence,
        rawGeminiText: initialDescriptionFromGemini,
      });

    } catch (e: any) {
      console.error("Error in captureFrameAndSend:", e);
      const errorMessage = e instanceof Error ? e.message : "An unknown error occurred during frame processing.";
      setError(errorMessage);
      
      lastAnalyzedFrameImageDataRef.current = currentFrameImageData; // Keep current frame to allow re-analysis attempt on next interval if it was an API error

      addResponseAndHandleUI({
          frameDataUrl,
          description: `Error: ${errorMessage}`,
          isError: true,
          confidence: null,
          rawGeminiText: `Error: ${errorMessage}`
      });
    } finally {
        if (intervalIdRef.current !== null && appStatusRef.current !== AppStatus.Idle) {
            setAppStatus(AppStatus.Analyzing);
        }
    }
  }, [addResponseAndHandleUI]);

  useEffect(() => {
    if (appStatus === AppStatus.Analyzing && stream) {
      if (intervalIdRef.current) clearInterval(intervalIdRef.current);
      intervalIdRef.current = setInterval(captureFrameAndSend, CAPTURE_INTERVAL_MS);
    } else {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
    }
    return () => {
      if (intervalIdRef.current) clearInterval(intervalIdRef.current);
    };
  }, [appStatus, stream, captureFrameAndSend]);

  const startAnalysis = async () => {
    setError(null);
    setShowSuggestion(false);
    setIdentifiedMachineForManualSearch(null);
    setAppStatus(AppStatus.InitializingCamera);
    lastAnalyzedFrameImageDataRef.current = null; 

    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
    }
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      setStream(mediaStream);
      setAppStatus(AppStatus.Analyzing);
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Failed to access camera. Please check permissions.");
      setAppStatus(AppStatus.Error);
    }
  };

  const handleToggleAnalysis = () => {
    if (appStatus === AppStatus.Analyzing || appStatus === AppStatus.ProcessingFrame) {
      stopAnalysis();
    } else {
      startAnalysis();
    }
  };

  const handleLogoutClick = () => { 
    stopAnalysis();
    setIdentifiedMachineForManualSearch(null);
    logout(); 
  };
  
  const handleFindManuals = () => {
    if (identifiedMachineForManualSearch && identifiedMachineForManualSearch.make && identifiedMachineForManualSearch.model) {
      const { make, model } = identifiedMachineForManualSearch;
      const query = `filetype:pdf "${encodeURIComponent(model)}" "${encodeURIComponent(make)}" official manual support OR user guide OR service manual`;
      const googleSearchUrl = `https://www.google.com/search?q=${query}`;
      window.open(googleSearchUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleResponseItemClick = (response: GeminiResponse) => {
    if (response.make && response.modelName && !response.isError && response.originalGeminiOutput) {
      if (appStatus === AppStatus.Analyzing || appStatus === AppStatus.ProcessingFrame) {
        stopAnalysis();
      }
      onNavigateToMachineDetail({
        frameDataUrl: response.frameDataUrl,
        description: response.description, 
        make: response.make,
        modelName: response.modelName,
        machineNumber: response.machineNumber,
        originalGeminiOutput: response.originalGeminiOutput,
      });
    }
  };


  const isButtonDisabled = appStatus === AppStatus.InitializingCamera;
  const isAnalyzingActive = appStatus === AppStatus.Analyzing || appStatus === AppStatus.ProcessingFrame;

  let buttonText = 'Start Analysis';
  if (appStatus === AppStatus.InitializingCamera) {
    buttonText = 'Initializing...';
  } else if (isAnalyzingActive) {
    buttonText = 'Stop Analysis';
  } else if (appStatus === AppStatus.Idle && identifiedMachineForManualSearch) {
    buttonText = 'Start Analysis Again';
  }


  return (
    <div className="min-h-screen flex flex-col bg-[#0D0D0D] text-neutral-200">
      <header className="bg-[#1A1A1A] p-4 shadow-xl sticky top-0 z-50 border-b border-[#2C2C2C]">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <EyeIcon className="w-8 h-8 mr-3 text-red-400" />
            <h1 className="text-2xl font-bold text-red-500">
              Lens
            </h1>
          </div>
          {currentUser && (
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm text-neutral-300 font-semibold">{currentUser.username}</p>
                <p className="text-xs text-neutral-500 capitalize">{currentUser.role}</p>
              </div>
               <button
                 onClick={onNavigateToProfile}
                 title="View Profile"
                 className="p-1 rounded-full hover:bg-neutral-700/50 text-neutral-400 hover:text-neutral-200 transition-colors focus:outline-none"
               >
                {currentUser.profilePictureUrl ? (
                  <img src={currentUser.profilePictureUrl} alt="Profile" className="w-7 h-7 rounded-full object-cover" />
                ) : (
                  <UserCircleIcon className="w-7 h-7" />
                )}
               </button>
              <button
                onClick={handleLogoutClick}
                title="Logout"
                className="p-2 rounded-md hover:bg-red-700/50 text-red-400 hover:text-red-300 transition-colors"
              >
                <LogoutIcon className="w-6 h-6" />
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="flex-grow container mx-auto p-4 md:p-6 flex flex-col lg:flex-row gap-6">
        <div className="lg:w-2/5 flex flex-col gap-6">
          <div className="bg-[#1A1A1A] p-1 rounded-lg shadow-xl aspect-video relative border border-[#2C2C2C]">
            <VideoPlayer videoRef={videoRef} stream={stream} />
            {!stream && appStatus !== AppStatus.InitializingCamera && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 rounded-lg">
                <CameraIcon className="w-16 h-16 text-neutral-600 mb-4" />
                <p className="text-neutral-500">Camera is off</p>
              </div>
            )}
            {appStatus === AppStatus.InitializingCamera && (
                 <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 rounded-lg">
                    <Loader size="lg" />
                    <p className="text-neutral-500 mt-3">Initializing Camera...</p>
                 </div>
            )}
          </div>

          <div className="bg-[#1A1A1A] p-4 rounded-lg shadow-xl flex flex-col gap-4 border border-[#2C2C2C]">
            <button
              onClick={handleToggleAnalysis}
              disabled={isButtonDisabled}
              className={`w-full flex items-center justify-center px-6 py-3 rounded-md font-semibold text-white transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-opacity-75
                ${isButtonDisabled ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed shadow-sm focus:ring-neutral-600' :
                (isAnalyzingActive ?
                'bg-red-600 hover:bg-red-700 shadow-md hover:shadow-lg focus:ring-red-500' :
                'bg-red-500 hover:bg-red-600 shadow-md hover:shadow-lg focus:ring-red-400')}`}
            >
              {isButtonDisabled ? <Loader size="sm" className="mr-2" /> :
               (isAnalyzingActive ?
                <StopIcon className="w-5 h-5 mr-2" /> :
                <CameraIcon className="w-5 h-5 mr-2" />)
              }
              {buttonText}
            </button>

            {currentUser && (
              <div className="space-y-3">
                <ToggleSwitch
                    id="remember-machines-toggle"
                    label="Auto-Save Identified Machines"
                    checked={rememberMachinesEnabled}
                    onChange={handleToggleRememberMachines}
                    Icon={BrainIcon}
                    disabled={appStatus === AppStatus.InitializingCamera || appStatus === AppStatus.ProcessingFrame}
                />
                <button
                  onClick={onNavigateToSavedMachines}
                  className="w-full flex items-center justify-center px-4 py-2 rounded-md font-semibold text-sm bg-sky-600 hover:bg-sky-700 text-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-opacity-75 transition-colors duration-150 ease-in-out disabled:opacity-60 disabled:cursor-not-allowed"
                  disabled={appStatus === AppStatus.InitializingCamera || appStatus === AppStatus.ProcessingFrame}
                  title="View and manage your saved machines"
                >
                  <BookmarkIcon className="w-5 h-5 mr-2" />
                  View Saved Machines ({userRememberedMachinesCount})
                </button>
              </div>
            )}

            <p className="text-xs text-neutral-500 text-center px-2">
              Identifies objects via camera. Frames are captured at reduced resolution/quality.
              Sends to API if significant visual change is detected or re-analysis is forced. Interval: {CAPTURE_INTERVAL_MS / 1000}s.
            </p>
          </div>

          {identifiedMachineForManualSearch && (
            <div className="bg-[#1A1A1A] p-4 rounded-lg shadow-xl flex flex-col gap-3 mt-0 border border-[#2C2C2C]">
                <div className="flex items-start">
                    <DocumentTextIcon className="w-6 h-6 mr-3 mt-0.5 text-sky-400 flex-shrink-0"/>
                    <div>
                    <strong className="font-bold text-sky-300">Machine Identified:</strong>
                    <span className="block sm:inline ml-1 text-sky-200">{identifiedMachineForManualSearch.make} {identifiedMachineForManualSearch.model}</span>
                    </div>
                </div>
                <button
                    onClick={handleFindManuals}
                    className="w-full flex items-center justify-center px-4 py-2 rounded-md font-semibold text-sm bg-teal-600 hover:bg-teal-700 text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-opacity-75 transition-colors duration-150 ease-in-out"
                >
                    <DocumentTextIcon className="w-5 h-5 mr-2" />
                    Find PDF Manuals on Google
                </button>
            </div>
            )}


          {error && (
            <div className="bg-red-700/20 border border-red-600 text-red-200 px-4 py-3 rounded-lg shadow-md flex items-start mt-4" role="alert">
              <ExclamationTriangleIcon className="w-5 h-5 mr-3 mt-0.5 text-red-400 flex-shrink-0"/>
              <div>
                <strong className="font-bold text-red-300">Error:</strong>
                <span className="block sm:inline ml-1 text-red-200">{error}</span>
              </div>
            </div>
          )}

          {showSuggestion && (
            <div className="bg-sky-700/20 border border-sky-600 text-sky-200 px-4 py-3 rounded-lg shadow-md flex items-start mt-4" role="status">
              <InformationCircleIcon className="w-5 h-5 mr-3 mt-0.5 text-sky-400 flex-shrink-0"/>
              <div>
                <strong className="font-bold text-sky-300">Suggestion:</strong>
                <span className="block sm:inline ml-1 text-sky-200">Try moving closer to the object or showing it from different angles for better identification.</span>
              </div>
            </div>
          )}
        </div>

        <div className="lg:w-3/5 flex flex-col bg-[#1A1A1A] rounded-lg shadow-xl border border-[#2C2C2C]">
          <div className="flex justify-between items-center p-4 border-b border-[#2C2C2C] sticky top-[73px] bg-[#1A1A1A]/90 backdrop-blur-sm z-10 rounded-t-lg">
             <h2 className="text-xl font-semibold text-neutral-100">Machine Predictions</h2>
             {(appStatus === AppStatus.ProcessingFrame || appStatus === AppStatus.InitializingCamera) && <Loader size="sm" />}
          </div>
          <div className="flex-grow overflow-y-auto p-4 space-y-4 h-96 lg:h-[calc(100vh-18rem)]">
            {responses.length === 0 && appStatus !== AppStatus.InitializingCamera && appStatus !== AppStatus.ProcessingFrame && (
              <div className="text-center py-10 flex flex-col items-center justify-center h-full">
                <SparklesIcon className="w-16 h-16 text-neutral-700 mx-auto mb-4" />
                <p className="text-neutral-500 text-lg">
                  {appStatus === AppStatus.Idle && !identifiedMachineForManualSearch ? "Start analysis to see results." :
                   (appStatus === AppStatus.Idle && identifiedMachineForManualSearch ? "Analysis complete. Click 'Start Analysis Again' or explore manual search." :
                   (isAnalyzingActive || showSuggestion ? "Analyzing... Try adjusting camera view for better results if needed." : "No responses yet. Waiting for input..."))}
                </p>
              </div>
            )}
            {responses.map((res) => (
              <ResponseItem
                key={res.id}
                response={res}
                onSaveMachine={currentUser ? handleAddRememberedMachine : undefined}
                onClick={handleResponseItemClick}
              />
            ))}
          </div>
        </div>
      </main>
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
};

export default App;
