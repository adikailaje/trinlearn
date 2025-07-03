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
  Error = 'ERROR',
  SHOWING_QR_CODE = 'SHOWING_QR_CODE', // Added for QR code display state
  ProcessingQrFromLens = 'PROCESSING_QR_FROM_LENS', // Added for QR detected during Lens
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
  Admin = 'admin', // Represents Owner
  Manager = 'manager',
  User = 'user',   // Represents Worker/Employee
}

export interface User {
  id: string;
  username: string;
  role: Role;
  profilePictureUrl?: string; // Added for profile picture
  chatEnabled?: boolean; // Indicates if user can participate in chat
  managerId?: string | null; // Added for user hierarchy
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
// This will now more closely mirror UserMachineData for consistency
export type MachineDetailData = UserMachineData & { 
  id: string; // Unique ID for the instance of viewing/editing, can be make-modelName for saved items
  userId?: string; // ID of the user who owns this data if viewing from "My Machines"
};


export interface MachineNumberUpdatePayload {
  responseId: string; // Corresponds to MachineDetailData.id
  newMachineNumber: string | null;
}

// Props for the main App component when used in the "Scan" view
export interface ScanViewAppProps {
  onNavigateToProfile: () => void;
  onNavigateToSavedMachinesView: () => void; // Navigates MainWrapper to SavedMachinesPage
  onNavigateToMachineDetailView: (machineData: MachineDetailData, onUpdate: (payload: MachineNumberUpdatePayload) => void) => void; // Navigates MainWrapper to MachineDetailPage
  onNavigateToManualAdd: () => void;
  currentUser: User | null;
  isActiveScanView: boolean; // To know if the "Scan" tab in bottom nav is active
  registerDataChangeCallback: (callback: () => void) => void; 
}

// --- New Types for QR Code Feature ---
export interface DocumentLink {
  id: string;
  name: string;
  url: string;
  type: 'manual' | 'document' | 'other'; // More flexible type
  addedDate: string;
}

export enum WorkRequestStatus {
  Open = 'Open',
  InProgress = 'In Progress',
  OnHold = 'On Hold',
  Closed = 'Closed',
  Cancelled = 'Cancelled'
}

export interface WorkRequest {
  id: string;
  title: string;
  description?: string;
  status: WorkRequestStatus;
  priority: WorkItemPriority; // Re-use from existing WorkItemPriority
  createdDate: string;
  createdByUserId?: string; // ID of user who created it
  assignedToUserId?: string; // ID of user it's assigned to
  lastUpdated: string;
  photoDataUrl?: string; // For the attached photo from the report
  // New fields for dashboard feeds
  reportedByUsername?: string;
  machine?: {
    make: string;
    modelName: string;
    machineNumber?: string | null;
  };
}

export interface UserMachineData {
  make: string;
  modelName: string;
  machineNumber?: string | null;
  originalGeminiOutput?: string; 
  frameDataUrl?: string;         
  userDisplayDescription?: string; 
  lastUpdated: string;
  // New fields for enriched data
  additionalInfo?: string; // General notes or information
  workHistory?: MaintenanceRecord[];
  documents?: DocumentLink[];
  workRequests?: WorkRequest[];
  floorPlanSectionId?: string | null; // ID of the section in the floor plan
  // Fields for AR Overlay
  currentStatus?: 'Running' | 'Idle' | 'Fault' | 'Maintenance' | 'Unknown';
  currentErrorCode?: string | null;
  lastTelemetryUpdate?: string; // ISO timestamp for when status/error was last "updated"
  troubleshootingTips?: { [errorCode: string]: string };
}

export interface TrinMachineQrPayload {
  type: string; // e.g., "TRIN_MACHINE_QR_V1"
  version: string;
  data: UserMachineData; // All machine data embedded here
}
// --- End New Types ---

export enum MachineSortOption {
  LastUpdated = 'lastUpdated',
  MakeModel = 'makeModel',
}

// Props for SavedMachinesPage, including the new callback
export interface SavedMachinesPageProps {
    onNavigateBackToScanView: () => void; 
    onNavigateToMachineDetail: (machineData: MachineDetailData, onUpdate: (payload: MachineNumberUpdatePayload) => void) => void;
    onSavedDataChange: () => void; 
}

// Props for MachineDetailPage
export interface MachineDetailPageProps {
    machineInitialData: MachineDetailData; // Changed prop name for clarity
    onNavigateBackToScanView: () => void; 
    onMachineNumberUpdate: (payload: MachineNumberUpdatePayload) => void; // This callback might need to be more general if other fields update live
    // Consider adding a callback for general data updates triggered from MachineDetailPage
    onMachineDataUpdate: (updatedMachineData: UserMachineData) => void;
}

// Enum for main application views, now centralized here
export enum AuthView {
  SignIn,
  SignUp,
  Dashboard,
  MyWork,
  Scan,
  ReportIssue,
  Safety,
  UserProfile,
  SavedMachines,
  MachineDetail,
  CmmsSettings, 
  WorkOrderDetail, 
  WorkOrderCompletion, 
  PermitDetail, 
  ChatList, 
  ChatConversation, 
  FloorPlanView,    // Added
  FloorPlanEdit,    // Added
  ManualAddMachine,
}


// --- Maintenance Records ---
export enum CmmsSyncStatus {
  NotSynced = 'notsynced',
  Pending = 'pending',
  Synced = 'synced',
  Failed = 'failed',
}

export interface MaintenanceRecord {
  id: string; // UUID
  userId: string; // User who logged this record for the machine
  machineMake: string; // Denormalized for easier querying if ever moved to backend
  machineModelName: string; // Denormalized
  serviceDate: string; 
  issueDescription: string;
  repairActions: string;
  partsUsed?: string; 
  technician?: string;
  createdAt: string; 
  updatedAt: string; 
  cmmsSyncStatus: CmmsSyncStatus;
  cmmsRecordId?: string; 
  receiptDataUrl?: string; // For uploaded receipt images
}

// --- Dashboard ---
export interface WorkOrder { // This seems like a simplified version of WorkItem, maybe for a summary.
  id: string;
  title: string;
  dueDate: string; // ISO Date string
  isOverdue: boolean;
}

// --- My Work Detail ---
export interface Task {
  id: string;
  description: string;
  completed: boolean;
}

// Extend Part interface for inventory details
export interface Part {
  id: string;
  name: string;
  partNumber?: string;
  quantityRequired: number;
  notes?: string;
  description?: string; // Optional: Fuller description of the part
  currentStock?: number; // For fetched stock quantity
  stockLocation?: string; // For fetched stock location
  stockStatus?: 'In Stock' | 'Out of Stock' | 'Unknown'; // Fetched status
  isCheckingStock?: boolean; // UI state for loading stock check
  isRequestingPart?: boolean; // UI state for loading part request
  requestStatusMessage?: string; // Feedback message after requesting a part
}


export interface AssetMaintenanceActivity {
  id: string;
  date: string; // ISO Date string
  activityDescription: string;
  technician?: string;
  workOrderId?: string;
}

export enum WorkItemStatus {
    Open = 'Open',
    InProgress = 'In Progress',
    Paused = 'Paused',
    Completed = 'Completed',
    Blocked = 'Blocked', // Added a common status
}

// For Inspection Checklists
export enum ChecklistItemResponseType {
  PassFail = 'PassFail',
  Numeric = 'Numeric',
  Text = 'Text',
}

export interface ChecklistItem {
  id: string;
  point: string;
  responseType: ChecklistItemResponseType;
  expectedValue?: string | { min?: number; max?: number };
  responseValue?: boolean | number | string | null;
  comment?: string;
  isFail?: boolean;
}


export interface WorkItem {
  id: string;
  type: WorkItemType;
  title: string; 
  assetId?: string; 
  assetName?: string; 
  priority: WorkItemPriority;
  dueDate: string; // ISO Date string
  status: WorkItemStatus; 
  assignedToUserId: string;
  description?: string;
  location?: string; 
  
