import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  DeviceInfo,
  SensorDefinition,
  GPSRecord,
  SystemAlert,
  RoverCommand,
} from '../types';
import { useAuth } from './AuthContext';
import {
  initializePrimaryDevice,
  subscribeToDevice,
  subscribeToSensors,
  subscribeToLiveGPS,
  subscribeToAlerts,
  sendRoverCommand as apiSendRoverCommand,
  toggleSensorState,
  registerNewSensor,
  acknowledgeAlert as apiAcknowledgeAlert,
  resetEmergencyLock as apiResetEmergencyLock,
} from '../services/firebaseService';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

interface DeviceContextType {
  activeDeviceId: string;
  device: DeviceInfo | null;
  sensors: SensorDefinition[];
  liveGps: GPSRecord | null;
  alerts: SystemAlert[];
  unacknowledgedAlertsCount: number;
  loadingDevice: boolean;
  sendCommand: (command: RoverCommand['command'], speed?: number) => Promise<RoverCommand>;
  emergencyStop: () => Promise<void>;
  resetEmergency: () => Promise<void>;
  toggleSensor: (sensorId: string, enabled: boolean) => Promise<void>;
  addNewSensor: (sensor: SensorDefinition) => Promise<void>;
  setCameraStreamUrl: (url: string) => Promise<void>;
  acknowledgeAlert: (alertId: string) => Promise<void>;
  setActiveDeviceId: (id: string) => void;
}

const DeviceContext = createContext<DeviceContextType | undefined>(undefined);

export const DeviceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, userProfile } = useAuth();
  const [activeDeviceId, setActiveDeviceId] = useState<string>('ROVER-ESP32-01');
  const [device, setDevice] = useState<DeviceInfo | null>(null);
  const [sensors, setSensors] = useState<SensorDefinition[]>([]);
  const [liveGps, setLiveGps] = useState<GPSRecord | null>(null);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [loadingDevice, setLoadingDevice] = useState<boolean>(true);

  // Initialize and load device
  useEffect(() => {
    let isMounted = true;
    if (!user) {
      setDevice(null);
      setSensors([]);
      setLiveGps(null);
      setAlerts([]);
      setLoadingDevice(false);
      return;
    }

    const init = async () => {
      setLoadingDevice(true);
      const dev = await initializePrimaryDevice(user.uid);
      if (isMounted) {
        setDevice(dev);
        setLoadingDevice(false);
      }
    };

    init();

    return () => {
      isMounted = false;
    };
  }, [user, activeDeviceId]);

  // Real-time subscriptions
  useEffect(() => {
    if (!activeDeviceId || !user) return;

    const unsubDevice = subscribeToDevice(activeDeviceId, (updatedDev) => {
      setDevice(updatedDev);
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

  const sendCommand = useCallback(
    async (command: RoverCommand['command'], speed: number = 50) => {
      if (!user) throw new Error('Authentication required to send rover commands.');
      return await apiSendRoverCommand(activeDeviceId, user.uid, command, speed);
    },
    [activeDeviceId, user]
  );

  const emergencyStop = useCallback(async () => {
    if (!user) return;
    await apiSendRoverCommand(activeDeviceId, user.uid, 'EMERGENCY_STOP', 0);
  }, [activeDeviceId, user]);

  const resetEmergency = useCallback(async () => {
    await apiResetEmergencyLock(activeDeviceId);
  }, [activeDeviceId]);

  const toggleSensor = useCallback(
    async (sensorId: string, enabled: boolean) => {
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
      const devDoc = doc(db, 'devices', activeDeviceId);
      await updateDoc(devDoc, {
        cameraStreamUrl: url,
        cameraStatus: url.trim().length > 0 ? 'CONNECTED' : 'NOT CONNECTED',
      });
    },
    [activeDeviceId]
  );

  const acknowledgeAlert = useCallback(
    async (alertId: string) => {
      await apiAcknowledgeAlert(activeDeviceId, alertId);
    },
    [activeDeviceId]
  );

  const unacknowledgedAlertsCount = alerts.filter((a) => !a.acknowledged).length;

  return (
    <DeviceContext.Provider
      value={{
        activeDeviceId,
        device,
        sensors,
        liveGps,
        alerts,
        unacknowledgedAlertsCount,
        loadingDevice,
        sendCommand,
        emergencyStop,
        resetEmergency,
        toggleSensor,
        addNewSensor,
        setCameraStreamUrl,
        acknowledgeAlert,
        setActiveDeviceId,
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
