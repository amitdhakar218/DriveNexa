import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  DeviceInfo,
  SensorDefinition,
  GPSRecord,
  SystemAlert,
  RoverCommand,
  DeviceConnectionState,
} from '../types';
import { useAuth } from './AuthContext';
import {
  fetchUserDevices,
  getDeviceById,
  registerDevice,
  subscribeToDevice,
  subscribeToSensors,
  subscribeToLiveGPS,
  subscribeToAlerts,
  subscribeToCommandAck,
  sendRoverCommand as apiSendRoverCommand,
  toggleSensorState,
  registerNewSensor,
  updateCameraStreamUrl as apiUpdateCameraStreamUrl,
  acknowledgeAlert as apiAcknowledgeAlert,
  resetEmergencyLock as apiResetEmergencyLock,
} from '../services/firebaseService';

export interface CommandAckPayload {
  commandId: string;
  status: 'QUEUED' | 'PENDING' | 'ACKNOWLEDGED' | 'EXECUTING' | 'EXECUTED' | 'EXPIRED' | 'REJECTED';
  timestamp: number;
  motorStatus?: string;
  details?: string;
}

interface DeviceContextType {
  activeDeviceId: string | null;
  device: DeviceInfo | null;
  userDevices: DeviceInfo[];
  sensors: SensorDefinition[];
  liveGps: GPSRecord | null;
  alerts: SystemAlert[];
  unacknowledgedAlertsCount: number;
  loadingDevice: boolean;
  connectionState: DeviceConnectionState;
  lastHeartbeat: number | null;
  lastDataUpdate: number | null;
  lastKnownError: string | null;
  lastCommandAck: CommandAckPayload | null;
  sendCommand: (command: RoverCommand['command'], speed?: number) => Promise<RoverCommand>;
  emergencyStop: () => Promise<void>;
  resetEmergency: () => Promise<void>;
  toggleSensor: (sensorId: string, enabled: boolean) => Promise<void>;
  addNewSensor: (sensor: SensorDefinition) => Promise<void>;
  setCameraStreamUrl: (url: string) => Promise<void>;
  acknowledgeAlert: (alertId: string) => Promise<void>;
  setActiveDeviceId: (id: string | null) => void;
  claimDevice: (deviceId: string, name: string) => Promise<DeviceInfo>;
  refreshDevices: () => Promise<void>;
}

const DeviceContext = createContext<DeviceContextType | undefined>(undefined);

