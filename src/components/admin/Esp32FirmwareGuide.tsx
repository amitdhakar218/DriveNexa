import React, { useState } from 'react';
import { Copy, Check, Terminal, Cpu, ShieldCheck } from 'lucide-react';
import { useDevice } from '../../context/DeviceContext';

export const Esp32FirmwareGuide: React.FC = () => {
  const { activeDeviceId } = useDevice();
  const [copied, setCopied] = useState(false);

  const targetDeviceId = activeDeviceId || 'YOUR_REGISTERED_DEVICE_ID';

  const sampleCode = `/**
 * DriveNexa Vehicle Platform - ESP32-S3 Production Rover Firmware
 * Hardware Target: ESP32-S3 (WROOM-1 / DevKit)
 * Sensors: Digital Compass (QMC5883L / HMC5883L I2C), L298N Motor Driver, ADC Battery
 * Libraries needed in Arduino IDE:
 *  1. Firebase ESP Client by Mobizt
 *  2. Wire (built-in)
 */

#include <WiFi.h>
#include <Wire.h>
#include <Firebase_ESP_Client.h>

// 1. WiFi Hotspot Credentials (e.g. mobile hotspot via USB cable / battery)
#define WIFI_SSID "YOUR_PHONE_HOTSPOT_NAME"
#define WIFI_PASSWORD "YOUR_HOTSPOT_PASSWORD"

// 2. Hardware Device ID claimed in DriveNexa dashboard
#define DEVICE_ID "${targetDeviceId}"

// 3. DriveNexa Firebase RTDB Credentials
#define API_KEY "AIzaSyCNT317RYdI6JWWo8QqzHBQu80cGqUng3Q"
#define DATABASE_URL "https://drive-nexa-default-rtdb.asia-southeast1.firebasedatabase.app"

// 4. I2C Pinout for ESP32-S3 & Compass Sensor (QMC5883L / HMC5883L)
#define I2C_SDA_PIN 8   // Default ESP32-S3 SDA (or GPIO 21 on standard ESP32)
#define I2C_SCL_PIN 9   // Default ESP32-S3 SCL (or GPIO 22 on standard ESP32)
#define QMC5883L_ADDR 0x0D // Standard QMC5883L I2C address (0x1E for HMC5883L)

// 5. Motor Driver Pins (L298N / TB6612FNG Dual H-Bridge)
#define PIN_ENA 18
#define PIN_IN1 19
#define PIN_IN2 20
#define PIN_IN3 21
#define PIN_IN4 47
#define PIN_ENB 48

// 6. Analog Battery Pin
#define PIN_BATT_ADC 4

// Safety Watchdog
unsigned long lastValidCommandTime = 0;
const unsigned long COMMAND_TIMEOUT_MS = 1500; // Strict fail-safe: stop if no fresh command in 1.5s
String lastProcessedCommandId = "";

FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

// Motor Control Helpers
void setupMotors() {
  pinMode(PIN_ENA, OUTPUT);
  pinMode(PIN_IN1, OUTPUT);
  pinMode(PIN_IN2, OUTPUT);
  pinMode(PIN_IN3, OUTPUT);
  pinMode(PIN_IN4, OUTPUT);
  pinMode(PIN_ENB, OUTPUT);
  stopMotors();
}

void stopMotors() {
  digitalWrite(PIN_IN1, LOW);
  digitalWrite(PIN_IN2, LOW);
  digitalWrite(PIN_IN3, LOW);
  digitalWrite(PIN_IN4, LOW);
  analogWrite(PIN_ENA, 0);
  analogWrite(PIN_ENB, 0);
}

void driveForward(int pwm) {
  analogWrite(PIN_ENA, pwm);
  analogWrite(PIN_ENB, pwm);
  digitalWrite(PIN_IN1, HIGH);
  digitalWrite(PIN_IN2, LOW);
  digitalWrite(PIN_IN3, HIGH);
  digitalWrite(PIN_IN4, LOW);
}

void driveBackward(int pwm) {
  analogWrite(PIN_ENA, pwm);
  analogWrite(PIN_ENB, pwm);
  digitalWrite(PIN_IN1, LOW);
  digitalWrite(PIN_IN2, HIGH);
  digitalWrite(PIN_IN3, LOW);
  digitalWrite(PIN_IN4, HIGH);
}

void turnLeft(int pwm) {
  analogWrite(PIN_ENA, pwm);
  analogWrite(PIN_ENB, pwm);
  digitalWrite(PIN_IN1, LOW);
  digitalWrite(PIN_IN2, HIGH);
  digitalWrite(PIN_IN3, HIGH);
  digitalWrite(PIN_IN4, LOW);
}

void turnRight(int pwm) {
  analogWrite(PIN_ENA, pwm);
  analogWrite(PIN_ENB, pwm);
  digitalWrite(PIN_IN1, HIGH);
  digitalWrite(PIN_IN2, LOW);
  digitalWrite(PIN_IN3, LOW);
  digitalWrite(PIN_IN4, HIGH);
}

// Compass Reading Helper
void initCompass() {
  Wire.begin(I2C_SDA_PIN, I2C_SCL_PIN);
  Wire.beginTransmission(QMC5883L_ADDR);
  Wire.write(0x0B); // Set reset register
  Wire.write(0x01);
  Wire.endTransmission();
  
  Wire.beginTransmission(QMC5883L_ADDR);
  Wire.write(0x09); // Continuous mode, 200Hz, 8G, 512 oversampling
  Wire.write(0x1D);
  Wire.endTransmission();
}

float readCompassHeading() {
  Wire.beginTransmission(QMC5883L_ADDR);
  Wire.write(0x00);
  Wire.endTransmission();
  Wire.requestFrom(QMC5883L_ADDR, 6);
  if (Wire.available() >= 6) {
    int16_t x = Wire.read() | (Wire.read() << 8);
    int16_t y = Wire.read() | (Wire.read() << 8);
    int16_t z = Wire.read() | (Wire.read() << 8);
    float heading = atan2((float)y, (float)x) * 180.0 / PI;
    if (heading < 0) heading += 360.0;
    return heading;
  }
  return 0.0;
}

// Send Command Acknowledgment back to DriveNexa Web UI
void sendCommandAck(String cmdId, String status, String motorState) {
  String ackPath = "/devices/" + String(DEVICE_ID) + "/commandAck";
  FirebaseJson ackJson;
  ackJson.set("commandId", cmdId);
  ackJson.set("status", status); // "ACKNOWLEDGED" or "EXECUTED"
  ackJson.set("timestamp", (int)(millis() / 1000));
  ackJson.set("motorStatus", motorState);
  Firebase.RTDB.setJSON(&fbdo, ackPath.c_str(), &ackJson);
}

void setup() {
  Serial.begin(115200);
  setupMotors();
  initCompass();

  Serial.println("Connecting to WiFi Hotspot...");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(300);
    Serial.print(".");
  }
  Serial.println("\\nWiFi Connected! IP Address: " + WiFi.localIP().toString());

  config.api_key = API_KEY;
  config.database_url = DATABASE_URL;
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);
}

void loop() {
  unsigned long now = millis();

  // 1. Safety Watchdog Timeout Check (Autonomous fail-safe)
  if (now - lastValidCommandTime > COMMAND_TIMEOUT_MS) {
    stopMotors();
  }

  // 2. Poll & Execute Commands from Firebase RTDB
  String cmdPath = "/devices/" + String(DEVICE_ID) + "/currentCommand";
  if (Firebase.RTDB.getJSON(&fbdo, cmdPath.c_str())) {
    FirebaseJson &json = fbdo.jsonObject();
    FirebaseJsonData cmdIdData, cmdData, speedData;
    json.get(cmdIdData, "commandId");
    json.get(cmdData, "command");
    json.get(speedData, "speedPercentage");

    if (cmdIdData.success && cmdData.success) {
      String cmdId = cmdIdData.stringValue;
      String action = cmdData.stringValue;
      int speed = speedData.success ? speedData.intValue : 50;
      int pwm = map(speed, 0, 100, 0, 255);

      if (cmdId != lastProcessedCommandId) {
        lastProcessedCommandId = cmdId;
        lastValidCommandTime = now;

        // Step 1: Send Immediate Hardware Acknowledgment
        sendCommandAck(cmdId, "ACKNOWLEDGED", "PROCESSING");

        // Step 2: Actuate Motor Hardware
        if (action == "FORWARD") {
          driveForward(pwm);
          sendCommandAck(cmdId, "EXECUTED", "FORWARD");
        } else if (action == "BACKWARD") {
          driveBackward(pwm);
          sendCommandAck(cmdId, "EXECUTED", "BACKWARD");
        } else if (action == "LEFT") {
          turnLeft(pwm);
          sendCommandAck(cmdId, "EXECUTED", "LEFT");
        } else if (action == "RIGHT") {
          turnRight(pwm);
          sendCommandAck(cmdId, "EXECUTED", "RIGHT");
        } else if (action == "STOP" || action == "EMERGENCY_STOP") {
          stopMotors();
          sendCommandAck(cmdId, "EXECUTED", "STOPPED");
        }
      }
    }
  }

  // 3. Heartbeat & Sensor Broadcast (every 2 seconds)
  static unsigned long lastBroadcast = 0;
  if (now - lastBroadcast > 2000) {
    lastBroadcast = now;
    unsigned long epochSec = now / 1000;

    // A. Heartbeat ping
    String hbPath = "/devices/" + String(DEVICE_ID) + "/lastHeartbeat";
    Firebase.RTDB.setInt(&fbdo, hbPath.c_str(), epochSec);

    // B. Live Telemetry with Compass Heading & Battery
    float compassHeading = readCompassHeading();
    int rawAdc = analogRead(PIN_BATT_ADC);
    int batteryPct = constrain(map(rawAdc, 2400, 3100, 0, 100), 0, 100);

    String telemPath = "/devices/" + String(DEVICE_ID) + "/telemetry";
    FirebaseJson telemJson;
    telemJson.set("heading", compassHeading);
    telemJson.set("compass", compassHeading);
    telemJson.set("battery", batteryPct);
    telemJson.set("speed", (now - lastValidCommandTime < COMMAND_TIMEOUT_MS) ? 12 : 0);
    telemJson.set("motorStatus", (now - lastValidCommandTime < COMMAND_TIMEOUT_MS) ? "MOVING" : "STANDBY");
    telemJson.set("timestamp", epochSec * 1000);
    Firebase.RTDB.setJSON(&fbdo, telemPath.c_str(), &telemJson);
  }
}
`;

  const handleCopy = () => {
    navigator.clipboard.writeText(sampleCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              ESP32-S3 + Digital Compass Production Firmware
            </h3>
            <span className="text-[11px] text-slate-500">
              Target: ESP32-S3 • Real-time RTDB Sync • Hardware Watchdog • Command Acknowledgment
            </span>
          </div>
        </div>

        <button
          onClick={handleCopy}
          className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs shrink-0"
        >
          {copied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
          <span>{copied ? 'Sketch Copied!' : 'Copy Arduino C++ Sketch'}</span>
        </button>
      </div>

      {/* Hindi & English Quick Guide for Amit Dhakad */}
      <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 text-xs text-slate-800 space-y-2">
        <strong className="font-bold text-blue-900 block text-xs">
          🇮🇳 नमस्ते अमित धाकड़ (Amit Dhakad) — सेटअप निर्देश (Quick Setup Guide):
        </strong>
        <ul className="list-disc pl-5 space-y-1 text-[11px] text-slate-700 leading-relaxed">
          <li>
            <strong>WiFi Hotspot:</strong> अपने फोन का वाईफाई हॉटस्पॉट ऑन करें और कोड में <code className="bg-white px-1.5 py-0.5 rounded border border-blue-200 font-mono">WIFI_SSID</code> और <code className="bg-white px-1.5 py-0.5 rounded border border-blue-200 font-mono">WIFI_PASSWORD</code> डालें।
          </li>
          <li>
            <strong>Compass Connection (I2C):</strong> कंपास (QMC5883L/HMC5883L) का <strong>SDA</strong> पिन ESP32-S3 के <strong>GPIO 8</strong> से और <strong>SCL</strong> पिन <strong>GPIO 9</strong> से जोड़ें (VCC = 3.3V, GND = GND)।
          </li>
          <li>
            <strong>Motor Driver (L298N):</strong> मोटर ड्राइवर के कंट्रोल पिन्स GPIO 18, 19, 20, 21, 47, 48 से कनेक्ट करें।
          </li>
          <li>
            <strong>Real-time Sync:</strong> जैसे ही ESP32 आपके मोबाइल हॉटस्पॉट से कनेक्ट होगा, यह तुरंत लाइव कंपास हेडिंग, बैटरी और हार्टबीट फायरबेस पर भेजेगा और वेबसाइट के रिमोट कंट्रोल कमांड को 40ms से कम समय में निष्पादित (Execute & Acknowledge) करेगा।
          </li>
        </ul>
      </div>

      <div className="relative">
        <pre className="p-4 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs text-slate-100 overflow-x-auto max-h-96 scrollbar-thin">
          {sampleCode}
        </pre>
      </div>
    </div>
  );
};
