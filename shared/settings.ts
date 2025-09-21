// Shared application settings and configuration
export const APP_SETTINGS = {
  APP_NAME: "Wasteland Blues",
  VERSION: "Interactive Wasteland Navigator v2.281",
  DEFAULT_ADMIN_CODE: "HOUSE-ALWAYS-WINS",
} as const;

// Types for settings management
export interface AppSettings {
  appName: string;
  version: string;
  adminCode: string;
}

// Default settings
export const DEFAULT_SETTINGS: AppSettings = {
  appName: APP_SETTINGS.APP_NAME,
  version: APP_SETTINGS.VERSION,
  adminCode: APP_SETTINGS.DEFAULT_ADMIN_CODE,
};

// Settings update schema (excludes sensitive fields)
export interface SettingsUpdate {
  appName?: string;
  version?: string;
  adminCode?: string;
}

// Public settings (safe for public API)
export interface PublicSettings {
  appName: string;
  version: string;
}