export const DeviceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, userProfile, addAuthorizedDevice } = useAuth();
  const [activeDeviceId, setActiveDeviceId] = useState<string | null>('NEXA-ROVER-01');
  const [userDevices, setUserDevices] = useState<DeviceInfo[]>([
    {
      deviceId: 'NEXA-ROVER-01',
      name: 'NEXA Car Rover (Amit Dhakar)',
      ownerId: 'amit_dhakar',
      authorizedUsers: ['amit_dhakar'],
      status: 'UNKNOWN',
      firmwareVersion: 'v1.0.4',
      lastSeen: null,
      lastHeartbeat: null,
      lastDataUpdate: null,
      lastError: null,
      hardwareModel: 'ESP32-S3 Robotic Rover',
      cameraStreamUrl: null,
      cameraStatus: 'NOT_CONFIGURED',
      motorStatus: 'UNKNOWN',
      safetyLock: false,
      commandTimeoutMs: 1500,
    },
  ]);
  const [device, setDevice] = useState<DeviceInfo | null>(null);
  const [sensors, setSensors] = useState<SensorDefinition[]>([]);
  const [liveGps, setLiveGps] = useState<GPSRecord | null>(null);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [loadingDevice, setLoadingDevice] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(Date.now());
  const [lastCommandAck, setLastCommandAck] = useState<CommandAckPayload | null>(null);

  // Hardware Heartbeat Watchdog timer (every 1 second)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Load authorized devices for this authenticated user
  const loadUserDevices = useCallback(async () => {
    const defaultRoverId = 'NEXA-ROVER-01';
    if (!user) {
      setActiveDeviceId(defaultRoverId);
      setLoadingDevice(false);
      return;
    }

    setLoadingDevice(true);
    try {
      const devices = await fetchUserDevices(user.uid);
      if (devices.length > 0) {
        setUserDevices(devices);
        setActiveDeviceId((prev) => {
          if (prev && devices.some((d) => d.deviceId === prev)) return prev;
          return devices[0].deviceId;
        });
      } else {
        // Fallback default vehicle for Amit's rover NEXA-ROVER-01
        setActiveDeviceId((prev) => prev || defaultRoverId);
        getDeviceById(defaultRoverId).then((dev) => {
          if (dev) {
            setUserDevices([dev]);
          }
        }).catch(() => {
          setActiveDeviceId(defaultRoverId);
        });
      }
    } catch (err) {
      console.warn('Error loading user devices:', err);
      setActiveDeviceId(defaultRoverId);
    } finally {
      setLoadingDevice(false);
    }
  }, [user]);

  useEffect(() => {
    loadUserDevices();
  }, [loadUserDevices]);

  // Real-time subscriptions for selected active device (RTDB & Firestore)
  useEffect(() => {
    if (!activeDeviceId) {
      setDevice(null);
      setSensors([]);
      setLiveGps(null);
      setAlerts([]);
      return;
    }

    const unsubDevice = subscribeToDevice(activeDeviceId, (updatedDev) => {
      setDevice(updatedDev);
      // Update in userDevices list as well
      setUserDevices((prev) =>
        prev.map((d) => (d.deviceId === updatedDev.deviceId ? updatedDev : d))
      );
    });

    const unsubSensors = subscribeToSensors(activeDeviceId, (updatedSensors) => {
      setSensors(updatedSensors);
    });

    const unsubGps = subscribeToLiveGPS(activeDeviceId, (updatedGps) => {
      setLiveGps(updatedGps);
    });

    const unsubAlerts = subscribeToAlerts(activeDeviceId, (updatedAlerts) => {
      setAlerts(updatedAlerts);
    });

    const unsubAck = subscribeToCommandAck(activeDeviceId, (ack) => {
      setLastCommandAck(ack);
    });

    return () => {
      unsubDevice();
      unsubSensors();
      unsubGps();
      unsubAlerts();
      unsubAck();
    };
  }, [activeDeviceId, user]);

  const claimDevice = useCallback(
    async (devId: string, name: string): Promise<DeviceInfo> => {
      if (!user) throw new Error('Authentication required to register device.');
      const newDev = await registerDevice(user.uid, devId, name);
      await addAuthorizedDevice(newDev.deviceId);
      setUserDevices((prev) => {
        if (prev.some((d) => d.deviceId === newDev.deviceId)) return prev;
        return [...prev, newDev];
      });
      setActiveDeviceId(newDev.deviceId);
      return newDev;
    },
    [user, addAuthorizedDevice]
  );

  const sendCommand = useCallback(
    async (command: RoverCommand['command'], speed: number = 50) => {
      if (!user) throw new Error('Authentication required to send rover commands.');
      if (!activeDeviceId) throw new Error('No vehicle selected or authorized.');
      return await apiSendRoverCommand(activeDeviceId, user.uid, command, speed);
    },
    [activeDeviceId, user]
  );

  const emergencyStop = useCallback(async () => {
    if (!user || !activeDeviceId) return;
    await apiSendRoverCommand(activeDeviceId, user.uid, 'EMERGENCY_STOP', 0);
  }, [activeDeviceId, user]);

  const resetEmergency = useCallback(async () => {
    if (!activeDeviceId) return;
    await apiResetEmergencyLock(activeDeviceId);
  }, [activeDeviceId]);

  const toggleSensor = useCallback(
    async (sensorId: string, enabled: boolean) => {
      if (!activeDeviceId) return;
      await toggleSensorState(activeDeviceId, sensorId, enabled);
    },
    [activeDeviceId]
  );

  const addNewSensor = useCallback(
    async (sensor: SensorDefinition) => {
      await registerNewSensor(sensor);
    },
    []
  );

  const setCameraStreamUrl = useCallback(
    async (url: string) => {
      if (!activeDeviceId) return;
      await apiUpdateCameraStreamUrl(activeDeviceId, url);
    },
    [activeDeviceId]
  );

  const acknowledgeAlert = useCallback(
    async (alertId: string) => {
      if (!activeDeviceId) return;
      await apiAcknowledgeAlert(activeDeviceId, alertId);
    },
    [activeDeviceId]
  );

  const unacknowledgedAlertsCount = alerts.filter((a) => !a.acknowledged).length;

  const connectionState: DeviceConnectionState = React.useMemo(() => {
    if (!activeDeviceId || !device) return 'UNKNOWN';
    if (device.lastError) return 'ERROR';

    // 100% REAL HARDWARE CHECK: No fake online!
    const lastSignal = device.lastHeartbeat || device.lastSeen || device.lastDataUpdate;
    if (!lastSignal) {
      return 'DISCONNECTED';
    }

    // Standardize epoch ms
    const lastSignalMs = (lastSignal > 1000000000 && lastSignal < 10000000000)
      ? lastSignal * 1000
      : lastSignal;

    if (lastSignalMs > 1000000000000) {
      const diffSec = (currentTime - lastSignalMs) / 1000;
      // ESP32 sends heartbeat every 3-5 seconds. If received within last 15 seconds, it is ONLINE!
      if (diffSec >= -5 && diffSec <= 15) {
        return 'CONNECTED';
      }
      return 'DISCONNECTED';
    }

    // If timestamp is not a valid epoch time, mark as DISCONNECTED
    return 'DISCONNECTED';
  }, [activeDeviceId, device, currentTime]);

  const lastHeartbeat = device?.lastHeartbeat
    ? (device.lastHeartbeat < 10000000000 ? device.lastHeartbeat * 1000 : device.lastHeartbeat)
    : device?.lastSeen
    ? (device.lastSeen < 10000000000 ? device.lastSeen * 1000 : device.lastSeen)
    : null;

  const lastDataUpdate = device?.lastDataUpdate
    ? (device.lastDataUpdate < 10000000000 ? device.lastDataUpdate * 1000 : device.lastDataUpdate)
    : lastHeartbeat;

  const lastKnownError = device?.lastError || null;

  return (
    <DeviceContext.Provider
      value={{
        activeDeviceId,
        device,
        userDevices,
        sensors,
        liveGps,
        alerts,
        unacknowledgedAlertsCount,
        loadingDevice,
        connectionState,
        lastHeartbeat,
        lastDataUpdate,
        lastKnownError,
        lastCommandAck,
        sendCommand,
        emergencyStop,
        resetEmergency,
        toggleSensor,
        addNewSensor,
        setCameraStreamUrl,
        acknowledgeAlert,
        setActiveDeviceId,
        claimDevice,
        refreshDevices: loadUserDevices,
      }}
    >
      {children}
    </DeviceContext.Provider>
  );
};

export function useDevice() {
  const ctx = useContext(DeviceContext);
  if (!ctx) {
    throw new Error('useDevice must be used within a DeviceProvider');
  }
  return ctx;
}
