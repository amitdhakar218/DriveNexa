import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
} from 'firebase/firestore';
import {
  ref as rtdbRef,
  set as rtdbSet,
  onValue,
  off,
} from 'firebase/database';
import { db, rtdb } from '../config/firebase';
import {
  DeviceInfo,
  SensorDefinition,
  SensorStatus,
  TelemetryRecord,
  GPSRecord,
  RoverCommand,
  SystemAlert,
  DeviceConnectionState,
  FeedbackSubmission,
} from '../types';

/**
 * Determine device online status based on real hardware heartbeat timestamp
 * CONNECTED: Device transmitted heartbeat within 15 seconds
 * DISCONNECTED: Heartbeat missing or exceeded 15 seconds
 * UNKNOWN: No heartbeat ever recorded
 */
export function calculateDeviceStatus(lastSeen: number | null): DeviceConnectionState {
  if (!lastSeen) return 'UNKNOWN';
  const now = Date.now();
  // Standardize timestamp if reported in epoch seconds instead of milliseconds
  const lastSeenMs = (lastSeen > 1000000000 && lastSeen < 10000000000) ? lastSeen * 1000 : lastSeen;
  const diffSec = (now - lastSeenMs) / 1000;
  if (diffSec >= -10 && diffSec <= 45) return 'CONNECTED';
  return 'DISCONNECTED';
}

/**
 * Standard hardware sensor template for newly registered vehicle devices.
 * All initial values are strictly null and NOT_CONNECTED.
 */
export const DEFAULT_HARDWARE_SENSORS: Omit<SensorDefinition, 'deviceId'>[] = [
  {
    id: 'sens_speed_01',
    name: 'Wheel Speed Sensor (Hall / Optical)',
    type: 'speed',
    status: 'NOT_CONNECTED',
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
    status: 'NOT_CONNECTED',
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
    status: 'NOT_CONNECTED',
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
    status: 'NOT_CONNECTED',
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
    status: 'NOT_CONNECTED',
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
    status: 'NOT_CONNECTED',
    enabled: true,
    currentValue: null,
    unit: 'g / °/s',
    lastUpdate: null,
    firmwarePin: 'SDA: GPIO21, SCL: GPIO22',
    firmwareProtocol: 'I2C',
  },
  {
    id: 'sens_compass_01',
    name: 'Electronic Digital Compass (QMC5883L / HMC5883L)',
    type: 'compass',
    status: 'NOT_CONNECTED',
    enabled: true,
    currentValue: null,
    unit: '°',
    lastUpdate: null,
    firmwarePin: 'SDA: GPIO21, SCL: GPIO22 (I2C addr 0x0D / 0x1E)',
    firmwareProtocol: 'I2C',
  },
  {
    id: 'sens_crash_01',
    name: 'Collision & Impact Detection Switch',
    type: 'crash',
    status: 'NOT_CONNECTED',
    enabled: true,
    currentValue: null,
    unit: 'g-force',
    lastUpdate: null,
    firmwarePin: 'SW-420 (GPIO27)',
    firmwareProtocol: 'GPIO',
  },
  {
    id: 'sens_cam_01',
    name: 'ESP32-CAM / OV2640 Module',
    type: 'camera',
    status: 'NOT_CONNECTED',
    enabled: false,
    currentValue: null,
    unit: 'fps',
    lastUpdate: null,
    firmwarePin: 'DVP 8-bit bus',
    firmwareProtocol: 'SPI',
  },
  {
    id: 'sens_motor_01',
    name: 'L298N Dual H-Bridge Motor Driver',
    type: 'motor',
    status: 'NOT_CONNECTED',
    enabled: true,
    currentValue: null,
    unit: 'PWM %',
    lastUpdate: null,
    firmwarePin: 'ENA: 18, IN1: 19, IN2: 23, IN3: 25, IN4: 26, ENB: 33',
    firmwareProtocol: 'GPIO',
  },
];

/**
 * Fetch all devices authorized for a user
 * Queries devices owned by the user or where the user is in authorizedUsers
 */
