import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import {
  ref as rtdbRef,
  set as rtdbSet,
  get as rtdbGet,
  push as rtdbPush,
  onValue,
  off,
  serverTimestamp as rtdbServerTimestamp,
} from 'firebase/database';
import { db, rtdb } from '../config/firebase';
import {
  DeviceInfo,
  SensorDefinition,
  TelemetryRecord,
  GPSRecord,
  RoverCommand,
  SystemAlert,
  UserProfile,
  SensorStatus,
  ConnectionStatus,
  SystemLog,
} from '../types';

/**
 * Helper to determine device online status based on real heartbeat timestamp
 */
export function calculateDeviceStatus(lastSeen: number | null): ConnectionStatus {
  if (!lastSeen) return 'OFFLINE';
  const now = Date.now();
  const diffSec = (now - lastSeen) / 1000;
  if (diffSec <= 15) return 'ONLINE';
  if (diffSec <= 60) return 'OFFLINE';
  return 'OFFLINE';
}

/**
 * Standard default sensor registry template for when a new device is enrolled
 */
export const DEFAULT_HARDWARE_SENSORS: Omit<SensorDefinition, 'deviceId'>[] = [
  {
    id: 'sens_speed_01',
    name: 'Hall Effect Wheel Speed Sensor',
    type: 'speed',
    status: 'NOT CONNECTED',
    enabled: true,
    currentValue: null,
    unit: 'km/h',
    lastUpdate: null,
    firmwarePin: 'GPIO34',
    firmwareProtocol: 'GPIO',
  },
  {
    id: 'sens_temp_01',
    name: 'Motor Driver & Battery Temperature (DS18B20)',
    type: 'temperature',
    status: 'NOT CONNECTED',
    enabled: true,
    currentValue: null,
    unit: '°C',
    lastUpdate: null,
    firmwarePin: 'GPIO4',
    firmwareProtocol: 'GPIO',
    maxThreshold: 65,
  },
  {
    id: 'sens_batt_01',
    name: 'Li-Ion 2S/3S Battery Voltage Monitor',
    type: 'battery',
    status: 'NOT CONNECTED',
    enabled: true,
    currentValue: null,
    unit: '%',
    lastUpdate: null,
    firmwarePin: 'GPIO35',
    firmwareProtocol: 'ADC',
    minThreshold: 20,
  },
  {
    id: 'sens_gps_01',
    name: 'u-blox NEO-6M / NEO-8M GPS Module',
    type: 'gps',
    status: 'NOT CONNECTED',
    enabled: true,
    currentValue: null,
    unit: 'lat/lng',
    lastUpdate: null,
    firmwarePin: 'RX2 (GPIO16) / TX2 (GPIO17)',
    firmwareProtocol: 'UART',
  },
  {
    id: 'sens_dist_01',
    name: 'Front Ultrasonic Obstacle Sensor (HC-SR04)',
    type: 'distance',
    status: 'NOT CONNECTED',
    enabled: true,
    currentValue: null,
    unit: 'cm',
    lastUpdate: null,
    firmwarePin: 'TRIG: GPIO12, ECHO: GPIO13',
    firmwareProtocol: 'GPIO',
  },
  {
    id: 'sens_mpu_01',
    name: '6-Axis IMU Accelerometer/Gyroscope (MPU6050)',
    type: 'accelerometer',
    status: 'NOT CONNECTED',
    enabled: true,
    currentValue: null,
    unit: 'g / °/s',
    lastUpdate: null,
    firmwarePin: 'SDA: GPIO21, SCL: GPIO22',
    firmwareProtocol: 'I2C',
  },
  {
    id: 'sens_crash_01',
    name: 'Collision & Impact Detection Threshold',
    type: 'crash',
    status: 'NOT CONNECTED',
    enabled: true,
    currentValue: null,
    unit: 'g-force',
    lastUpdate: null,
    firmwarePin: 'SW-420 (GPIO27)',
    firmwareProtocol: 'GPIO',
  },
  {
    id: 'sens_cam_01',
    name: 'ESP32-CAM / OV2640 Live Stream Module',
    type: 'camera',
    status: 'NOT CONNECTED',
    enabled: false,
    currentValue: null,
    unit: 'fps',
    lastUpdate: null,
    firmwarePin: 'DVP 8-bit bus',
    firmwareProtocol: 'SPI',
  },
  {
    id: 'sens_motor_01',
    name: 'L298N / TB6612FNG Dual H-Bridge Motor Driver',
    type: 'motor',
    status: 'NOT CONNECTED',
    enabled: true,
    currentValue: null,
    unit: 'PWM %',
    lastUpdate: null,
    firmwarePin: 'ENA: 18, IN1: 19, IN2: 23, IN3: 25, IN4: 26, ENB: 33',
    firmwareProtocol: 'GPIO',
  },
];

