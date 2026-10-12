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
  authorizedDevices: string[]; // device IDs
}

export type ConnectionStatus = 'ONLINE' | 'OFFLINE' | 'ERROR';

export type SensorStatus = 'ACTIVE' | 'NOT CONNECTED' | 'ERROR' | 'DISABLED' | 'UNKNOWN';

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

export type CommandAction = 'FORWARD' | 'BACKWARD' | 'LEFT' | 'RIGHT' | 'STOP' | 'EMERGENCY_STOP' | 'LIGHTS_TOGGLE' | 'SPEED_SET';

export interface RoverCommand {
  commandId: string;
  deviceId: string;
  userId: string;
  command: CommandAction;
  speedPercentage?: number; // 0 - 100
  timestamp: number;
  expiresAt: number; // Stale protection (e.g. valid for 1500ms)
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
  status: ConnectionStatus;
  firmwareVersion: string;
  lastSeen: number | null;
  macAddress?: string;
  ipAddress?: string;
  hardwareModel: string; // e.g. "ESP32-WROOM-32 Rover Rev 1.0"
  cameraStreamUrl?: string | null;
  cameraStatus?: 'CONNECTED' | 'NOT CONNECTED' | 'ERROR' | 'UNAVAILABLE';
  motorStatus?: 'STANDBY' | 'MOVING' | 'STOPPED' | 'ERROR' | 'EMERGENCY_LOCKED';
  safetyLock: boolean;
  commandTimeoutMs: number; // e.g. 1500 ms
}

export interface SystemLog {
  id: string;
  timestamp: number;
  deviceId?: string;
  userId?: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'SECURITY';
  message: string;
  metadata?: Record<string, any>;
}