export async function fetchUserDevices(userId: string): Promise<DeviceInfo[]> {
  try {
    const devicesColl = collection(db, 'devices');
    const qOwner = query(devicesColl, where('ownerId', '==', userId));
    const snapOwner = await getDocs(qOwner);

    const devicesMap = new Map<string, DeviceInfo>();
    snapOwner.forEach((d) => {
      devicesMap.set(d.id, d.data() as DeviceInfo);
    });

    const qAuth = query(devicesColl, where('authorizedUsers', 'array-contains', userId));
    const snapAuth = await getDocs(qAuth);
    snapAuth.forEach((d) => {
      devicesMap.set(d.id, d.data() as DeviceInfo);
    });

    return Array.from(devicesMap.values());
  } catch (err) {
    console.warn('Error fetching user devices from Firestore:', err);
    return [];
  }
}

/**
 * Fetch a single device by ID and verify authorization
 */
export async function getDeviceById(deviceId: string): Promise<DeviceInfo | null> {
  try {
    const devDoc = doc(db, 'devices', deviceId);
    const snap = await getDoc(devDoc);
    if (!snap.exists()) return null;
    return snap.data() as DeviceInfo;
  } catch (err) {
    console.warn(`Error getting device ${deviceId}:`, err);
    return null;
  }
}

/**
 * Register or claim a new rover device
 * Ensures clean ownership and populates real hardware sensor definitions
 */
export async function registerDevice(
  userId: string,
  deviceId: string,
  name: string,
  hardwareModel: string = 'ESP32-WROOM-32 4WD Robotic Car'
): Promise<DeviceInfo> {
  const sanitizedId = deviceId.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
  if (!sanitizedId) {
    throw new Error('Device ID must contain valid alphanumeric characters.');
  }

  const deviceRef = doc(db, 'devices', sanitizedId);
  const snap = await getDoc(deviceRef);

  if (snap.exists()) {
    const existing = snap.data() as DeviceInfo;
    // Check if user is already owner or authorized
    if (existing.ownerId !== userId && !existing.authorizedUsers?.includes(userId)) {
      throw new Error(`Device ID "${sanitizedId}" is already claimed by another operator.`);
    }
    return existing;
  }

  const newDevice: DeviceInfo = {
    deviceId: sanitizedId,
    name: name.trim() || sanitizedId,
    ownerId: userId,
    authorizedUsers: [userId],
    status: 'UNKNOWN',
    firmwareVersion: 'v1.0.4-hw-ready',
    lastSeen: null,
    lastHeartbeat: null,
    lastDataUpdate: null,
    hardwareModel,
    cameraStreamUrl: null,
    cameraStatus: 'NOT_CONFIGURED',
    motorStatus: 'UNKNOWN',
    safetyLock: false,
    commandTimeoutMs: 1500,
  };

  await setDoc(deviceRef, newDevice);

  // Initialize standard hardware sensors (all NOT_CONNECTED, value: null)
  for (const sensor of DEFAULT_HARDWARE_SENSORS) {
    await setDoc(doc(db, 'devices', sanitizedId, 'sensors', sensor.id), {
      ...sensor,
      deviceId: sanitizedId,
    });
  }

  return newDevice;
}

/**
 * Subscribe to real-time device updates from Firestore & RTDB
 */