/**
 * Get or register the primary rover device in Firestore
 */
export async function initializePrimaryDevice(ownerId: string): Promise<DeviceInfo> {
  const deviceId = 'ROVER-ESP32-01';
  const deviceRef = doc(db, 'devices', deviceId);

  try {
    const snap = await getDoc(deviceRef);
    if (snap.exists()) {
      return snap.data() as DeviceInfo;
    }

    const newDevice: DeviceInfo = {
      deviceId,
      name: 'NexaRover-01 (ESP32 Testbed)',
      ownerId,
      status: 'OFFLINE',
      firmwareVersion: 'v1.0.4-hw-ready',
      lastSeen: null,
      hardwareModel: 'ESP32-WROOM-32 4WD Robotic Car',
      cameraStreamUrl: null,
      cameraStatus: 'NOT CONNECTED',
      motorStatus: 'STANDBY',
      safetyLock: false,
      commandTimeoutMs: 1500,
    };

    await setDoc(deviceRef, newDevice);

    // Initialize the default sensor specifications
    for (const sensor of DEFAULT_HARDWARE_SENSORS) {
      await setDoc(doc(db, 'devices', deviceId, 'sensors', sensor.id), {
        ...sensor,
        deviceId,
      });
    }

    return newDevice;
  } catch (err) {
    console.warn('Could not initialize primary device in Firestore (using offline container mode):', err);
    return {
      deviceId,
      name: 'NexaRover-01 (ESP32 Testbed)',
      ownerId,
      status: 'OFFLINE',
      firmwareVersion: 'v1.0.4-hw-ready',
      lastSeen: null,
      hardwareModel: 'ESP32-WROOM-32 4WD Robotic Car',
      cameraStreamUrl: null,
      cameraStatus: 'NOT CONNECTED',
      motorStatus: 'STANDBY',
      safetyLock: false,
      commandTimeoutMs: 1500,
    };
  }
}

/**
 * Subscribe to real-time device updates from Firestore & RTDB
 */
export function subscribeToDevice(deviceId: string, onUpdate: (dev: DeviceInfo) => void) {
  // Listen to Firestore doc
  const devDoc = doc(db, 'devices', deviceId);
  const unsubFs = onSnapshot(devDoc, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.data() as DeviceInfo;
      onUpdate({
        ...data,
        status: calculateDeviceStatus(data.lastSeen),
      });
    }
  }, (err) => {
    console.warn('Firestore device listener error:', err.message);
  });

  // Also listen to RTDB live heartbeat if connected
  const rtdbDevRef = rtdbRef(rtdb, `devices/${deviceId}/heartbeat`);
  const unsubRtdb = onValue(rtdbDevRef, (snapshot) => {
    const val = snapshot.val();
    if (val && typeof val.lastSeen === 'number') {
      onUpdate({
        deviceId,
        name: val.name || 'NexaRover-01',
        ownerId: val.ownerId || '',
        status: calculateDeviceStatus(val.lastSeen),
        firmwareVersion: val.firmwareVersion || 'v1.0.4',
        lastSeen: val.lastSeen,
        hardwareModel: val.hardwareModel || 'ESP32 4WD Platform',
        cameraStatus: val.cameraStatus || 'NOT CONNECTED',
        motorStatus: val.motorStatus || 'STANDBY',
        safetyLock: !!val.safetyLock,
        commandTimeoutMs: val.commandTimeoutMs || 1500,
      });
    }
  }, (err) => {
    console.warn('RTDB device heartbeat listener note:', err.message);
  });

  return () => {
    unsubFs();
    off(rtdbDevRef);
  };
}

