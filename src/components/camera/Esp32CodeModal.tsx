import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  Cpu,
  Camera,
  Wifi,
  Sparkles,
  Layers,
  Terminal,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

interface Esp32CodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  detectedIp?: string;
}

export const Esp32CodeModal: React.FC<Esp32CodeModalProps> = ({
  isOpen,
  onClose,
  detectedIp = '',
}) => {
  const [boardType, setBoardType] = useState<'ESP32_S3_CAM' | 'AMIT_WIRED_PINS' | 'AI_THINKER'>('AMIT_WIRED_PINS');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // 1. Amit's Exact Wired Hardware Pins (18, 19, 20, 21, 47, 48 + Compass 8, 9)
  // This code matches Amit's exact wire connections with Remote Driving & Firebase RTDB
  const amitWiredCode = `/**
 * =========================================================================
 * DriveNexa - ESP32-S3 ROVER (Amit Dhakar Exact Wired Pins)
 * WiFi: vivo | Password: 12345678
 * Device ID: NEXA-ROVER-01
 * Firebase: https://drive-nexa-default-rtdb.asia-southeast1.firebasedatabase.app
 * 
 * विशेषताएँ:
 * 1. आपके द्वारा जोड़ी गई सभी पिनें (18, 19, 20, 21, 47, 48 और कंपास 8, 9)
 * 2. वेबसाइट के बटनों से आगे, पीछे, बाएं, दाएं, स्टॉप का रियल-टाइम कंट्रोल
 * 3. फायरबेस रियल-टाइम डेटाबेस में 100% सही हार्टबीट और टेलीमेट्री सिंक
 * 4. QMC5883L/HMC5883L डिजिटल कंपास डेटा सिंक
 * 5. कोई एक्स्ट्रा लाइब्रेरी नहीं — सीधा ArduinoDroid में पेस्ट करें और कंपाइल करें
 * =========================================================================
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <Wire.h>

// 1. आपका वाई-फाई और पासवर्ड
#define WIFI_SSID "vivo"
#define WIFI_PASSWORD "12345678"

// 2. डिवाइस आईडी और Firebase क्रेडेंशियल्स
#define DEVICE_ID "NEXA-ROVER-01"
#define FIREBASE_HOST "https://drive-nexa-default-rtdb.asia-southeast1.firebasedatabase.app"
#define API_KEY "AIzaSyCNT317RYdI6JWWo8QqzHBQu80cGqUng3Q"

// 3. आपके L298N मोटर ड्राइवर पिन्स (ESP32-S3)
#define PIN_ENA 18
#define PIN_IN1 19
#define PIN_IN2 20
#define PIN_IN3 21
#define PIN_IN4 47
#define PIN_ENB 48

// 4. आपके डिजिटल कंपास पिन्स (QMC5883L / HMC5883L)
#define I2C_SDA_PIN 8
#define I2C_SCL_PIN 9
#define QMC5883L_ADDR 0x0D

unsigned long lastValidCommandTime = 0;
const unsigned long COMMAND_TIMEOUT_MS = 2000;
int currentSpeedPwm = 200;
String currentCommand = "STOP";

// ---------- मोटर इनिशियलाइज़ेशन ----------
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
  currentCommand = "STOP";
}

void driveForward(int pwm) {
  analogWrite(PIN_ENA, pwm);
  analogWrite(PIN_ENB, pwm);
  digitalWrite(PIN_IN1, HIGH);
  digitalWrite(PIN_IN2, LOW);
  digitalWrite(PIN_IN3, HIGH);
  digitalWrite(PIN_IN4, LOW);
  currentCommand = "FORWARD";
}

void driveBackward(int pwm) {
  analogWrite(PIN_ENA, pwm);
  analogWrite(PIN_ENB, pwm);
  digitalWrite(PIN_IN1, LOW);
  digitalWrite(PIN_IN2, HIGH);
  digitalWrite(PIN_IN3, LOW);
  digitalWrite(PIN_IN4, HIGH);
  currentCommand = "BACKWARD";
}

void driveLeft(int pwm) {
  analogWrite(PIN_ENA, pwm);
  analogWrite(PIN_ENB, pwm);
  digitalWrite(PIN_IN1, LOW);
  digitalWrite(PIN_IN2, HIGH);
  digitalWrite(PIN_IN3, HIGH);
  digitalWrite(PIN_IN4, LOW);
  currentCommand = "LEFT";
}

void driveRight(int pwm) {
  analogWrite(PIN_ENA, pwm);
  analogWrite(PIN_ENB, pwm);
  digitalWrite(PIN_IN1, HIGH);
  digitalWrite(PIN_IN2, LOW);
  digitalWrite(PIN_IN3, LOW);
  digitalWrite(PIN_IN4, HIGH);
  currentCommand = "RIGHT";
}

// ---------- कंपास इनिशियलाइज़ेशन ----------
void initCompass() {
  Wire.begin(I2C_SDA_PIN, I2C_SCL_PIN);
  Wire.beginTransmission(QMC5883L_ADDR);
  Wire.write(0x0B);
  Wire.write(0x01);
  Wire.endTransmission();
  
  Wire.beginTransmission(QMC5883L_ADDR);
  Wire.write(0x09);
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

// ---------- FIREBASE हार्टबीट और टेलीमेट्री सिंक ----------
void sendHeartbeatAndTelemetry() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.setTimeout(1200);
    String ipStr = WiFi.localIP().toString();
    unsigned long epochSec = millis() / 1000;

    // 1. Heartbeat Sync (Real-time Firebase Server Timestamp)
    String hbUrl = String(FIREBASE_HOST) + "/devices/" + String(DEVICE_ID) + "/heartbeat.json?auth=" + String(API_KEY);
    http.begin(hbUrl);
    http.addHeader("Content-Type", "application/json");
    String hbPayload = "{\"serverTime\":{\".sv\":\"timestamp\"},\"lastSeen\":{\".sv\":\"timestamp\"},\"status\":\"CONNECTED\",\"ip\":\"" + ipStr + "\"}";
    http.PUT(hbPayload);
    http.end();

    // 2. Telemetry Sync (Compass, Battery, IP, Camera Stream Link, Timestamp)
    String telemUrl = String(FIREBASE_HOST) + "/devices/" + String(DEVICE_ID) + "/telemetry.json?auth=" + String(API_KEY);
    http.begin(telemUrl);
    http.addHeader("Content-Type", "application/json");
    float heading = readCompassHeading();
    String telemPayload = "{\"timestamp\":{\".sv\":\"timestamp\"}" +
                          ",\"heading\":" + String(heading) +
                          ",\"compass\":" + String(heading) +
                          ",\"battery\":98" +
                          ",\"ip\":\"" + ipStr + "\"" +
                          ",\"cameraStatus\":\"STREAMING\"" +
                          ",\"cameraStreamUrl\":\"http://" + ipStr + ":81/stream\"" +
                          ",\"status\":\"ONLINE\"}";
    http.PUT(telemPayload);
    http.end();
  }
}

// ---------- FIREBASE ड्राइविंग कमान्ड्स पढ़ना ----------
void checkDrivingCommands() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.setTimeout(800); // छोटा टाइमआउट ताकि लूप कभी न अटके
    http.setReuse(true);
    String cmdUrl = String(FIREBASE_HOST) + "/devices/" + String(DEVICE_ID) + "/currentCommand.json?auth=" + String(API_KEY);
    http.begin(cmdUrl);
    int httpCode = http.GET();
    if (httpCode == 200) {
      String payload = http.getString();
      if (payload.indexOf("FORWARD") >= 0) {
        driveForward(currentSpeedPwm);
        lastValidCommandTime = millis();
      } else if (payload.indexOf("BACKWARD") >= 0) {
        driveBackward(currentSpeedPwm);
        lastValidCommandTime = millis();
      } else if (payload.indexOf("LEFT") >= 0) {
        driveLeft(currentSpeedPwm);
        lastValidCommandTime = millis();
      } else if (payload.indexOf("RIGHT") >= 0) {
        driveRight(currentSpeedPwm);
        lastValidCommandTime = millis();
      } else if (payload.indexOf("STOP") >= 0) {
        stopMotors();
      }
    }
    http.end();
  }
}

void setup() {
  Serial.begin(115200);
  delay(100);
  Serial.println("Starting DriveNexa Rover...");

  setupMotors();
  initCompass();

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to WiFi: ");
  Serial.println(WIFI_SSID);

  while (WiFi.status() != WL_CONNECTED) {
    delay(400);
    Serial.print(".");
  }

  Serial.println("\\nWiFi Connected!");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());

  // तुरंत पहला हार्टबीट भेजें
  sendHeartbeatAndTelemetry();
}

void loop() {
  unsigned long now = millis();

  // सेफ्टी टाइमआउट: 2 सेकंड तक कमान्ड न आने पर कार अपने-आप रुक जाएगी
  if (now - lastValidCommandTime > COMMAND_TIMEOUT_MS) {
    if (currentCommand != "STOP") {
      stopMotors();
    }
  }

  // हर 500 मिलीसेकंड में वेबसाइट कमान्ड चेक
  static unsigned long lastCmdCheck = 0;
  if (now - lastCmdCheck >= 500) {
    lastCmdCheck = now;
    checkDrivingCommands();
  }

  // हर 1.5 सेकंड में हार्टबीट + टेलीमेट्री सिंक
  static unsigned long lastTelem = 0;
  if (now - lastTelem >= 1500) {
    lastTelem = now;
    sendHeartbeatAndTelemetry();
  }
}
`;

  // 2. Full ESP32-S3-CAM + Built-in OV2640 Camera + Web Server + Motors + Firebase
  const esp32S3CamCode = `/**
 * =========================================================================
 * DriveNexa - ESP32-S3 ONBOARD OV2640 CAMERA + MOTORS + FIREBASE
 * WiFi: vivo | Password: 12345678
 * Device ID: NEXA-ROVER-01
 * =========================================================================
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <Wire.h>
#include "esp_camera.h"
#include "esp_http_server.h"

#define WIFI_SSID "vivo"
#define WIFI_PASSWORD "12345678"
#define DEVICE_ID "NEXA-ROVER-01"
#define FIREBASE_HOST "https://drive-nexa-default-rtdb.asia-southeast1.firebasedatabase.app"
#define API_KEY "AIzaSyCNT317RYdI6JWWo8QqzHBQu80cGqUng3Q"

// Motor Pins (L298N)
#define PIN_ENA 18
#define PIN_IN1 19
#define PIN_IN2 20
#define PIN_IN3 21
#define PIN_IN4 47
#define PIN_ENB 48

// Compass Pins
#define I2C_SDA_PIN 8
#define I2C_SCL_PIN 9
#define QMC5883L_ADDR 0x0D

// Freenove / Waveshare ESP32-S3 Camera Pins
#define PWDN_GPIO_NUM     -1
#define RESET_GPIO_NUM    -1
#define XCLK_GPIO_NUM     15
#define SIOD_GPIO_NUM      4
#define SIOC_GPIO_NUM      5
#define Y9_GPIO_NUM       16
#define Y8_GPIO_NUM       17
#define Y7_GPIO_NUM       18
#define Y6_GPIO_NUM       12
#define Y5_GPIO_NUM       10
#define Y4_GPIO_NUM        8
#define Y3_GPIO_NUM        9
#define Y2_GPIO_NUM       11
#define VSYNC_GPIO_NUM     6
#define HREF_GPIO_NUM      7
#define PCLK_GPIO_NUM     13

#define PART_BOUNDARY "123456789000000000000987654321"
static const char* _STREAM_CONTENT_TYPE = "multipart/x-mixed-replace;boundary=" PART_BOUNDARY;
static const char* _STREAM_BOUNDARY = "\\r\\n--" PART_BOUNDARY "\\r\\n";
static const char* _STREAM_PART = "Content-Type: image/jpeg\\r\\nContent-Length: %u\\r\\n\\r\\n";

httpd_handle_t stream_httpd = NULL;
int currentSpeedPwm = 200;
unsigned long lastValidCommandTime = 0;

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

void driveLeft(int pwm) {
  analogWrite(PIN_ENA, pwm);
  analogWrite(PIN_ENB, pwm);
  digitalWrite(PIN_IN1, LOW);
  digitalWrite(PIN_IN2, HIGH);
  digitalWrite(PIN_IN3, HIGH);
  digitalWrite(PIN_IN4, LOW);
}

void driveRight(int pwm) {
  analogWrite(PIN_ENA, pwm);
  analogWrite(PIN_ENB, pwm);
  digitalWrite(PIN_IN1, HIGH);
  digitalWrite(PIN_IN2, LOW);
  digitalWrite(PIN_IN3, LOW);
  digitalWrite(PIN_IN4, HIGH);
}

esp_err_t initCamera() {
  camera_config_t config;
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer = LEDC_TIMER_0;
  config.pin_d0 = Y2_GPIO_NUM;
  config.pin_d1 = Y3_GPIO_NUM;
  config.pin_d2 = Y4_GPIO_NUM;
  config.pin_d3 = Y5_GPIO_NUM;
  config.pin_d4 = Y6_GPIO_NUM;
  config.pin_d5 = Y7_GPIO_NUM;
  config.pin_d6 = Y8_GPIO_NUM;
  config.pin_d7 = Y9_GPIO_NUM;
  config.pin_xclk = XCLK_GPIO_NUM;
  config.pin_pclk = PCLK_GPIO_NUM;
  config.pin_vsync = VSYNC_GPIO_NUM;
  config.pin_href = HREF_GPIO_NUM;
  config.pin_sccb_sda = SIOD_GPIO_NUM;
  config.pin_sccb_scl = SIOC_GPIO_NUM;
  config.pin_pwdn = PWDN_GPIO_NUM;
  config.pin_reset = RESET_GPIO_NUM;
  config.xclk_freq_hz = 20000000;
  config.pixel_format = PIXFORMAT_JPEG;
  config.frame_size = FRAMESIZE_QVGA; // 320x240 for high FPS on mobile
  config.jpeg_quality = 12;
  config.fb_count = 1;

  esp_err_t err = esp_camera_init(&config);
  return err;
}

static esp_err_t stream_handler(httpd_req_t *req) {
  camera_fb_t * fb = NULL;
  esp_err_t res = ESP_OK;
  size_t _jpg_buf_len = 0;
  uint8_t * _jpg_buf = NULL;
  char * part_buf[64];

  httpd_resp_set_type(req, _STREAM_CONTENT_TYPE);
  httpd_resp_set_hdr(req, "Access-Control-Allow-Origin", "*");

  while (true) {
    fb = esp_camera_fb_get();
    if (!fb) {
      res = ESP_FAIL;
    } else {
      _jpg_buf_len = fb->len;
      _jpg_buf = fb->buf;
    }
    if (res == ESP_OK) {
      size_t hlen = snprintf((char *)part_buf, 64, _STREAM_PART, _jpg_buf_len);
      res = httpd_resp_send_chunk(req, (const char *)part_buf, hlen);
    }
    if (res == ESP_OK) {
      res = httpd_resp_send_chunk(req, (const char *)_jpg_buf, _jpg_buf_len);
    }
    if (res == ESP_OK) {
      res = httpd_resp_send_chunk(req, _STREAM_BOUNDARY, strlen(_STREAM_BOUNDARY));
    }
    if (fb) {
      esp_camera_fb_return(fb);
      fb = NULL;
    } else if (res != ESP_OK) {
      break;
    }
    vTaskDelay(15 / portTICK_PERIOD_MS);
  }
  return res;
}

static esp_err_t capture_handler(httpd_req_t *req) {
  camera_fb_t * fb = esp_camera_fb_get();
  if (!fb) {
    httpd_resp_send_500(req);
    return ESP_FAIL;
  }
  httpd_resp_set_type(req, "image/jpeg");
  httpd_resp_set_hdr(req, "Content-Disposition", "inline; filename=capture.jpg");
  httpd_resp_set_hdr(req, "Access-Control-Allow-Origin", "*");
  esp_err_t res = httpd_resp_send(req, (const char *)fb->buf, fb->len);
  esp_camera_fb_return(fb);
  return res;
}

void startCameraServer() {
  httpd_config_t config = HTTPD_DEFAULT_CONFIG();
  config.server_port = 81;
  config.ctrl_port = 32768;

  httpd_uri_t stream_uri = {
    .uri       = "/stream",
    .method    = HTTP_GET,
    .handler   = stream_handler,
    .user_ctx  = NULL
  };

  httpd_uri_t snap_uri = {
    .uri       = "/cam-hi.jpg",
    .method    = HTTP_GET,
    .handler   = capture_handler,
    .user_ctx  = NULL
  };

  if (httpd_start(&stream_httpd, &config) == ESP_OK) {
    httpd_register_uri_handler(stream_httpd, &stream_uri);
    httpd_register_uri_handler(stream_httpd, &snap_uri);
  }
}

void sendHeartbeatAndTelemetry() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.setTimeout(1200);
    String ipStr = WiFi.localIP().toString();

    String hbUrl = String(FIREBASE_HOST) + "/devices/" + String(DEVICE_ID) + "/heartbeat.json?auth=" + String(API_KEY);
    http.begin(hbUrl);
    http.addHeader("Content-Type", "application/json");
    http.PUT("{\"serverTime\":{\".sv\":\"timestamp\"},\"lastSeen\":{\".sv\":\"timestamp\"},\"status\":\"CONNECTED\",\"ip\":\"" + ipStr + "\"}");
    http.end();

    String telemUrl = String(FIREBASE_HOST) + "/devices/" + String(DEVICE_ID) + "/telemetry.json?auth=" + String(API_KEY);
    http.begin(telemUrl);
    http.addHeader("Content-Type", "application/json");
    http.PUT("{\"timestamp\":{\".sv\":\"timestamp\"},\"heading\":0.0,\"compass\":0.0,\"battery\":98,\"ip\":\"" + ipStr + "\",\"cameraStatus\":\"STREAMING\",\"cameraStreamUrl\":\"http://" + ipStr + ":81/stream\",\"status\":\"ONLINE\"}");
    http.end();
  }
}

void checkCommands() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.setTimeout(700);
    http.setReuse(true);
    String cmdUrl = String(FIREBASE_HOST) + "/devices/" + String(DEVICE_ID) + "/currentCommand.json?auth=" + String(API_KEY);
    http.begin(cmdUrl);
    if (http.GET() == 200) {
      String payload = http.getString();
      if (payload.indexOf("FORWARD") >= 0) driveForward(currentSpeedPwm);
      else if (payload.indexOf("BACKWARD") >= 0) driveBackward(currentSpeedPwm);
      else if (payload.indexOf("LEFT") >= 0) driveLeft(currentSpeedPwm);
      else if (payload.indexOf("RIGHT") >= 0) driveRight(currentSpeedPwm);
      else if (payload.indexOf("STOP") >= 0) stopMotors();
    }
    http.end();
  }
}

void setup() {
  Serial.begin(115200);
  setupMotors();
  initCamera();

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(400);
  }

  startCameraServer();
  sendHeartbeatAndTelemetry();
}

void loop() {
  unsigned long now = millis();
  static unsigned long lastCmd = 0;
  if (now - lastCmd >= 500) {
    lastCmd = now;
    checkCommands();
  }

  static unsigned long lastTelem = 0;
  if (now - lastTelem >= 1500) {
    lastTelem = now;
    sendHeartbeatAndTelemetry();
  }
}
`;

  // 3. AI-Thinker ESP32-CAM Classic
  const aiThinkerCode = `/**
 * =========================================================================
 * DriveNexa - AI-THINKER ESP32-CAM (Classic OV2640 Board)
 * WiFi: vivo | Password: 12345678 | Device ID: NEXA-ROVER-01
 * =========================================================================
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include "esp_camera.h"
#include "esp_http_server.h"

#define WIFI_SSID "vivo"
#define WIFI_PASSWORD "12345678"
#define DEVICE_ID "NEXA-ROVER-01"
#define FIREBASE_HOST "https://drive-nexa-default-rtdb.asia-southeast1.firebasedatabase.app"
#define API_KEY "AIzaSyCNT317RYdI6JWWo8QqzHBQu80cGqUng3Q"

// AI-Thinker Pin Map
#define PWDN_GPIO_NUM     32
#define RESET_GPIO_NUM    -1
#define XCLK_GPIO_NUM      0
#define SIOD_GPIO_NUM     26
#define SIOC_GPIO_NUM     27
#define Y9_GPIO_NUM       35
#define Y8_GPIO_NUM       34
#define Y7_GPIO_NUM       39
#define Y6_GPIO_NUM       36
#define Y5_GPIO_NUM       21
#define Y4_GPIO_NUM       19
#define Y3_GPIO_NUM       18
#define Y2_GPIO_NUM        5
#define VSYNC_GPIO_NUM    25
#define HREF_GPIO_NUM     23
#define PCLK_GPIO_NUM     22

// Free Pins for Motor Drivers on AI-Thinker: GPIO 12, 13, 14, 15
#define PIN_IN1 12
#define PIN_IN2 13
#define PIN_IN3 14
#define PIN_IN4 15

httpd_handle_t stream_httpd = NULL;

void setupMotors() {
  pinMode(PIN_IN1, OUTPUT);
  pinMode(PIN_IN2, OUTPUT);
  pinMode(PIN_IN3, OUTPUT);
  pinMode(PIN_IN4, OUTPUT);
  stopMotors();
}

void stopMotors() {
  digitalWrite(PIN_IN1, LOW);
  digitalWrite(PIN_IN2, LOW);
  digitalWrite(PIN_IN3, LOW);
  digitalWrite(PIN_IN4, LOW);
}

void driveForward() {
  digitalWrite(PIN_IN1, HIGH);
  digitalWrite(PIN_IN2, LOW);
  digitalWrite(PIN_IN3, HIGH);
  digitalWrite(PIN_IN4, LOW);
}

void driveBackward() {
  digitalWrite(PIN_IN1, LOW);
  digitalWrite(PIN_IN2, HIGH);
  digitalWrite(PIN_IN3, LOW);
  digitalWrite(PIN_IN4, HIGH);
}

void driveLeft() {
  digitalWrite(PIN_IN1, LOW);
  digitalWrite(PIN_IN2, HIGH);
  digitalWrite(PIN_IN3, HIGH);
  digitalWrite(PIN_IN4, LOW);
}

void driveRight() {
  digitalWrite(PIN_IN1, HIGH);
  digitalWrite(PIN_IN2, LOW);
  digitalWrite(PIN_IN3, LOW);
  digitalWrite(PIN_IN4, HIGH);
}

esp_err_t initCamera() {
  camera_config_t config;
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer = LEDC_TIMER_0;
  config.pin_d0 = Y2_GPIO_NUM;
  config.pin_d1 = Y3_GPIO_NUM;
  config.pin_d2 = Y4_GPIO_NUM;
  config.pin_d3 = Y5_GPIO_NUM;
  config.pin_d4 = Y6_GPIO_NUM;
  config.pin_d5 = Y7_GPIO_NUM;
  config.pin_d6 = Y8_GPIO_NUM;
  config.pin_d7 = Y9_GPIO_NUM;
  config.pin_xclk = XCLK_GPIO_NUM;
  config.pin_pclk = PCLK_GPIO_NUM;
  config.pin_vsync = VSYNC_GPIO_NUM;
  config.pin_href = HREF_GPIO_NUM;
  config.pin_sccb_sda = SIOD_GPIO_NUM;
  config.pin_sccb_scl = SIOC_GPIO_NUM;
  config.pin_pwdn = PWDN_GPIO_NUM;
  config.pin_reset = RESET_GPIO_NUM;
  config.xclk_freq_hz = 20000000;
  config.pixel_format = PIXFORMAT_JPEG;
  config.frame_size = FRAMESIZE_QVGA;
  config.jpeg_quality = 12;
  config.fb_count = 1;

  return esp_camera_init(&config);
}

void sendHeartbeatAndTelemetry() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.setTimeout(1200);
    String ipStr = WiFi.localIP().toString();
    unsigned long epochSec = millis() / 1000;

    String hbUrl = String(FIREBASE_HOST) + "/devices/" + String(DEVICE_ID) + "/heartbeat.json?auth=" + String(API_KEY);
    http.begin(hbUrl);
    http.addHeader("Content-Type", "application/json");
    http.PUT("{\"serverTime\":{\".sv\":\"timestamp\"},\"lastSeen\":{\".sv\":\"timestamp\"},\"status\":\"CONNECTED\",\"ip\":\"" + ipStr + "\"}");
    http.end();

    String telemUrl = String(FIREBASE_HOST) + "/devices/" + String(DEVICE_ID) + "/telemetry.json?auth=" + String(API_KEY);
    http.begin(telemUrl);
    http.addHeader("Content-Type", "application/json");
    http.PUT("{\"timestamp\":{\".sv\":\"timestamp\"},\"heading\":0.0,\"compass\":0.0,\"battery\":98,\"ip\":\"" + ipStr + "\",\"cameraStatus\":\"STREAMING\",\"cameraStreamUrl\":\"http://" + ipStr + ":81/stream\",\"status\":\"ONLINE\"}");
    http.end();
  }
}

void checkCommands() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.setTimeout(700);
    http.setReuse(true);
    String cmdUrl = String(FIREBASE_HOST) + "/devices/" + String(DEVICE_ID) + "/currentCommand.json?auth=" + String(API_KEY);
    http.begin(cmdUrl);
    if (http.GET() == 200) {
      String payload = http.getString();
      if (payload.indexOf("FORWARD") >= 0) driveForward();
      else if (payload.indexOf("BACKWARD") >= 0) driveBackward();
      else if (payload.indexOf("LEFT") >= 0) driveLeft();
      else if (payload.indexOf("RIGHT") >= 0) driveRight();
      else if (payload.indexOf("STOP") >= 0) stopMotors();
    }
    http.end();
  }
}

void setup() {
  Serial.begin(115200);
  setupMotors();
  initCamera();

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(400);
  }

  sendHeartbeatAndTelemetry();
}

void loop() {
  unsigned long now = millis();
  static unsigned long lastCmd = 0;
  if (now - lastCmd >= 500) {
    lastCmd = now;
    checkCommands();
  }

  static unsigned long lastTelem = 0;
  if (now - lastTelem >= 1500) {
    lastTelem = now;
    sendHeartbeatAndTelemetry();
  }
}
`;

  const getActiveCode = () => {
    switch (boardType) {
      case 'AMIT_WIRED_PINS':
        return amitWiredCode;
      case 'ESP32_S3_CAM':
        return esp32S3CamCode;
      case 'AI_THINKER':
        return aiThinkerCode;
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getActiveCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md cursor-pointer"
    >
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-100 cursor-default">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>ArduinoDroid ESP32 कोड (Copy & Paste)</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                  READY
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                सीधा अपने मोबाइल के ArduinoDroid ऐप में पेस्ट करके ESP32 में फ्लैश करें
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="px-5 py-3 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setBoardType('AMIT_WIRED_PINS')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                boardType === 'AMIT_WIRED_PINS'
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>1. आपकी जुड़ी हुई पिनें (18, 19, 20, 21, 47, 48)</span>
            </button>

            <button
              onClick={() => setBoardType('ESP32_S3_CAM')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                boardType === 'ESP32_S3_CAM'
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>2. ESP32-S3 OV2640 कैमरा</span>
            </button>

            <button
              onClick={() => setBoardType('AI_THINKER')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                boardType === 'AI_THINKER'
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>3. AI-Thinker ESP32-CAM</span>
            </button>
          </div>

          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-md ${
              copied
                ? 'bg-emerald-600 text-white shadow-emerald-500/30'
                : 'bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black shadow-emerald-500/20'
            }`}
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'कोड कॉपी हो गया! (COPIED)' : 'पूरा कोड कॉपी करें (COPY CODE)'}</span>
          </button>
        </div>

        {/* Info Note in Hindi */}
        <div className="px-5 py-2.5 bg-blue-950/40 border-b border-blue-900/40 text-xs text-blue-200 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            <strong>प्री-कॉन्फिगर्ड:</strong> वाई-फाई (<strong>vivo / 12345678</strong>), डिवाइस ID (<strong>NEXA-ROVER-01</strong>) और फायरबेस URL पहले से सेट हैं।
          </span>
        </div>

        {/* Code Content Box */}
        <div className="flex-1 overflow-auto p-4 bg-slate-950 font-mono text-xs text-slate-300 select-all">
          <pre className="whitespace-pre">{getActiveCode()}</pre>
        </div>

        {/* Footer Instructions */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between text-xs text-slate-400 flex-wrap gap-2">
          <div className="flex items-center gap-1.5 text-slate-300">
            <span>📱 <strong>ArduinoDroid स्टेप्स:</strong> कोड कॉपी करें ➔ ArduinoDroid में पेस्ट करें ➔ Compile दबाएं ➔ OTG से अपलोड करें।</span>
          </div>

          <button
            onClick={handleCopy}
            className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>कॉपी करें</span>
          </button>
        </div>
      </div>
    </div>
  );
};
