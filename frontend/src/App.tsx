import React, { useState, useRef, useCallback, useEffect } from 'react';
import { VideoPlayer } from './components/VideoPlayer';
import { ResponseItem } from './components/ResponseItem';
import { Loader } from './components/Loader';
import { ToggleSwitch } from './components/ToggleSwitch';
import { generateDescriptionFromFrame, scrapeManualLinks } from './services/geminiService';
import { rememberedMachinesService } from './services/rememberedMachinesService';
import { GeminiResponse, AppStatus, ParsedMachineInfo, ScanViewAppProps, MachineNumberUpdatePayload, UserMachineData, Role, TrinMachineQrPayload, MachineDetailData, VoiceCommandStatus, ManualsModalState } from './types';
import { DEFAULT_PROMPT, SUMMARIZE_UNKNOWN_PROMPT, GEMINI_MODEL_NAME, CAPTURE_INTERVAL_MS, IMAGE_QUALITY, IMAGE_SCALE_FACTOR, CHANGE_THRESHOLD, TRIN_MACHINE_QR_TYPE } from './constants';
import { StopIcon, ExclamationTriangleIcon, InformationCircleIcon, EyeIcon, SparklesIcon, DocumentTextIcon, BookmarkIcon, MagnifyingGlassIcon, QrCodeIcon, ChevronDownIcon, XMarkIcon, PlusCircleIcon } from './components/Icons'; // Removed CameraIcon, UserCircleIcon, LogoutIcon, ArchiveBoxArrowDownIcon as they are handled by PageHeader
import { useAuth } from './hooks/useAuth';
import { BrowserQRCodeReader, IScannerControls } from '@zxing/browser';
import { NotFoundException } from '@zxing/library';
import { useVoiceCommands } from './hooks/useVoiceCommands';
import { QrDisplayModal } from './components/QrDisplayModal';

const CAMERA_PREFERENCE_KEY = 'trin_app_camera_preference_id';

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

// Helper function to reconstruct description (used for sync and detail page updates)
const reconstructDescription = (
  make: string | null,
  modelName: string | null,
  machineNumber: string | null,
  originalDescription: string, // Fallback or base for "Not a machine"
  isOriginalFormatMachine: boolean
): string => {
  let baseDesc = "";
  if (make && modelName) {
    baseDesc = `Make: ${make}, Model: ${modelName}`;
  } else if (make) {
    baseDesc = `Make: ${make}`;
  } else if (modelName) {
    baseDesc = `Model: ${modelName}`;
  }

  if (baseDesc) { // If we have make/model info
    return machineNumber ? `${baseDesc}, Identifier: ${machineNumber}` : baseDesc;
  }

  const identifierPattern = /, Identifier: [a-zA-Z0-9\-\_./]+/;
  let updatedDescription = originalDescription;

  if (machineNumber) {
    if (originalDescription.toLowerCase().includes("not a machine") || !isOriginalFormatMachine) {
      updatedDescription = `Machine (Make/Model Unknown), Identifier: ${machineNumber}`;
    } else if (updatedDescription.match(identifierPattern)) {
      updatedDescription = updatedDescription.replace(identifierPattern, `, Identifier: ${machineNumber}`);
    } else {
      updatedDescription = `${updatedDescription}, Identifier: ${machineNumber}`;
    }
  } else {
    if (updatedDescription.match(identifierPattern)) {
      updatedDescription = updatedDescription.replace(identifierPattern, "");
      if (updatedDescription.endsWith(',')) {
        updatedDescription = updatedDescription.slice(0, -1).trim();
      }
      if (updatedDescription === "Machine (Make/Model Unknown),") {
        updatedDescription = "Machine (Make/Model Unknown)";
      }
    }
  }
  return updatedDescription;
};