  tasks?: Task[]; 
  parts?: Part[]; 
  safetyProcedures?: string[]; 
  hazards?: string[]; 
  requiredPPE?: string[]; 
  assetHistory?: AssetMaintenanceActivity[]; 
  checklist?: ChecklistItem[]; // Added for inspections

  startTime?: string; // ISO Timestamp
  pauseTime?: string; // ISO Timestamp
  completionTime?: string; // ISO Timestamp
  completionNotes?: string; 
  signatureDataUrl?: string; 
  photoDataUrl?: string; // For Report Issue photo
  // DEMO_MARKER: This interface is for demo purposes for My Work section
}

export enum WorkItemPriority {
  High = 'High',
  Medium = 'Medium',
  Low = 'Low',
}

export enum WorkItemType {
  WorkOrder = 'Work Order',
  Inspection = 'Inspection Round',
}

// Updated for richer prefill data
export interface ReportIssuePageProps {
  prefillData?: { 
    make?: string;
    modelName?: string;
    assetId?: string; 
    assetName?: string; 
    issueDescription?: string; 
  };
}

// --- Safety Section Types ---
export enum SafetyPermitType {
  LOTO = 'Lock-out/Tag-out',
  ConfinedSpace = 'Confined Space Entry',
  HotWork = 'Hot Work',
  WorkingAtHeight = 'Working at Height',
  General = 'General Safety Permit',
  ChemicalHandling = 'Chemical Handling',
  ElectricalWork = 'Electrical Work',
}

export enum SafetyPermitStatus {
  Active = 'Active', 
  PendingAcknowledgement = 'Pending Acknowledgement', 
  Acknowledged = 'Acknowledged', 
  Expired = 'Expired', 
  Closed = 'Closed', 
  Cancelled = 'Cancelled',
  CompletedPendingApproval = 'Completed, Pending Approval',
}

export interface SafetyPermit {
  id: string; 
  permitNumber: string; 
  title: string;
  type: SafetyPermitType;
  assetId?: string;
  assetName?: string;
  description: string; 
  issuedDate: string; 
  expiryDate: string; 
  assignedToUserId: string; 
  status: SafetyPermitStatus;
  responsiblePerson?: string; 
  specificInstructions?: string; 
  detailedProcedures?: string[]; 
  
