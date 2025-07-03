import { Role } from './types';

export const DEFAULT_PROMPT: string = "Analyze the image. If it is a machine, identify its make and model, and your confidence percentage. Also, if a serial number, model number, or unique identifier is visible on the machine, include it as 'Identifier: {identifier}'. Format: 'Make: {make}, Model: {model}, Identifier: {identifier}, Confidence: {percentage}%'. If it is not a machine, state 'Not a machine. Confidence: {percentage_that_it_is_not_a_machine}%'. If unsure about make/model but it might be a machine, use 'Unknown' for make/model and a low confidence like 'Make: Unknown, Model: Unknown, Confidence: 10%'.";
export const SUMMARIZE_UNKNOWN_PROMPT: string = "Describe the primary object in this image in a single word. If it is a complex scene, describe the most prominent object.";
export const PROMPT_MACHINE_NUMBER: string = "Examine this image carefully. Is there a visible machine serial number, model number, or any other unique alphanumeric identifier on the machine? If yes, state ONLY the most prominent or complete identifier. If multiple distinct identifiers are clearly visible, list them separated by a comma, prioritizing the one that seems like a primary serial or model number. If no such identifier is clearly visible, or if you are uncertain, respond with 'No number visible'.";
export const GEMINI_MODEL_NAME: string = "gemini-2.5-flash-preview-04-17"; // Multimodal model

// Token Optimization Settings
export const CAPTURE_INTERVAL_MS: number = 2000; // Capture a frame every 2 seconds
export const IMAGE_QUALITY: number = 0.7; // JPEG quality (0.0 to 1.0). Lower is smaller.
export const IMAGE_SCALE_FACTOR: number = 0.6; // Scale image to 60% of original size. Lower is smaller.

// Change Detection Settings
export const CHANGE_THRESHOLD: number = 5000000; // Threshold for frame difference to trigger API call.

// RBAC
export const ROLES: Record<string, Role> = {
  SUPERADMIN: Role.SuperAdmin,
  ADMIN: Role.Admin, // Represents Owner
  MANAGER: Role.Manager, // New Manager role
  USER: Role.User,   // Represents Worker/Employee
};

// Logo Base64 - Using the provided TRIN logo
export const TRIN_LOGO_BASE64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAADICAMAAACtWK6eAAAASFBMVEXtAADsFRXsFBTsExPsERHsDxDsFRXwyszsDxDsDhDsDxDsDxXyszsDxDsDhDsDxDsDxX439/sDxDsDhDsDxDsDxXcDxDsqKhHx9DEAAAAGXRSTlMAECDgIDAwMFBQUGBgf3+Pv7/P39/v7++hpyRjAAACZklEQVR4nO3ci27CMBBFUQBREFFBRSXK/v9nl0K1pxnGdMA5XoKewh5JksmSyQ0DAAAAAAAAAMB/LzVb0rZsy7our431WDrpvrbV6rS2b8kXp9qfVn1tL9frHftW1desrtZLXfX2rC4vpVw1N0r71dZ3rZt1df3pWl2Nda2vVtfaOtbfVmpdG/f0Yk3r5rS9t7P6VNcOTuvSmdZlPzdr/bS9t9P6VNcOTgO+H9A6297ZOf11XTu4dD7cOtvOmdlbXXs4DTKtrZ2N1Tc2D05vdtbaONzYNDgNAutsexvXNzYPTm921tobjQ0fTgOEaWvj2t4+OB2EtLY2rq0NOBGKtLXx1dpNnBCJtrbWVmvThRPEqW1t9WulmzhxEtrbWn83bYgTh9vaGn9PNdGEKW5va/3d1CZOEuNua/3dtDlOEuNua/3d1ChOEuNua/3d1ChOEuNua/3d1ChOEuNua/3d1ChOEuNua/3d1ChOEuNua/3d1ChOEuNua/3d1ChOEuNua/3d1ChOEuNua/3d1ChOEuNua/3d1ChOEuNua/3d1ChOEuNua/3d1ChOEyC6cAAAAAAADwP/MD3X0tXl0/NFAAAAAASUVORK5CYII=";

// Remember Machines Feature localStorage Keys
export const REMEMBER_MACHINES_TOGGLE_KEY_PREFIX = 'gemini_live_app_remember_toggle_';
export const USER_MACHINE_DATA_KEY_PREFIX = 'gemini_live_app_user_machine_data_'; // For detailed machine data

// QR Code Type Identifier
export const TRIN_MACHINE_QR_TYPE = "TRIN_MACHINE_QR_V1";
export const TRIN_MACHINE_QR_VERSION = "1.0";
