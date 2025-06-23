
export interface GeminiResponse {
  id: string;
  frameDataUrl: string; // The base64 data URL of the captured frame for preview
  description: string;
  timestamp: string;
  prompt: string; // Retained for internal logic, but not displayed
  model: string;  // Retained for internal logic, but not displayed
  isError?: boolean;
  confidence: number | null;
  make?: string | null; // Added for structured machine data
  modelName?: string | null; // Renamed from model to avoid conflict with 'model' field for GEMINI_MODEL_NAME
  machineNumber?: string | null; // Added for specific machine identifier
  originalGeminiOutput?: string; // Added to store raw Gemini output for saving
}

export enum AppStatus {
  Idle = 'IDLE', 
  InitializingCamera = 'INITIALIZING_CAMERA', 
  Analyzing = 'ANALYZING', 
  ProcessingFrame = 'PROCESSING_FRAME', 
  Error = 'ERROR' 
}

export interface ParsedMachineInfo {
  make: string | null;
  model: string | null;
  machineNumber?: string | null; // Added for specific machine identifier
  isMachineFormat: boolean; // True if the description seems to follow the Make/Model format
  confidence: number | null; // Added field for certainty
}

export enum Role {
  SuperAdmin = 'superadmin',
  Admin = 'admin',
  User = 'user',
}

export interface User {
  id: string;
  username: string;
  role: Role;
  profilePictureUrl?: string; // Added for profile picture
}

export interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password_raw: string) => Promise<void>;
  signup: (username: string, password_raw: string) => Promise<void>; 
  logout: () => void;
  error: string | null;
  clearError: () => void;
  updateUserProfile: (userId: string, newUsername: string) => Promise<User>;
  updateUserPfp: (userId: string, profilePictureUrl: string) => Promise<User>; // Added
}

// Type for data passed to Machine Detail Page
export type MachineDetailData = Omit<GeminiResponse, 'id' | 'timestamp' | 'prompt' | 'model' | 'isError' | 'confidence'>;

// Props for the main App component
export interface AppProps {
  onNavigateToProfile: () => void;
  onNavigateToSavedMachines: () => void;
  onNavigateToMachineDetail: (machineData: MachineDetailData) => void;
  currentUser: User | null;
}