  // New Fields for Lifecycle
  issuedByUserId?: string;
  issuedByUsername?: string;

  acknowledgementSignatureDataUrl?: string; 
  acknowledgedDate?: string; 

  completionNotes?: string;
  completionSignatureDataUrl?: string;
  completionDate?: string;

  approvalNotes?: string;
  approvalSignatureDataUrl?: string;
  approvalDate?: string;
  approverId?: string;
}

export interface SafetyProcedureDocument {
  id: string; 
  documentNumber?: string; 
  title: string;
  category: string; 
  keywords?: string[];
  assetTypeAffinity?: string[]; 
  contentUrl?: string; 
  content?: string; 
  summary?: string;
  lastReviewedDate?: string; 
  version?: string;
}

export interface SystemAlert {
  id: string;
  message: string;
  type: 'safety' | 'equipment' | 'info';
  timestamp: string; // ISO Timestamp
}

// Updated DashboardData for role-specific views
export interface EmployeeDashboardStats {
  tasksDueToday: number;
  tasksCompletedToday: number;
  workItemsDueToday: WorkItem[];
  workItemsCompletedToday: WorkItem[];
  teamReports: WorkRequest[]; // New
}

export interface ManagerDashboardStats {
  employeeTasksCompletedTodayCount: number;
  employeeOpenTasksCount: number;
  employeeOpenTasksByPriority: { [key in WorkItemPriority]: number };
  topPerformingEmployees: Array<{ id: string, username: string; profilePictureUrl?: string; completedCount: number }>;
  newWorkRequests: WorkRequest[]; // New
}

export interface OwnerDashboardStats {
  orgTasksCompletedTodayCount: number;
  orgOpenTasksCount: number;
  orgOpenHighPriorityTasksCount: number;
  tasksCompletedByRole: { employee: number; manager: number }; // tasks done by employees vs managers
  allOpenWorkRequests: WorkRequest[]; // New
}

export type RoleSpecificDashboardData = 
  | { role: Role.User; stats: EmployeeDashboardStats }
  | { role: Role.Manager; stats: ManagerDashboardStats }
  | { role: Role.Admin | Role.SuperAdmin; stats: OwnerDashboardStats };


export interface DashboardData {
  // General data shown to all, or part of what's used to build role-specific views
  activeWorkOrdersSummary: { // This can be derived from user's own work for employees, or aggregated for others
    dueToday: number;
    overdue: number;
  };
  recentAlerts: SystemAlert[]; // This can remain common
  roleSpecificData?: RoleSpecificDashboardData; // New field for role-specific stats
}

// --- Chat Feature Types ---
export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderUsername: string; // Denormalized for easy display
  receiverId: string;
  content: string;
  timestamp: string; // ISO Date string
  isRead: boolean;
}

export interface ChatParticipantDetails {
  username: string;
  role: Role;
  profilePictureUrl?: string;
}