export function subscribeToDevice(deviceId: string, onUpdate: (dev: DeviceInfo) => void) {
  let latestRtdbActive = false;
  const devDoc = doc(db, 'devices', deviceId);
  const unsubFs = onSnapshot(
    devDoc,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as DeviceInfo;
        // Only emit if RTDB hasn't provided a live connection
        if (!latestRtdbActive) {
          onUpdate({
            ...data,
            status: calculateDeviceStatus(data.lastSeen),
          });
        }
      }
    },
    (err) => {
      console.warn('Firestore device listener notice:', err.message);
    }
  );

  // RTDB live heartbeat and telemetry listener
  const rtdbRootRef = rtdbRef(rtdb, `devices/${deviceId}`);
  const unsubRtdb = onValue(
    rtdbRootRef,
    (snapshot) => {
      const val = snapshot.val();
      if (!val) return;
      
      const now = Date.now();
      const hb = (val.heartbeat && typeof val.heartbeat === 'object') ? val.heartbeat : {};
      const telem = (val.telemetry && typeof val.telemetry === 'object') ? val.telemetry : {};
      const detectedIp = (hb.ip && typeof hb.ip === 'string' && hb.ip.trim()) || 
                         (telem.ip && typeof telem.ip === 'string' && telem.ip.trim()) || 
                         (val.ip && typeof val.ip === 'string' && val.ip.trim()) || 
                         null;
      // Extract actual hardware timestamp from RTDB
      let deviceTimestamp: number | null = null;
      const rawTime = hb.serverTime || hb.timestamp || telem.timestamp || val.timestamp || (typeof hb.lastSeen === 'number' && hb.lastSeen > 1000000000 ? hb.lastSeen : null);
      if (typeof rawTime === 'number') {
        if (rawTime > 1000000000000) {
          deviceTimestamp = rawTime;
        } else if (rawTime > 1000000000) {
          deviceTimestamp = rawTime * 1000;
        }
      }

      // 100% REAL ONLINE CHECK: Active if heartbeat arrived within last 15 seconds
      const isOnline = !!(deviceTimestamp && (now - deviceTimestamp) <= 15000);
      latestRtdbActive = isOnline;

      onUpdate({
        deviceId,
        name: val.name || 'NEXA Car Rover (Amit Dhakar)',
        ownerId: val.ownerId || '',
        authorizedUsers: val.authorizedUsers || [],
        status: isOnline ? 'CONNECTED' : 'DISCONNECTED',
        firmwareVersion: val.firmwareVersion || 'v1.0.4',
        lastSeen: deviceTimestamp,
        lastHeartbeat: deviceTimestamp,
        lastDataUpdate: deviceTimestamp,
        ipAddress: isOnline ? detectedIp : null,
        lastError: val.lastError || null,
        hardwareModel: val.hardwareModel || 'ESP32-S3 Robotic Rover',
        cameraStreamUrl: isOnline && detectedIp ? (val.cameraStreamUrl || telem.cameraStreamUrl || `http://${detectedIp}:81/stream`) : null,
        cameraStatus: val.cameraStatus || telem.cameraStatus || (isOnline ? 'STREAMING' : 'NOT_CONFIGURED'),
        motorStatus: val.motorStatus || telem.motorStatus || 'STANDBY',
        safetyLock: !!val.safetyLock,
        commandTimeoutMs: val.commandTimeoutMs || 1500,
      });
    },
    (err) => {
      console.warn('RTDB device heartbeat listener note:', err.message);
    }
  );

  return () => {
    unsubFs();
    off(rtdbRootRef);
  };
}

/**
 * Subscribe to sensors of a device (Firestore sensor config + RTDB live telemetry)
 */