/**
 * Subscribe to sensors of a device
 */
export function subscribeToSensors(deviceId: string, onUpdate: (sensors: SensorDefinition[]) => void) {
  const sensorsColl = collection(db, 'devices', deviceId, 'sensors');
  const unsub = onSnapshot(sensorsColl, (snap) => {
    const list: SensorDefinition[] = [];
    snap.forEach((d) => {
      list.push(d.data() as SensorDefinition);
    });
    if (list.length > 0) {
      onUpdate(list);
    } else {
      // Fallback to default list with honest NOT CONNECTED status
      onUpdate(DEFAULT_HARDWARE_SENSORS.map(s => ({ ...s, deviceId })));
    }
  }, (err) => {
    console.warn('Firestore sensor listener notice:', err.message);
    onUpdate(DEFAULT_HARDWARE_SENSORS.map(s => ({ ...s, deviceId })));
  });

  return unsub;
}

/**
 * Update sensor enabled state
 */
export async function toggleSensorState(deviceId: string, sensorId: string, enabled: boolean) {
  const sensorDoc = doc(db, 'devices', deviceId, 'sensors', sensorId);
  await updateDoc(sensorDoc, {
    enabled,
    status: enabled ? 'NOT CONNECTED' : 'DISABLED',
  });
}

/**
 * Add a new sensor definition (Future Sensor Plug-in Architecture)
 */
export async function registerNewSensor(sensor: SensorDefinition) {
  const sensorDoc = doc(db, 'devices', sensor.deviceId, 'sensors', sensor.id);
  await setDoc(sensorDoc, sensor);
}

/**
 * Send Remote Command to Rover (FORWARD, BACKWARD, LEFT, RIGHT, STOP, EMERGENCY_STOP)
 * Includes expiration timestamp for stale command protection!
 */
export async function sendRoverCommand(
  deviceId: string,
  userId: string,
  command: RoverCommand['command'],
  speedPercentage: number = 50
): Promise<RoverCommand> {
  const now = Date.now();
  const commandId = `cmd_${now}_${Math.random().toString(36).substring(2, 7)}`;
  const expiresAt = now + 1500; // Strictly valid for 1.5 seconds (command expiration requirement)

  const commandPayload: RoverCommand = {
    commandId,
    deviceId,
    userId,
    command,
    speedPercentage,
    timestamp: now,
    expiresAt,
    status: 'PENDING',
  };

  // 1. Write to RTDB for instantaneous ESP32 pickup via Firebase RTDB stream
  try {
    const cmdRtdbRef = rtdbRef(rtdb, `devices/${deviceId}/currentCommand`);
    await rtdbSet(cmdRtdbRef, commandPayload);
  } catch (rtdbErr) {
    console.warn('RTDB command dispatch error:', rtdbErr);
  }

  // 2. Also log to Firestore commands collection for audit trail
  try {
    const cmdFsRef = doc(db, 'devices', deviceId, 'commands', commandId);
    await setDoc(cmdFsRef, commandPayload);
  } catch (fsErr) {
    console.warn('Firestore command log error:', fsErr);
  }

  // 3. If EMERGENCY_STOP, trigger safety lock on device
  if (command === 'EMERGENCY_STOP' || command === 'STOP') {
    try {
      const devDoc = doc(db, 'devices', deviceId);
      await updateDoc(devDoc, {
        motorStatus: command === 'EMERGENCY_STOP' ? 'EMERGENCY_LOCKED' : 'STOPPED',
        safetyLock: command === 'EMERGENCY_STOP',
      });
      await logSystemAlert({
        id: `alert_${now}`,
        deviceId,
        title: command === 'EMERGENCY_STOP' ? 'EMERGENCY STOP ENGAGED' : 'Rover Stopped',
        message: `Remote operator ${userId} issued ${command}.`,
        eventType: 'emergency_stop',
        severity: command === 'EMERGENCY_STOP' ? 'EMERGENCY' : 'WARNING',
        timestamp: now,
        acknowledged: false,
      });
    } catch (e) {
      console.warn('Emergency stop broadcast error:', e);
    }
  }

  return commandPayload;
}

