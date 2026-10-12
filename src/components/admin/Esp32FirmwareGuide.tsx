import React, { useState } from 'react';
import { Copy, Check, Terminal, Cpu, ShieldCheck } from 'lucide-react';

export const Esp32FirmwareGuide: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const sampleCode = `/**
 * DriveNexa Rover Platform - ESP32 Production Firmware Sketch
 * Target: ESP32 DevKit v1 / ESP32-WROOM-32
 * Dependencies: Firebase-ESP-Client, TinyGPSPlus, OneWire, DallasTemperature
 */

#include <WiFi.h>
#include <Firebase_ESP_Client.h>

#define WIFI_SSID "YOUR_WIFI_SSID"
#define WIFI_PASSWORD "YOUR_WIFI_PASSWORD"

// Firebase Configuration from DriveNexa platform
#define API_KEY "AIzaSyCNT317RYdI6JWWo8QqzHBQu80cGqUng3Q"
#define DATABASE_URL "https://drive-nexa-default-rtdb.asia-southeast1.firebasedatabase.app"

// Motor Driver Pins (L298N / TB6612FNG)
#define PIN_ENA 18
#define PIN_IN1 19
#define PIN_IN2 23
#define PIN_IN3 25
#define PIN_IN4 26
#define PIN_ENB 33

// Safety Watchdog
unsigned long lastValidCommandTime = 0;
const unsigned long COMMAND_TIMEOUT_MS = 1500; // Auto-stop if no heartbeat in 1.5s

FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

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
  ledcWrite(0, 0);
  ledcWrite(1, 0);
}

void driveForward(int speed) {
  digitalWrite(PIN_IN1, HIGH);
  digitalWrite(PIN_IN2, LOW);
  digitalWrite(PIN_IN3, HIGH);
  digitalWrite(PIN_IN4, LOW);
}

void setup() {
  Serial.begin(115200);
  setupMotors();

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(300);
    Serial.print(".");
  }
  Serial.println("\\nConnected to WiFi!");

  config.api_key = API_KEY;
  config.database_url = DATABASE_URL;
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);
}

void loop() {
  unsigned long now = millis();

  // 1. Safety Watchdog Timeout Check (Section 10)
  if (now - lastValidCommandTime > COMMAND_TIMEOUT_MS) {
    stopMotors(); // Local hardware safety: never move continuously without heartbeat
  }

  // 2. Poll / Stream Commands from Firebase RTDB
  if (Firebase.RTDB.getJSON(&fbdo, "/devices/ROVER-ESP32-01/currentCommand")) {
    FirebaseJson &json = fbdo.jsonObject();
    FirebaseJsonData cmdData;
    json.get(cmdData, "command");

    if (cmdData.success) {
      String cmd = cmdData.stringValue;
      if (cmd == "FORWARD") driveForward(180);
      else if (cmd == "STOP" || cmd == "EMERGENCY_STOP") stopMotors();
      lastValidCommandTime = now;
    }
  }

  // 3. Heartbeat & Sensor Broadcast
  static unsigned long lastHeartbeat = 0;
  if (now - lastHeartbeat > 2000) {
    lastHeartbeat = now;
    Firebase.RTDB.setInt(&fbdo, "/devices/ROVER-ESP32-01/heartbeat/lastSeen", (int)(now / 1000));
  }
}
`;

  const handleCopy = () => {
    navigator.clipboard.writeText(sampleCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Cpu className="w-5 h-5 text-cyan-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            ESP32 Reference Firmware Sketch
          </h3>
        </div>

        <button
          onClick={handleCopy}
          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-cyan-300 flex items-center gap-1.5 transition cursor-pointer"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          <span>{copied ? 'Copied' : 'Copy C++ Sketch'}</span>
        </button>
      </div>

      <p className="text-xs text-slate-400 leading-relaxed">
        Pre-configured Arduino C++ sketch incorporating the 1500ms local hardware safety watchdog, L298N motor driver logic, and direct low-latency communication with the project's Firebase RTDB instance.
      </p>

      <div className="relative">
        <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto max-h-80 scrollbar-thin">
          {sampleCode}
        </pre>
      </div>
    </div>
  );
};