const App: React.FC<ScanViewAppProps> = ({
    // onNavigateToProfile and onNavigateToSavedMachinesView are now handled by PageHeader via MainWrapper
    onNavigateToMachineDetailView,
    onNavigateToManualAdd,
    currentUser,
    isActiveScanView,
    registerDataChangeCallback // This callback is provided by MainWrapper
}) => {
  const { 
    activeCommand: voiceActiveCommand, 
    registerScanAction, 
  } = useVoiceCommands();

  const [appStatus, setAppStatus] = useState<AppStatus>(AppStatus.Idle);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [responses, setResponses] = useState<GeminiResponse[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showSuggestion, setShowSuggestion] = useState<boolean>(false);
  const [identifiedMachineForManualSearch, setIdentifiedMachineForManualSearch] = useState<{make: string; model: string} | null>(null);
  const [rememberMachinesEnabled, setRememberMachinesEnabled] = useState<boolean>(true);
  const [qrMessage, setQrMessage] = useState<string | null>(null);
  const [manualsModalState, setManualsModalState] = useState<ManualsModalState>({ isOpen: false, isLoading: false, links: [], error: null });
  const [nonMachineDetectionCount, setNonMachineDetectionCount] = useState<number>(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const intervalIdRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastAnalyzedFrameImageDataRef = useRef<ImageData | null>(null);
  const appStatusRef = useRef(appStatus);
  const qrReaderRef = useRef<BrowserQRCodeReader | null>(null); 
  const qrReaderControlsRef = useRef<IScannerControls | null>(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState<boolean>(false);
  const [qrCodeDataString, setQrCodeDataString] = useState<string>('');

  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(() => {
    return localStorage.getItem(CAMERA_PREFERENCE_KEY) || null;
  });


  useEffect(() => {
    appStatusRef.current = appStatus;
  }, [appStatus]);

  // This function is called by App.tsx itself to signal MainWrapper to update its machine count.
  const triggerMainWrapperMachineCountUpdate = useCallback(() => {
    if (registerDataChangeCallback) {
      registerDataChangeCallback(() => {
        // This inner function is essentially what MainWrapper's `fetchUserMachineCount` does.
        // App.tsx signals, MainWrapper reacts and updates its own state, which PageHeader uses.
        // No need for App.tsx to manage userRememberedMachinesCount directly.
      });
    }
  }, [registerDataChangeCallback]);

  const fetchAvailableCameras = useCallback(async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        console.warn("enumerateDevices() not supported.");
        setAvailableCameras([]);
        return;
      }
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setAvailableCameras(videoDevices);
      
      if (selectedCameraId && !videoDevices.some(device => device.deviceId === selectedCameraId)) {
        console.warn(`Previously selected camera ${selectedCameraId} is no longer available. Resetting.`);
        setSelectedCameraId(null);
        localStorage.removeItem(CAMERA_PREFERENCE_KEY);
      }
    } catch (err) {
      console.error("Error enumerating devices:", err);
      setError("Could not list cameras. Please ensure permissions are granted.");
    }
  }, [selectedCameraId]);

  useEffect(() => {
    fetchAvailableCameras(); 
    navigator.mediaDevices.addEventListener('devicechange', fetchAvailableCameras);
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', fetchAvailableCameras);
    };
  }, [fetchAvailableCameras]);


  useEffect(() => {
     // Initial count update when component mounts or currentUser changes
     triggerMainWrapperMachineCountUpdate();
  },[currentUser, triggerMainWrapperMachineCountUpdate]);

  useEffect(() => {
    if (currentUser) {
      rememberedMachinesService.getRememberToggleState(currentUser.id)
        .then(setEnabled => setRememberMachinesEnabled(setEnabled))
        .catch(e => console.error("Failed to load remember toggle state:", e));
      triggerMainWrapperMachineCountUpdate();
    } else {
      setRememberMachinesEnabled(true);
    }
  }, [currentUser, triggerMainWrapperMachineCountUpdate]);

  useEffect(() => {
    const syncResponseIdentifiers = async () => {
      if (isActiveScanView && currentUser && responses.length > 0) {
        let updateMade = false;
        const updatedResponses = await Promise.all(
          responses.map(async (res) => {
            if (res.make && res.modelName) {
              try {
                const savedData = await rememberedMachinesService.getSpecificUserMachineData(
                  currentUser.id,
                  res.make,
                  res.modelName
                );
                const currentResMachineNumber = res.machineNumber || null;
                const savedMachineNumber = savedData ? (savedData.machineNumber || null) : null;
                if (currentResMachineNumber !== savedMachineNumber) {
                  updateMade = true;
                  const originalParsedInfo = parseMachineInfo(res.originalGeminiOutput || "");
                  return {
                    ...res,
                    machineNumber: savedMachineNumber,
                    description: reconstructDescription(
                      res.make,
                      res.modelName,
                      savedMachineNumber,
                      res.originalGeminiOutput || `Make: ${res.make}, Model: ${res.modelName}`,
                      originalParsedInfo.isMachineFormat
                    ),
                  };
                }
              } catch (e) {
                console.error("Error during response sync with saved data:", e);
              }
            }
            return res;
          })
        );
        if (updateMade) {
          setResponses(updatedResponses);
        }
      }
    };
    syncResponseIdentifiers();
  }, [isActiveScanView, currentUser, responses]);


  const handleToggleRememberMachines = async (enabled: boolean) => {
    if (!currentUser) return;
    setRememberMachinesEnabled(enabled);
    try {
      await rememberedMachinesService.setRememberToggleState(currentUser.id, enabled);
    } catch (e) {
      console.error("Failed to save remember toggle state:", e);
    }
  };

  const handleAddRememberedMachine = useCallback(async (responseData: GeminiResponse) => {
    if (!currentUser || !responseData.make || !responseData.modelName) {
        console.warn("Auto-save skipped: User not logged in or missing make/model in response.");
        return;
    }
    try {
      const machineToSave: UserMachineData = {
        make: responseData.make,
        modelName: responseData.modelName,
        machineNumber: responseData.machineNumber || null,
        originalGeminiOutput: responseData.originalGeminiOutput || responseData.description,
        frameDataUrl: responseData.frameDataUrl,
        lastUpdated: new Date().toISOString(), 
        userDisplayDescription: responseData.description,
        additionalInfo: '',
        workHistory: [],
        documents: [],
        workRequests: [],
      };
      await rememberedMachinesService.saveUserMachineData(currentUser.id, machineToSave);
      triggerMainWrapperMachineCountUpdate(); 
    } catch (e) {
      console.error("Failed to auto-save machine data:", e);
    }
  }, [currentUser, triggerMainWrapperMachineCountUpdate]);

  const handleQrCodeString = useCallback(async (qrText: string): Promise<boolean> => {
    if (!currentUser) {
        setQrMessage("Login to process QR codes.");
        setAppStatus(AppStatus.Error);
        return false;
    }
    try {
        const qrPayload = JSON.parse(qrText) as TrinMachineQrPayload;
        if (qrPayload.type === TRIN_MACHINE_QR_TYPE && qrPayload.data && qrPayload.data.make && qrPayload.data.modelName) {
            if (qrReaderControlsRef.current) {
                qrReaderControlsRef.current.stop();
                qrReaderControlsRef.current = null;
            }
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
                setStream(null);
            }
            if (videoRef.current) videoRef.current.srcObject = null;

            const machineFromQr = qrPayload.data;
            const existingMachine = await rememberedMachinesService.getSpecificUserMachineData(currentUser.id, machineFromQr.make, machineFromQr.modelName);
            
            let machineToNavigate: MachineDetailData;

            if (existingMachine) {
                setQrMessage(`Machine Found via QR: ${existingMachine.make} ${existingMachine.modelName}. Navigating...`);
                machineToNavigate = {
                    ...existingMachine,
                    id: `${existingMachine.make}-${existingMachine.modelName}-${existingMachine.machineNumber || 'qr-found'}-${Date.now()}`,
                    userId: currentUser.id,
                    frameDataUrl: machineFromQr.frameDataUrl || existingMachine.frameDataUrl, 
                };
            } else {
                setQrMessage(`New Machine: ${machineFromQr.make} ${machineFromQr.modelName} added from QR. Navigating...`);
                const machineToSave: UserMachineData = {
                    ...machineFromQr,
                    lastUpdated: machineFromQr.lastUpdated || new Date().toISOString(),
                    userDisplayDescription: machineFromQr.userDisplayDescription || `${machineFromQr.make} ${machineFromQr.modelName}${machineFromQr.machineNumber ? `, Identifier: ${machineFromQr.machineNumber}` : ''}`,
                };
                await rememberedMachinesService.saveUserMachineData(currentUser.id, machineToSave);
                triggerMainWrapperMachineCountUpdate();
                machineToNavigate = {
                    ...machineToSave,
                    id: `${machineToSave.make}-${machineToSave.modelName}-${machineToSave.machineNumber || 'qr-new'}-${Date.now()}`,
                    userId: currentUser.id,
                    frameDataUrl: machineFromQr.frameDataUrl,
                };
            }
            
            onNavigateToMachineDetailView(machineToNavigate, (updatedPayload) => {
                 console.log("QR Scan/Lens-QR: Machine number update callback invoked", updatedPayload);
            });
            setAppStatus(AppStatus.Idle);
            return true;
        } else {
            setQrMessage("Invalid TRIN machine QR code format detected.");
            setAppStatus(AppStatus.Idle); // Reset to idle after message
            return false;
        }
    } catch (parseError) {
        console.error("Error parsing QR code JSON:", parseError);
        setQrMessage("Not a valid JSON QR code, or not TRIN format.");
        setAppStatus(AppStatus.Idle); // Reset to idle after message
        return false;
    }
  }, [currentUser, onNavigateToMachineDetailView, triggerMainWrapperMachineCountUpdate, stream]);


  const processFrame = useCallback(async (prompt = DEFAULT_PROMPT) => {
    if (!videoRef.current || !canvasRef.current) return;
    if (appStatusRef.current === AppStatus.Analyzing || appStatusRef.current === AppStatus.ProcessingFrame || appStatusRef.current === AppStatus.ProcessingQrFromLens) {
        console.log("processFrame: Already analyzing or processing. Skipping.");
        return;
    }
    setAppStatus(AppStatus.ProcessingFrame);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) {
        setAppStatus(AppStatus.Error);
        setError("Canvas context not available.");
        return;
    }

    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;
    if (videoWidth === 0 || videoHeight === 0) {
      console.warn("Video dimensions are zero, skipping frame processing.");
      setAppStatus(AppStatus.Idle);
      return;
    }
    const aspectRatio = videoWidth / videoHeight;
    let drawWidth = videoWidth * IMAGE_SCALE_FACTOR;
    let drawHeight = videoHeight * IMAGE_SCALE_FACTOR;
    const MAX_DIMENSION = 768;
    if (drawWidth > MAX_DIMENSION || drawHeight > MAX_DIMENSION) {
        if (aspectRatio > 1) { drawWidth = MAX_DIMENSION; drawHeight = MAX_DIMENSION / aspectRatio; }
        else { drawHeight = MAX_DIMENSION; drawWidth = MAX_DIMENSION * aspectRatio; }
    }
    
    canvas.width = drawWidth;
    canvas.height = drawHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const currentFrameImageData = context.getImageData(0, 0, canvas.width, canvas.height);

    if (prompt === DEFAULT_PROMPT) { 
        const tempQrReader = new BrowserQRCodeReader(undefined, {
            delayBetweenScanAttempts: 1000, 
            delayBetweenScanSuccess: 1000, 
        });
        try {
            const qrResultFromCanvas = await tempQrReader.decodeFromCanvas(canvasRef.current);
            if (qrResultFromCanvas) {
                console.log("QR Code detected during Lens mode:", qrResultFromCanvas.getText());
                stopCapture(); 

                setAppStatus(AppStatus.ProcessingQrFromLens);
                setQrMessage("QR Code detected by Lens. Processing...");

                await handleQrCodeString(qrResultFromCanvas.getText());
                // State management (Idle/Error) is handled within handleQrCodeString
                return; 
            }
        } catch (e) {
            if (!(e instanceof NotFoundException)) { 
                console.warn("Error attempting QR detection during Lens mode:", e);
            }
        }
    }

    if (lastAnalyzedFrameImageDataRef.current) {
        const diff = calculatePixelDifference(lastAnalyzedFrameImageDataRef.current, currentFrameImageData);
        if (diff < CHANGE_THRESHOLD && prompt === DEFAULT_PROMPT) {
            console.log("No significant change detected for Gemini, skipping analysis. Diff:", diff);
            setAppStatus(AppStatus.Idle); 
            return; 
        }
    }
    
    setAppStatus(AppStatus.Analyzing);
    setShowSuggestion(false);
    setIdentifiedMachineForManualSearch(null);

    try {
      const frameDataUrl = canvas.toDataURL('image/jpeg', IMAGE_QUALITY);
      const base64ImageData = frameDataUrl.split(',')[1];
      const description = await generateDescriptionFromFrame(base64ImageData, prompt);
      
      const { make, model, machineNumber, isMachineFormat, confidence } = parseMachineInfo(description);
      
      if (make && model) {
        setNonMachineDetectionCount(0);
      } else if (!isMachineFormat) {
        setNonMachineDetectionCount(prev => prev + 1);
      }

      const newResponse: GeminiResponse = {
        id: Date.now().toString(),
        frameDataUrl,
        description,
        timestamp: new Date().toISOString(),
        prompt: prompt,
        model: GEMINI_MODEL_NAME,
        isError: false,
        confidence,
        make,
        modelName: model,
        machineNumber,
        originalGeminiOutput: description,
      };
      setResponses(prev => [newResponse, ...prev.slice(0, 19)]);
      lastAnalyzedFrameImageDataRef.current = currentFrameImageData;

      if (make && model && confidence && confidence > 50) {
        setIdentifiedMachineForManualSearch({ make, model });
        setShowSuggestion(true);
        if (rememberMachinesEnabled) {
          await handleAddRememberedMachine(newResponse);
        }
      } else if (!isMachineFormat && prompt === DEFAULT_PROMPT) {
        setTimeout(() => processFrame(SUMMARIZE_UNKNOWN_PROMPT), 100);
      }
      
    } catch (e: any) {
      console.error("Error processing frame with Gemini:", e);
      setError(e.message || "Failed to analyze frame with Gemini.");
      const errorResponse: GeminiResponse = {
        id: Date.now().toString(),
        frameDataUrl: canvas.toDataURL('image/jpeg', 0.5),
        description: `Error: ${e.message || "Unknown analysis error"}`,
        timestamp: new Date().toISOString(),
        prompt: prompt,
        model: GEMINI_MODEL_NAME,
        isError: true,
        confidence: null,
      };
      setResponses(prev => [errorResponse, ...prev.slice(0, 19)]);
    } finally {
      // Only set to Idle if the status hasn't been changed by QR processing flow
      if (appStatusRef.current === (AppStatus.Analyzing as AppStatus) || appStatusRef.current === (AppStatus.ProcessingFrame as AppStatus)) {
         setAppStatus(AppStatus.Idle);
      }
    }
  }, [rememberMachinesEnabled, handleAddRememberedMachine, handleQrCodeString]);


  const startCapture = async () => {
    if (appStatusRef.current === AppStatus.InitializingCamera || appStatusRef.current === AppStatus.ProcessingFrame || appStatusRef.current === AppStatus.Analyzing || appStatusRef.current === AppStatus.ProcessingQrFromLens) {
      console.log("StartCapture: Already in an active Lens state or initializing. Aborting.");
      return;
    }
  
    setError(null);
    setQrMessage(null);
    setNonMachineDetectionCount(0);
    setAppStatus(AppStatus.InitializingCamera);
    
    if (qrReaderControlsRef.current) {
        qrReaderControlsRef.current.stop();
        qrReaderControlsRef.current = null;
    }
    if (qrReaderRef.current) {
        qrReaderRef.current.reset();
    }
  
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  
    try {
      const videoConstraints: MediaTrackConstraints = {
          width: { ideal: 1280 },
          height: { ideal: 720 }
      };
      if (selectedCameraId) {
          videoConstraints.deviceId = { exact: selectedCameraId };
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: videoConstraints });
      setStream(mediaStream);
      fetchAvailableCameras(); 
      setAppStatus(AppStatus.Idle);
  
      setTimeout(() => {
        if (appStatusRef.current !== AppStatus.Idle && appStatusRef.current !== AppStatus.InitializingCamera) {
            console.warn("StartCapture timeout: Aborting frame processing due to unexpected app status:", appStatusRef.current);
            return;
        }
        processFrame();
        if (intervalIdRef.current) clearInterval(intervalIdRef.current);
        intervalIdRef.current = setInterval(() => {
          if (appStatusRef.current === AppStatus.Idle) {
            processFrame();
          }
        }, CAPTURE_INTERVAL_MS);
      }, 500);
  
    } catch (e: any) {
      console.error("Error accessing camera in startCapture:", e);
      let errorMessage = `Camera access denied or unavailable: ${e.message}. Please ensure permissions are granted.`;
      if (e.name === "OverconstrainedError" || e.name === "ConstraintNotSatisfiedError" || e.name === "NotFoundError" || e.name === "DevicesNotFoundError") {
        const camLabel = availableCameras.find(c=>c.deviceId === selectedCameraId)?.label || selectedCameraId;
        if (selectedCameraId) {
            errorMessage = `Selected camera (${camLabel || 'ID: '+selectedCameraId}) failed. Try 'Default Camera' or another option. Error: ${e.message}`;
            setSelectedCameraId(null); 
            localStorage.removeItem(CAMERA_PREFERENCE_KEY);
        } else {
             errorMessage = `Default camera failed. Error: ${e.message}`;
        }
      }
      setError(errorMessage);
      setAppStatus(AppStatus.Error);
      setStream(null); 
    }
  };

  const stopCapture = () => {
    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
     if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject = null; 
    }
    if (qrReaderControlsRef.current) {
        qrReaderControlsRef.current.stop();
        qrReaderControlsRef.current = null;
    }
    
    // Set to Idle only if not already in an error state or a QR processing state that manages its own transition
    if (appStatusRef.current !== AppStatus.Error && appStatusRef.current !== AppStatus.ProcessingQrFromLens && appStatusRef.current !== AppStatus.SHOWING_QR_CODE) {
        setAppStatus(AppStatus.Idle);
    }
    lastAnalyzedFrameImageDataRef.current = null;
    setNonMachineDetectionCount(0);
  };

  const handleResponseClick = (response: GeminiResponse) => {
    if (response.make && response.modelName && !response.isError) {
      const machineDetailData: MachineDetailData = {
        id: response.id,
        make: response.make,
        modelName: response.modelName,
        machineNumber: response.machineNumber,
        originalGeminiOutput: response.originalGeminiOutput,
        frameDataUrl: response.frameDataUrl,
        userDisplayDescription: response.description,
        lastUpdated: response.timestamp,
        additionalInfo: '', 
        workHistory: [],
        documents: [],
        workRequests: [],
      };
      onNavigateToMachineDetailView(machineDetailData, (updatedPayload: MachineNumberUpdatePayload) => {
        // Update the specific response in the list if its machine number changed
        setResponses(prevResponses =>
          prevResponses.map(res =>
            res.id === updatedPayload.responseId
              ? { ...res, machineNumber: updatedPayload.newMachineNumber, 
                  description: reconstructDescription(res.make!, res.modelName!, updatedPayload.newMachineNumber, res.originalGeminiOutput || res.description, true)
                }
              : res
          )
        );
      });
    }
  };
  
  const handleFindManualLinks = async () => {
    if (!identifiedMachineForManualSearch) return;

    setManualsModalState({ isOpen: true, isLoading: true, links: [], error: null });
    try {
        const { make, model } = identifiedMachineForManualSearch;
        const links = await scrapeManualLinks(make, model);
        if (links.length === 0) {
            setManualsModalState({ isOpen: true, isLoading: false, links: [], error: "No direct PDF manual links could be found automatically." });
        } else {
            setManualsModalState({ isOpen: true, isLoading: false, links, error: null });
        }
    } catch (e: any) {
        setManualsModalState({ isOpen: true, isLoading: false, links: [], error: e.message || "Failed to find manuals." });
    }
  };

  const handleShowGoogleSearchResult = () => {
    if (!identifiedMachineForManualSearch) return;
    const { make, model } = identifiedMachineForManualSearch;
    const query = `filetype:pdf "${model}" "${make}" official manual support OR user guide OR service manual`;
    const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleCameraChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newCameraId = event.target.value;
    setSelectedCameraId(newCameraId === "default" ? null : newCameraId);
    localStorage.setItem(CAMERA_PREFERENCE_KEY, newCameraId === "default" ? "" : newCameraId);
    if (stream) { // If camera is active, stop and restart with new one
      stopCapture();
      // A small delay might be needed for the old stream to fully release before starting new
      setTimeout(() => startCapture(), 200); 
    }
  };
  
  // Voice Command Integration
  useEffect(() => {
    if (registerScanAction) {
        registerScanAction("VOICE_START_SCAN", () => {
            if (!stream && appStatusRef.current === AppStatus.Idle) startCapture();
        });
        registerScanAction("VOICE_STOP_SCAN", () => {
            if (stream) stopCapture();
        });
        registerScanAction("VOICE_SAVE_MACHINE", () => {
            // This is more complex - which machine to save?
            // Maybe the most recent identified one if `rememberMachinesEnabled` is off.
            // Or provide feedback "Please enable Auto-Save or save manually from response item."
            // For now, let's assume it tries to save the last `identifiedMachineForManualSearch`
            if (identifiedMachineForManualSearch && responses.length > 0) {
                const latestResponseWithMatch = responses.find(r => r.make === identifiedMachineForManualSearch.make && r.modelName === identifiedMachineForManualSearch.model);
                if (latestResponseWithMatch) {
                    handleAddRememberedMachine(latestResponseWithMatch);
                    // Optionally add user feedback for voice command
                }
            }
        });
        registerScanAction("VOICE_FIND_MANUAL", () => {
            if (identifiedMachineForManualSearch) handleFindManualLinks();
        });
    }
  }, [registerScanAction, stream, startCapture, stopCapture, identifiedMachineForManualSearch, responses, handleAddRememberedMachine, handleFindManualLinks]);

  const isLensActive = !!stream;
  const canInteractWithLens = appStatus === AppStatus.Idle || appStatus === AppStatus.Error;
  const isProcessingAnything = appStatus === AppStatus.Analyzing || appStatus === AppStatus.ProcessingFrame || appStatus === AppStatus.InitializingCamera || appStatus === AppStatus.ProcessingQrFromLens;


  return (
    <div className="flex flex-col h-full bg-[#0D0D0D] text-neutral-200 p-4 md:p-6 space-y-4">
      
      {/* UI for camera selection */}
      <div className="flex flex-col sm:flex-row gap-3 items-center">
        <div className="relative flex-grow w-full sm:w-auto">
            <select 
                id="cameraSelect" 
                value={selectedCameraId || "default"} 
                onChange={handleCameraChange}
                disabled={isLensActive || availableCameras.length === 0 || isProcessingAnything}
                className="w-full pl-3 pr-10 py-2.5 text-sm rounded-md bg-[#222222] border border-[#333333] text-neutral-100 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none appearance-none disabled:opacity-60"
                aria-label="Select Camera"
            >
                <option value="default">Default Camera</option>
                {availableCameras.map((camera, index) => (
                <option key={camera.deviceId} value={camera.deviceId}>
                    {camera.label || `Camera ${index + 1}`}
                </option>
                ))}
            </select>
            <ChevronDownIcon className="w-5 h-5 text-neutral-400 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none"/>
        </div>
        <button
          onClick={isLensActive ? stopCapture : startCapture}
          disabled={isProcessingAnything && !isLensActive}
          className={`w-full sm:w-auto flex items-center justify-center px-6 py-2.5 rounded-md font-semibold text-sm transition-colors duration-150 ease-in-out
            ${isLensActive ? 'bg-orange-600 hover:bg-orange-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}
            disabled:opacity-60 disabled:cursor-not-allowed
          `}
          style={{ minWidth: '160px' }} // Ensure button has decent width
        >
          {isLensActive ? (
            <><StopIcon className="w-5 h-5 mr-2" /> Stop Lens</>
          ) : (
            appStatus === AppStatus.InitializingCamera ? (
              <><Loader size="sm" className="mr-2" /> Initializing...</>
            ) : (
              <>
                {/* Using EyeIcon as a generic "Lens" icon instead of CameraIcon which is for page title */}
                <EyeIcon className="w-5 h-5 mr-2" /> Start Lens
              </>
            )
          )}
        </button>
        {nonMachineDetectionCount >= 2 && !isLensActive && (
            <button
                onClick={onNavigateToManualAdd}
                className="w-full sm:w-auto flex items-center justify-center px-6 py-2.5 rounded-md font-semibold text-sm transition-colors duration-150 ease-in-out bg-sky-600 hover:bg-sky-700 text-white"
                title="Manually add a machine that could not be identified"
            >
                <PlusCircleIcon className="w-5 h-5 mr-2" />
                Manual Add
            </button>
        )}
      </div>
      
      {error && (
        <div className="p-3 rounded-md bg-red-800/50 border border-red-700/70 text-red-300 text-sm flex items-center gap-2">
          <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
       {qrMessage && (
        <div className={`p-3 rounded-md text-sm flex items-center gap-2 ${appStatus === AppStatus.Error ? 'bg-red-800/50 border-red-700/70 text-red-300' : 'bg-sky-800/50 border-sky-700/70 text-sky-300'}`}>
          <InformationCircleIcon className="w-5 h-5 flex-shrink-0" />
          <span>{qrMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-grow overflow-hidden">
        <div className="bg-[#1A1A1A] p-3 rounded-lg shadow-xl border border-[#2C2C2C] flex flex-col min-h-[300px] sm:min-h-[400px]">
          <div className="aspect-[16/10] w-full relative overflow-hidden rounded-md bg-black flex-shrink-0">
            <VideoPlayer videoRef={videoRef} stream={stream} />
            {appStatus === AppStatus.InitializingCamera && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70">
                    <Loader size="lg" />
                    <p className="mt-3 text-neutral-300 text-sm">Initializing camera...</p>
                </div>
            )}
          </div>
          <div className="mt-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-sm">
             <ToggleSwitch 
                id="rememberMachinesToggle"
                label="Auto-Save Identified Machines"
                checked={rememberMachinesEnabled}
                onChange={handleToggleRememberMachines}
                disabled={!currentUser || isProcessingAnything}
                Icon={BookmarkIcon}
              />
            {identifiedMachineForManualSearch && showSuggestion && (
              <div className="mt-2 sm:mt-0 flex flex-wrap items-center gap-2">
                <button
                  onClick={handleFindManualLinks}
                  className="flex items-center text-xs px-3 py-1.5 rounded-md bg-sky-600 hover:bg-sky-700 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500"
                  title="Use AI to find direct PDF links for this machine's manual."
                >
                  <SparklesIcon className="w-4 h-4 mr-1.5"/>
                  Find Manuals
                </button>
                <button
                  onClick={handleShowGoogleSearchResult}
                  className="flex items-center text-xs px-3 py-1.5 rounded-md bg-neutral-600 hover:bg-neutral-500 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-400"
                  title="Open a new tab with Google search results for PDF manuals."
                >
                  <MagnifyingGlassIcon className="w-4 h-4 mr-1.5"/>
                  Show Google Result
                </button>
              </div>
            )}
          </div>
          
          <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
        </div>

        <div className="bg-[#1A1A1A] p-3 rounded-lg shadow-xl border border-[#2C2C2C] flex flex-col min-h-[300px] sm:min-h-[400px] overflow-hidden">
          <h2 className="text-lg font-semibold text-neutral-100 mb-3 flex items-center">
            <SparklesIcon className="w-5 h-5 mr-2 text-red-400"/>
            AI Analysis Feed
          </h2>
          {appStatus === AppStatus.Analyzing && responses.length === 0 && (
            <div className="flex-grow flex flex-col items-center justify-center text-neutral-500">
                <Loader size="lg" />
                <p className="mt-3">Analyzing initial frame...</p>
            </div>
          )}
          {responses.length === 0 && appStatus !== AppStatus.Analyzing && (
            <div className="flex-grow flex flex-col items-center justify-center text-neutral-600 italic">
              <EyeIcon className="w-12 h-12 mb-3"/>
              <p>Analysis results will appear here.</p>
              {!stream && <p className="text-xs mt-1">Start the Lens to begin.</p>}
            </div>
          )}
          <div className="flex-grow space-y-3 overflow-y-auto pr-1">
            {responses.map((res) => (
              <ResponseItem 
                key={res.id} 
                response={res} 
                onSaveMachine={rememberMachinesEnabled ? handleAddRememberedMachine : undefined}
                onClick={handleResponseClick} 
              />
            ))}
          </div>
        </div>
      </div>
      <QrDisplayModal isOpen={isQrModalOpen} onClose={() => setIsQrModalOpen(false)} qrData={qrCodeDataString} title="Machine QR Code"/>

      {manualsModalState.isOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
            <div className="bg-[#1A1A1A] p-6 rounded-lg shadow-xl border border-[#2C2C2C] w-full max-w-lg max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-neutral-100 flex items-center">
                        <DocumentTextIcon className="w-6 h-6 mr-2 text-sky-400"/>
                        Manual Search Results
                    </h3>
                    <button onClick={() => setManualsModalState({ isOpen: false, isLoading: false, links: [], error: null })} className="p-1 text-neutral-400 hover:text-white">
                        <XMarkIcon className="w-6 h-6"/>
                    </button>
                </div>
                <div className="flex-grow overflow-y-auto pr-2">
                    {manualsModalState.isLoading && (
                        <div className="flex flex-col items-center justify-center h-full text-neutral-400">
                            <Loader size="lg" />
                            <p className="mt-3">Searching for manuals...</p>
                        </div>
                    )}
                    {manualsModalState.error && (
                        <div className="p-3 text-center text-orange-300 bg-orange-800/30 border border-orange-700/50 rounded-md">
                            <p className="font-semibold">Search Notice</p>
                            <p className="text-sm">{manualsModalState.error}</p>
                        </div>
                    )}
                    {!manualsModalState.isLoading && !manualsModalState.error && manualsModalState.links.length > 0 && (
                        <ul className="space-y-2">
                            {manualsModalState.links.map((link, index) => (
                                <li key={index} className="bg-[#252525] p-3 rounded-md border border-[#383838] hover:border-sky-500">
                                    <a href={link} target="_blank" rel="noopener noreferrer" className="text-sky-400 text-sm break-all hover:underline">
                                        {link}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default App;