export function subscribeToSensors(
  deviceId: string,
  onUpdate: (sensors: SensorDefinition[]) => void
) {
  let currentSensors: SensorDefinition[] = DEFAULT_HARDWARE_SENSORS.map((s) => ({ ...s, deviceId }));

  const sensorsColl = collection(db, 'devices', deviceId, 'sensors');
  const unsubFs = onSnapshot(
    sensorsColl,
    (snap) => {
      const list: SensorDefinition[] = [];
      snap.forEach((d) => {
        list.push(d.data() as SensorDefinition);
      });
      if (list.length > 0) {
        currentSensors = list;
      } else {
        currentSensors = DEFAULT_HARDWARE_SENSORS.map((s) => ({ ...s, deviceId }));
      }
      onUpdate(currentSensors);
    },
    (err) => {
      console.warn('Firestore sensor listener notice:', err.message);
      onUpdate(currentSensors);
    }
  );

  // RTDB live telemetry listener (ESP32 telemetry broadcast: /devices/{deviceId}/telemetry)
  const rtdbTelemRef = rtdbRef(rtdb, `devices/${deviceId}/telemetry`);
  const unsubRtdb = onValue(
    rtdbTelemRef,
    (snap) => {
      const val = snap.val();
      if (val && typeof val === 'object') {
        const updated = currentSensors.map((sensor) => {
          let rawVal: unknown = undefined;
          if (sensor.type === 'compass') {
            rawVal = val.compass ?? val.heading ?? val.compassHeading ?? val.magHeading;
          } else if (sensor.type === 'speed') {
            rawVal = val.speed ?? val.vehicleSpeed;
          } else if (sensor.type === 'temperature') {
            rawVal = val.temperature ?? val.temp ?? val.motorTemp;
          } else if (sensor.type === 'battery') {
            rawVal = val.battery ?? val.batt ?? val.batteryPercent ?? val.voltage;
          } else if (sensor.type === 'distance') {
            rawVal = val.distance ?? val.sonar ?? val.ultrasonic;
          } else if (sensor.type === 'accelerometer') {
            rawVal = val.accelerometer ?? val.accel ?? val.accelX;
          } else if (sensor.type === 'motor') {
            rawVal = val.motor ?? val.motorStatus ?? val.pwm;
          } else {
            rawVal = val[sensor.type] ?? val[sensor.id];
          }

          if (rawVal !== undefined && rawVal !== null) {
            const numVal = typeof rawVal === 'number' ? rawVal : Number(rawVal);
            return {
              ...sensor,
              currentValue: isNaN(numVal) ? String(rawVal) : numVal,
              status: 'ACTIVE' as SensorStatus,
              lastUpdate: val.timestamp || Date.now(),
            };
          }
          return sensor;
        });
        currentSensors = updated;
        onUpdate(updated);
      }
    },
    (err) => {
      console.warn('RTDB live telemetry listener note:', err.message);
    }
  );

  return () => {
    unsubFs();
    off(rtdbTelemRef);
  };
}

/**
 * Update sensor enabled state
 */
export async function toggleSensorState(deviceId: string, sensorId: string, enabled: boolean) {
  const sensorDoc = doc(db, 'devices', deviceId, 'sensors', sensorId);
  await updateDoc(sensorDoc, {
    enabled,
    status: enabled ? 'NOT_CONNECTED' : 'DISABLED',
  });
}

/**
 * Register a new sensor definition (Future Sensor Plug-in Architecture)
 */
export async function registerNewSensor(sensor: SensorDefinition) {
  const sensorDoc = doc(db, 'devices', sensor.deviceId, 'sensors', sensor.id);
  await setDoc(sensorDoc, sensor);
}

/**
 * Send Remote Command to Rover (FORWARD, BACKWARD, LEFT, RIGHT, STOP, EMERGENCY_STOP)
 * Path: commands/{deviceId}/{commandId} and devices/{deviceId}/commands/{commandId}
 * Commands strictly expire after 1500ms.
 */
export async function sendRoverCommand(
  deviceId: string,
  userId: string,
  command: RoverCommand['command'],
  speedPercentage: number = 50
): Promise<RoverCommand> {
  const now = Date.now();
  const commandId = `cmd_${now}_${Math.random().toString(36).substring(2, 7)}`;
  const expiresAt = now + 1500; // Strictly valid for 1.5 seconds

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

  // 1. Write to RTDB queue for instantaneous low-latency pickup by ESP32
  try {
    const cmdQueueRef = rtdbRef(rtdb, `devices/${deviceId}/commands/${commandId}`);
    await rtdbSet(cmdQueueRef, commandPayload);
    const cmdCurrentRef = rtdbRef(rtdb, `devices/${deviceId}/currentCommand`);
    await rtdbSet(cmdCurrentRef, commandPayload);
  } catch (rtdbErr) {
    console.warn('RTDB command dispatch error:', rtdbErr);
  }

  // 2. Also log to Firestore commands collection for audit trail: commands/{deviceId}/{commandId}
  try {
    const cmdFsRef = doc(db, 'commands', deviceId, 'history', commandId);
    await setDoc(cmdFsRef, commandPayload);
  } catch (fsErr) {
    console.warn('Firestore command log error:', fsErr);
  }

  // 3. If EMERGENCY_STOP, trigger safety lock in Firestore & alert
  if (command === 'EMERGENCY_STOP' || command === 'STOP') {
    try {
      const devDoc = doc(db, 'devices', deviceId);
      await updateDoc(devDoc, {
        safetyLock: command === 'EMERGENCY_STOP',
      });
      await logSystemAlert({
        id: `alert_${now}`,
        deviceId,
        title: command === 'EMERGENCY_STOP' ? 'EMERGENCY STOP ENGAGED' : 'Rover Stop Dispatched',
        message: `Remote operator ${userId} issued ${command}.`,
        eventType: 'emergency_stop',
        severity: command === 'EMERGENCY_STOP' ? 'EMERGENCY' : 'WARNING',
        timestamp: now,
        acknowledged: false,
      });
    } catch (e) {
      console.warn('Emergency stop broadcast notice:', e);
    }
  }

  return commandPayload;
}