/**
 * Fetch real historical telemetry records
 * Only returns actual data matching date range
 */
export async function fetchHistoricalTelemetry(
  deviceId: string,
  sensorType: string,
  startDateMs: number,
  endDateMs: number
): Promise<TelemetryRecord[]> {
  try {
    const telemColl = collection(db, 'devices', deviceId, 'telemetry');
    const q = query(
      telemColl,
      where('sensorType', '==', sensorType),
      where('timestamp', '>=', startDateMs),
      where('timestamp', '<=', endDateMs),
      orderBy('timestamp', 'asc'),
      limit(200)
    );

    const snap = await getDocs(q);
    const records: TelemetryRecord[] = [];
    snap.forEach((d) => {
      records.push(d.data() as TelemetryRecord);
    });
    return records;
  } catch (err) {
    console.warn('Historical telemetry query error (no records or index awaiting creation):', err);
    return [];
  }
}

/**
 * Fetch real historical GPS records
 */
export async function fetchHistoricalGPS(
  deviceId: string,
  startDateMs: number,
  endDateMs: number
): Promise<GPSRecord[]> {
  try {
    const gpsColl = collection(db, 'devices', deviceId, 'gps_records');
    const q = query(
      gpsColl,
      where('timestamp', '>=', startDateMs),
      where('timestamp', '<=', endDateMs),
      orderBy('timestamp', 'asc'),
      limit(150)
    );
    const snap = await getDocs(q);
    const records: GPSRecord[] = [];
    snap.forEach((d) => {
      records.push(d.data() as GPSRecord);
    });
    return records;
  } catch (err) {
    console.warn('GPS query error:', err);
    return [];
  }
}

/**
 * Subscribe to latest GPS location
 */
export function subscribeToLiveGPS(deviceId: string, onUpdate: (gps: GPSRecord | null) => void) {
  const liveGpsRef = rtdbRef(rtdb, `devices/${deviceId}/gps`);
  const unsub = onValue(liveGpsRef, (snap) => {
    const val = snap.val();
    if (val && typeof val.latitude === 'number' && typeof val.longitude === 'number') {
      onUpdate({
        deviceId,
        timestamp: val.timestamp || Date.now(),
        latitude: val.latitude,
        longitude: val.longitude,
        accuracy: val.accuracy || 2.5,
        speed: val.speed || 0,
        heading: val.heading || 0,
        status: 'FIX_ACQUIRED',
      });
    } else {
      onUpdate(null);
    }
  }, (err) => {
    console.warn('RTDB live GPS listener note:', err.message);
    onUpdate(null);
  });

  return () => off(liveGpsRef);
}

/**
 * Alerts & Emergency Logging
 */
export async function logSystemAlert(alert: SystemAlert) {
  try {
    const alertDoc = doc(db, 'devices', alert.deviceId, 'alerts', alert.id);
    await setDoc(alertDoc, alert);
  } catch (err) {
    console.warn('Alert log error:', err);
  }
}

export function subscribeToAlerts(deviceId: string, onUpdate: (alerts: SystemAlert[]) => void) {
  const alertsColl = collection(db, 'devices', deviceId, 'alerts');
  const q = query(alertsColl, orderBy('timestamp', 'desc'), limit(50));
  const unsub = onSnapshot(q, (snap) => {
    const list: SystemAlert[] = [];
    snap.forEach((d) => {
      list.push(d.data() as SystemAlert);
    });
    onUpdate(list);
  }, (err) => {
    console.warn('Alerts listener note:', err.message);
    onUpdate([]);
  });
  return unsub;
}

export async function acknowledgeAlert(deviceId: string, alertId: string) {
  try {
    const alertDoc = doc(db, 'devices', deviceId, 'alerts', alertId);
    await updateDoc(alertDoc, { acknowledged: true });
  } catch (err) {
    console.warn('Acknowledge alert error:', err);
  }
}

/**
 * Reset Emergency Safety Lock
 */
export async function resetEmergencyLock(deviceId: string) {
  const devDoc = doc(db, 'devices', deviceId);
  await updateDoc(devDoc, {
    safetyLock: false,
    motorStatus: 'STANDBY',
  });
}