export interface ChatConversation {
  id: string; // e.g., userId1_userId2 (sorted alphabetically)
  participantIds: string[];
  participantDetails: { [userId: string]: ChatParticipantDetails };
  lastMessagePreview?: string;
  lastMessageTimestamp?: string; // ISO Date string
  lastMessageSenderId?: string;
  unreadCountByUserId: { [userId: string]: number }; // Unread count for each participant
}

// --- Floor Plan Types ---
export type FloorSectionCategory = 'Production' | 'Storage' | 'QC' | 'Logistics' | 'Office' | 'Utility' | 'Restricted' | 'Other';

export interface FloorSectionDefinition {
  id: string; // Unique ID for the section
  name: string; // e.g., "Assembly Line A", "Storage Area 1"
  details?: string; // Optional longer description for the label on hover
  color: string; // Hex color string, e.g., "#FF5733"
  category: FloorSectionCategory;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex?: number; // Optional for controlling overlap if sections can overlap
}

export interface FloorPlanData {
  id: string; // e.g., "main-factory-floor"
  name: string; // e.g., "Main Factory Floor Plan"
  sections: FloorSectionDefinition[];
  planWidth: number; 
  planHeight: number;
  lastUpdated: string; // ISO timestamp
}


// --- AR Overlay Type ---
export interface AROverlayData {
  id: string; // e.g., based on make-model from GeminiResponse or UserMachineData
  make: string;
  modelName: string;
  machineNumber?: string | null;
  status: string; // From UserMachineData.currentStatus
  errorCode?: string | null; // From UserMachineData.currentErrorCode
  troubleshootingTip?: string | null; // Pre-fetched for current error code
}

// --- Voice Commands Types ---
export enum VoiceCommandStatus {
  Idle = 'IDLE',
  Listening = 'LISTENING',
  Processing = 'PROCESSING',
  Error = 'ERROR',
  Success = 'SUCCESS',
}

export interface ActiveVoiceCommand {
  command: string; // e.g., 'START_SCAN', 'NAVIGATE_DASHBOARD'
  params?: any; // Optional parameters extracted from speech
  fullTranscript: string;
}

export interface VoiceCommandContextType {
  voiceStatus: VoiceCommandStatus;
  transcript: string | null;
  error: string | null;
  activeCommand: ActiveVoiceCommand | null; // Last successfully recognized and processed command
  startListening: () => void;
  stopListening: () => void;
  isRecognitionAvailable: boolean;
  // Functions to register actions from components
  registerNavigationAction: (command: string, action: (params?: any) => void) => void;
  registerScanAction: (command: string, action: (params?: any) => void) => void;
  executeCommand: (command: string, params?: any) => void; // For directly invoking registered actions
}

// --- Live Interaction (Streaming Voice) Types ---
export enum LiveInteractionStatus {
  IDLE = 'IDLE',
  CONNECTING = 'CONNECTING',
  LISTENING = 'LISTENING',
  PROCESSING = 'PROCESSING', // Sent transcript, waiting for first AI chunk
  SPEAKING = 'SPEAKING',   // AI is talking back
  ERROR = 'ERROR',
}

export interface LiveInteractionContextType {
  status: LiveInteractionStatus;
  userTranscript: string | null;
  aiResponseText: string | null;
  error: string | null;
  isAvailable: boolean;
  startInteraction: () => void;
  stopInteraction: () => void;
}


// --- I18n Types ---
export type Language = 'en' | 'es' | 'hi' | 'mr';

export interface LanguageContextType {
  language: Language;
  t: (key: string, options?: { [key: string]: string | number }) => string;
  changeLanguage: (lang: Language) => void;
}

// --- Predictive Maintenance & Work Order Drafting ---
export interface PredictiveMaintenanceResult {
  component: string;
  predicted_failure_date: string;
  recommendation: string;
}

export interface DraftedWorkOrder {
  title: string;
  priority: WorkItemPriority;
  tasks: string[]; // List of task descriptions
  parts: string[]; // List of part names
}

export interface WorkRequestAnalysisResult {
  likelyCause: string;
  suggestedSteps: string[];
}

export interface ManualsModalState {
  isOpen: boolean;
  isLoading: boolean;
  links: string[];
  error: string | null;
}

export interface ManualAddMachinePageProps {
    onNavigateBack: () => void;
    onMachineAdded: (machineData: MachineDetailData, onUpdate: (payload: MachineNumberUpdatePayload) => void) => void;
}

// AI Receipt Analysis
export interface AnalyzedReceiptData {
    technician?: string;
    serviceDate?: string;
    repairActions?: string;
    partsUsed?: string;
}
