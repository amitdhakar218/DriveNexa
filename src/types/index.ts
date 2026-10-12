export type UserRole = 'USER' | 'ADMIN' | 'DEVELOPER';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: UserRole;
  createdAt: number;
  lastLogin: number;
  biometricEnabled?: boolean;
  authorizedDevices: string[]; // device IDs the user owns or has permission to monitor
}

export type DeviceConnectionState = 'CONNECTED' | 'DISCONNECTED' | 'UNKNOWN' | 'ERROR';

// Backward compatibility alias
export type ConnectionStatus = DeviceConnectionState;

export type SensorStatus = 'ACTIVE' | 'NOT_CONNECTED' | 'ERROR' | 'DISABLED' | 'UNKNOWN';

export type CameraStreamState =
  | 'NOT_CONFIGURED'
  | 'CONFIGURED_UNVERIFIED'
  | 'STREAMING'
  | 'DISCONNECTED'
  | 'UNAVAILABLE'
  | 'ERROR';

export type SensorType =
  | 'speed'
  | 'temperature'
  | 'battery'
  | 'gps'
  | 'distance'
  | 'accelerometer'
  | 'gyroscope'
  | 'crash'
  | 'camera'
  | 'motor'
  | 'signal'
  | 'custom';

export interface SensorDefinition {
  id: string;
  deviceId: string;
  name: string;
  type: SensorType;
  status: SensorStatus;
  enabled: boolean;
  currentValue: number | string | null;
  unit: string;
  lastUpdate: number | null;
  errorStatus?: string | null;
  firmwarePin?: string;
  firmwareProtocol?: 'I2C' | 'SPI' | 'UART' | 'ADC' | 'GPIO';
  minThreshold?: number;
  maxThreshold?: number;
}

export interface TelemetryRecord {
  id?: string;
  deviceId: string;
  sensorId: string;
  sensorType: SensorType;
  timestamp: number;
  value: number;
  unit: string;
  status: SensorStatus;
}

export interface GPSRecord {
  id?: string;
  deviceId: string;
  timestamp: number;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null; // meters
  speed: number | null; // km/h
  heading: number | null; // degrees 0-360
  status: 'FIX_ACQUIRED' | 'NO_FIX' | 'DISCONNECTED';
}

export type CommandAction =
  | 'FORWARD'
  | 'BACKWARD'
  | 'LEFT'
  | 'RIGHT'
  | 'STOP'
  | 'EMERGENCY_STOP'
  | 'LIGHTS_TOGGLE'
  | 'SPEED_SET';

export interface RoverCommand {
  commandId: string;
  deviceId: string;
  userId: string;
  command: CommandAction;
  speedPercentage?: number; // 0 - 100
  timestamp: number;
  expiresAt: number; // Stale protection: strictly valid for 1500ms
  status: 'PENDING' | 'EXECUTED' | 'EXPIRED' | 'REJECTED';
  executedAt?: number;
  sourceIp?: string;
}

export type AlertSeverity = 'WARNING' | 'CRITICAL' | 'EMERGENCY';

export interface SystemAlert {
  id: string;
  deviceId: string;
  title: string;
  message: string;
  eventType:
    | 'high_temperature'
    | 'low_battery'
    | 'sensor_disconnected'
    | 'gps_unavailable'
    | 'camera_disconnected'
    | 'connection_lost'
    | 'connection_restored'
    | 'abnormal_speed'
    | 'crash_impact'
    | 'emergency_stop'
    | 'device_error';
  severity: AlertSeverity;
  timestamp: number;
  acknowledged: boolean;
}

export interface DeviceInfo {
  deviceId: string;
  name: string;
  ownerId: string;
  authorizedUsers: string[];
  status: DeviceConnectionState;
  firmwareVersion: string;
  lastSeen: number | null;
  lastHeartbeat: number | null;
  lastDataUpdate: number | null;
  lastError?: string | null;
  macAddress?: string;
  ipAddress?: string;
  hardwareModel: string;
  cameraStreamUrl?: string | null;
  cameraStatus: CameraStreamState;
  motorStatus?: 'STANDBY' | 'MOVING' | 'STOPPED' | 'ERROR' | 'EMERGENCY_LOCKED' | 'UNKNOWN';
  safetyLock: boolean;
  commandTimeoutMs: number;
}

export interface SystemLog {
  id: string;
  timestamp: number;
  deviceId?: string;
  userId?: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'SECURITY';
  message: string;
  metadata?: Record<string, unknown>;
}

export type FeedbackCategory = 'BUG' | 'SUGGESTION' | 'PROBLEM' | 'FEATURE_REQUEST';

export interface FeedbackSubmission {
  id: string;
  userId: string;
  userEmail: string | null;
  category: FeedbackCategory;
  title: string;
  description: string;
  deviceId: string;
  appVersion: string;
  timestamp: number;
  errorCode?: string | null;
  status: 'NEW' | 'REVIEWED' | 'RESOLVED';
}
