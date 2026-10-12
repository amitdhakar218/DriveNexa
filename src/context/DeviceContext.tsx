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
  sendRoverCommand as apiSendRoverCommand,
  toggleSensorState,
  registerNewSensor,
  updateCameraStreamUrl as apiUpdateCameraStreamUrl,
  acknowledgeAlert as apiAcknowledgeAlert,
  resetEmergencyLock as apiResetEmergencyLock,
} from '../services/firebaseService';

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
  const [activeDeviceId, setActiveDeviceId] = useState<string | null>(null);
  const [userDevices, setUserDevices] = useState<DeviceInfo[]>([]);
  const [device, setDevice] = useState<DeviceInfo | null>(null);
  const [sensors, setSensors] = useState<SensorDefinition[]>([]);
  const [liveGps, setLiveGps] = useState<GPSRecord | null>(null);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [loadingDevice, setLoadingDevice] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<number>(Date.now());

  // Hardware Heartbeat Watchdog timer (every 1 second)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Load authorized devices for this authenticated user
  const loadUserDevices = useCallback(async () => {
    if (!user) {
      setUserDevices([]);
      setActiveDeviceId(null);
      setDevice(null);
      setLoadingDevice(false);
      return;
    }

    setLoadingDevice(true);
    try {
      const devices = await fetchUserDevices(user.uid);
      setUserDevices(devices);

      if (devices.length > 0) {
        // If current active device is valid, keep it; else select first authorized
        setActiveDeviceId((prev) => {
          if (prev && devices.some((d) => d.deviceId === prev)) return prev;
          return devices[0].deviceId;
        });
      } else {
        // If user profile has authorized device list, attempt direct fetch
        const authList = userProfile?.authorizedDevices || [];
        if (authList.length > 0) {
          const directDev = await getDeviceById(authList[0]);
          if (directDev) {
            setUserDevices([directDev]);
            setActiveDeviceId(directDev.deviceId);
          } else {
            setActiveDeviceId(null);
            setDevice(null);
          }
        } else {
          setActiveDeviceId(null);
          setDevice(null);
        }
      }
    } catch (err) {
      console.warn('Error loading user devices:', err);
    } finally {
      setLoadingDevice(false);
    }
  }, [user, userProfile]);

  useEffect(() => {
    loadUserDevices();
  }, [loadUserDevices]);

  // Real-time subscriptions for selected active device
  useEffect(() => {
    if (!activeDeviceId || !user) {
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

    return () => {
      unsubDevice();
      unsubSensors();
      unsubGps();
      unsubAlerts();
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

    const lastSignal = device.lastHeartbeat || device.lastSeen || device.lastDataUpdate;
    if (!lastSignal) return 'UNKNOWN';

    // Normalize seconds timestamp if needed
    const lastSignalMs = lastSignal < 10000000000 ? lastSignal * 1000 : lastSignal;
    const diffSec = (currentTime - lastSignalMs) / 1000;

    if (diffSec >= 0 && diffSec <= 15) return 'CONNECTED';
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