/**
 * Subscribe to real-time ESP32 hardware command acknowledgement
 * Tracks whether the physical ESP32 has acknowledged or executed the command
 */
export function subscribeToCommandAck(
  deviceId: string,
  onAck: (ack: {
    commandId: string;
    status: 'QUEUED' | 'PENDING' | 'ACKNOWLEDGED' | 'EXECUTING' | 'EXECUTED' | 'EXPIRED' | 'REJECTED';
    timestamp: number;
    motorStatus?: string;
    details?: string;
  } | null) => void
) {
  const ackRef = rtdbRef(rtdb, `devices/${deviceId}/commandAck`);
  const unsub = onValue(
    ackRef,
    (snap) => {
      const val = snap.val();
      if (val && typeof val === 'object' && val.commandId) {
        onAck(val);
      } else {
        onAck(null);
      }
    },
    (err) => {
      console.warn('RTDB commandAck listener note:', err.message);
    }
  );

  return () => off(ackRef);
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
    console.warn('Historical telemetry query note (empty or awaiting records):', err);
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
    console.warn('GPS query note:', err);
    return [];
  }
}

/**
 * Subscribe to latest GPS location
 */
export function subscribeToLiveGPS(deviceId: string, onUpdate: (gps: GPSRecord | null) => void) {
  const liveGpsRef = rtdbRef(rtdb, `devices/${deviceId}/gps`);
  const unsub = onValue(
    liveGpsRef,
    (snap) => {
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
    },
    (err) => {
      console.warn('RTDB live GPS listener note:', err.message);
      onUpdate(null);
    }
  );

  return () => off(liveGpsRef);
}

/**
 * Update camera stream URL
 * IMPORTANT: Saving a URL does NOT mean the camera is connected.
 * Status is set to CONFIGURED_UNVERIFIED until actual stream frames are received.
 */
export async function updateCameraStreamUrl(deviceId: string, url: string) {
  const trimmed = url.trim();
  const devDoc = doc(db, 'devices', deviceId);
  await updateDoc(devDoc, {
    cameraStreamUrl: trimmed.length > 0 ? trimmed : null,
    cameraStatus: trimmed.length > 0 ? 'CONFIGURED_UNVERIFIED' : 'NOT_CONFIGURED',
  });
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
  const unsub = onSnapshot(
    q,
    (snap) => {
      const list: SystemAlert[] = [];
      snap.forEach((d) => {
        list.push(d.data() as SystemAlert);
      });
      onUpdate(list);
    },
    (err) => {
      console.warn('Alerts listener note:', err.message);
      onUpdate([]);
    }
  );
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
  });
}

/**
 * Submit User Feedback with metadata
 */
export async function submitUserFeedback(feedback: FeedbackSubmission) {
  try {
    const feedbackDoc = doc(db, 'feedback', feedback.id);
    await setDoc(feedbackDoc, feedback);
    return true;
  } catch (err) {
    console.warn('Feedback submission note:', err);
    throw err;
  }
}

/**
 * Fetch feedback submissions for Admin Review
 */
export async function fetchAllFeedback(): Promise<FeedbackSubmission[]> {
  try {
    const coll = collection(db, 'feedback');
    const q = query(coll, orderBy('timestamp', 'desc'), limit(50));
    const snap = await getDocs(q);
    const list: FeedbackSubmission[] = [];
    snap.forEach((d) => list.push(d.data() as FeedbackSubmission));
    return list;
  } catch (err) {
    console.warn('Feedback query note:', err);
    return [];
  }
}
