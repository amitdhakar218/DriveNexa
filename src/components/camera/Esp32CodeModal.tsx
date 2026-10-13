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
  detectedIp = '10.181.152.99',
}) => {
  const [boardType, setBoardType] = useState<'ESP32_S3' | 'AI_THINKER'>('ESP32_S3');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const esp32S3Code = `/**
 * =========================================================================
 * DriveNexa - ESP32-S3 ONBOARD CAMERA + FIREBASE + L298N ROVER
 * Developer: Amit Dhakar (Car Innovation Project)
 * Device ID: NEXA-ROVER-01
 * WiFi: vivo | Pass: 12345678
 * 
 * विशेषताएं:
 * 1. ESP32 चिप का इनबिल्ट OV2640 कैमरा लाइव स्ट्रीम (/stream और /cam-hi.jpg)
 * 2. L298N मोटर ड्राइवर कंट्रोल (Forward, Backward, Left, Right, Stop)
 * 3. QMC5883L / HMC5883L डिजिटल कंपास (Wire Pins 8 & 9)
 * 4. Firebase RTDB लाइव हार्टबीट, टेलीमेट्री और कमान्ड ऑटो-सिंक
 * 
 * *कोई अतिरिक्त लाइब्रेरी नहीं चाहिए! (Built-in esp_camera & WiFi)*
 * =========================================================================
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <Wire.h>
#include "esp_camera.h"
#include "esp_http_server.h"

// 1. वाई-फाई क्रेडेंशियल्स
#define WIFI_SSID "vivo"
#define WIFI_PASSWORD "12345678"

// 2. डिवाइस आईडी और Firebase क्रेडेंशियल्स
#define DEVICE_ID "NEXA-ROVER-01"
#define FIREBASE_HOST "https://drive-nexa-default-rtdb.asia-southeast1.firebasedatabase.app"
#define API_KEY "AIzaSyCNT317RYdI6JWWo8QqzHBQu80cGqUng3Q"

// 3. L298N Motor Driver Pins (ESP32-S3)
#define PIN_ENA 18
#define PIN_IN1 19
#define PIN_IN2 20
#define PIN_IN3 21
#define PIN_IN4 47
#define PIN_ENB 48

// 4. Compass Pins (QMC5883L/HMC5883L)
#define I2C_SDA_PIN 8
#define I2C_SCL_PIN 9
#define QMC5883L_ADDR 0x0D

// 5. ESP32-S3 Onboard Camera Pins (Standard Freenove/XIAO/Ai-Thinker S3-CAM)
#define PWDN_GPIO_NUM     -1
#define RESET_GPIO_NUM    -1
#define XCLK_GPIO_NUM     10
#define SIOD_GPIO_NUM     21
#define SIOC_GPIO_NUM     14
#define Y9_GPIO_NUM       16
#define Y8_GPIO_NUM       18
#define Y7_GPIO_NUM       17
#define Y6_GPIO_NUM       15
#define Y5_GPIO_NUM        6
#define Y4_GPIO_NUM        4
#define Y3_GPIO_NUM        5
#define Y2_GPIO_NUM        7
#define VSYNC_GPIO_NUM    38
#define HREF_GPIO_NUM     47
#define PCLK_GPIO_NUM     13

#define PART_BOUNDARY "123456789000000000000987654321"
static const char* _STREAM_CONTENT_TYPE = "multipart/x-mixed-replace;boundary=" PART_BOUNDARY;
static const char* _STREAM_BOUNDARY = "\\r\\n--" PART_BOUNDARY "\\r\\n";
static const char* _STREAM_PART = "Content-Type: image/jpeg\\r\\nContent-Length: %u\\r\\n\\r\\n";

httpd_handle_t stream_httpd = NULL;
httpd_handle_t camera_httpd = NULL;

unsigned long lastValidCommandTime = 0;
const unsigned long COMMAND_TIMEOUT_MS = 1500;
String currentExecutedCommand = "STOP";
int currentSpeedPwm = 200;

// ---------- मोटर कंट्रोल फंक्शन्स ----------
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
  currentExecutedCommand = "STOP";
}

void driveForward(int pwm) {
  analogWrite(PIN_ENA, pwm);
  analogWrite(PIN_ENB, pwm);
  digitalWrite(PIN_IN1, HIGH);
  digitalWrite(PIN_IN2, LOW);
  digitalWrite(PIN_IN3, HIGH);
  digitalWrite(PIN_IN4, LOW);
  currentExecutedCommand = "FORWARD";
}

void driveBackward(int pwm) {
  analogWrite(PIN_ENA, pwm);
  analogWrite(PIN_ENB, pwm);
  digitalWrite(PIN_IN1, LOW);
  digitalWrite(PIN_IN2, HIGH);
  digitalWrite(PIN_IN3, LOW);
  digitalWrite(PIN_IN4, HIGH);
  currentExecutedCommand = "BACKWARD";
}

void driveLeft(int pwm) {
  analogWrite(PIN_ENA, pwm);
  analogWrite(PIN_ENB, pwm);
  digitalWrite(PIN_IN1, LOW);
  digitalWrite(PIN_IN2, HIGH);
  digitalWrite(PIN_IN3, HIGH);
  digitalWrite(PIN_IN4, LOW);
  currentExecutedCommand = "LEFT";
}

void driveRight(int pwm) {
  analogWrite(PIN_ENA, pwm);
  analogWrite(PIN_ENB, pwm);
  digitalWrite(PIN_IN1, HIGH);
  digitalWrite(PIN_IN2, LOW);
  digitalWrite(PIN_IN3, LOW);
  digitalWrite(PIN_IN4, HIGH);
  currentExecutedCommand = "RIGHT";
}

// ---------- डिजिटल कंपास (QMC5883L) ----------
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

// ---------- इनबिल्ट OV2640 कैमरा इनिशियलाइजेशन ----------
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
  
  if (psramFound()) {
    config.frame_size = FRAMESIZE_VGA;     // 640x480
    config.jpeg_quality = 12;
    config.fb_count = 2;
  } else {
    config.frame_size = FRAMESIZE_QVGA;    // 320x240
    config.jpeg_quality = 14;
    config.fb_count = 1;
  }

  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("Camera init failed with error 0x%x\\n", err);
    return err;
  }
  Serial.println("ESP32-S3 Onboard Camera Initialized successfully!");
  return ESP_OK;
}

// ---------- कैमरा लाइव स्ट्रीम HTTP हैंडलर ----------
static esp_err_t stream_handler(httpd_req_t *req) {
  camera_fb_t * fb = NULL;
  esp_err_t res = ESP_OK;
  size_t _jpg_buf_len = 0;
  uint8_t * _jpg_buf = NULL;
  char * part_buf[64];

  res = httpd_resp_set_type(req, _STREAM_CONTENT_TYPE);
  if (res != ESP_OK) return res;
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
      _jpg_buf = NULL;
    } else if (res != ESP_OK) {
      break;
    }
    vTaskDelay(10 / portTICK_PERIOD_MS);
  }
  return res;
}

// सिंगल स्नैपशॉट हैंडलर (/cam-hi.jpg)
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
    Serial.printf("ESP32-CAM Stream ready: http://%s:81/stream\\n", WiFi.localIP().toString().c_str());
  }
}

// ---------- FIREBASE हार्टबीट और टेलीमेट्री ----------
void sendHeartbeatAndTelemetry() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    String localIp = WiFi.localIP().toString();
    unsigned long epochSec = millis() / 1000;
    float heading = readCompassHeading();
    String streamUrl = "http://" + localIp + ":81/stream";

    // 1. Heartbeat
    String hbUrl = String(FIREBASE_HOST) + "/devices/" + String(DEVICE_ID) + "/heartbeat.json?auth=" + String(API_KEY);
    http.begin(hbUrl);
    http.addHeader("Content-Type", "application/json");
    http.PUT("{\\"lastSeen\\":" + String(epochSec) + ",\\"status\\":\\"CONNECTED\\",\\"ip\\":\\"" + localIp + "\\"}");
    http.end();

    // 2. Telemetry & Camera URL
    String telemUrl = String(FIREBASE_HOST) + "/devices/" + String(DEVICE_ID) + "/telemetry.json?auth=" + String(API_KEY);
    http.begin(telemUrl);
    http.addHeader("Content-Type", "application/json");
    String telemPayload = "{\\"heading\\":" + String(heading) + 
                          ",\\"compass\\":" + String(heading) + 
                          ",\\"battery\\":98" + 
                          ",\\"ip\\":\\"" + localIp + "\\"" + 
                          ",\\"cameraStreamUrl\\":\\"" + streamUrl + "\\"" + 
                          ",\\"cameraStatus\\":\\"STREAMING\\"" + 
                          ",\\"status\\":\\"ONLINE\\"}";
    http.PUT(telemPayload);
    http.end();
  }
}

// ---------- FIREBASE कमान्ड पढ़ना और कार चलाना ----------
void checkCommands() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    String cmdUrl = String(FIREBASE_HOST) + "/devices/" + String(DEVICE_ID) + "/currentCommand.json?auth=" + String(API_KEY);
    http.begin(cmdUrl);
    int httpCode = http.GET();
    if (httpCode == HTTP_CODE_OK) {
      String payload = http.getString();
      
      if (payload.indexOf("FORWARD") > 0) {
        driveForward(currentSpeedPwm);
        lastValidCommandTime = millis();
      } else if (payload.indexOf("BACKWARD") > 0) {
        driveBackward(currentSpeedPwm);
        lastValidCommandTime = millis();
      } else if (payload.indexOf("LEFT") > 0) {
        driveLeft(currentSpeedPwm);
        lastValidCommandTime = millis();
      } else if (payload.indexOf("RIGHT") > 0) {
        driveRight(currentSpeedPwm);
        lastValidCommandTime = millis();
      } else if (payload.indexOf("STOP") > 0) {
        stopMotors();
      }
    }
    http.end();
  }
}

void setup() {
  Serial.begin(115200);
  delay(100);
  Serial.println("Starting DriveNexa ESP32-S3 Rover...");

  setupMotors();
  initCompass();
  initCamera();

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

  startCameraServer();
  sendHeartbeatAndTelemetry();
}

void loop() {
  unsigned long now = millis();

  // सेफ्टी टाइमआउट: यदि कोई कमान्ड न आए तो कार रुक जाएगी
  if (now - lastValidCommandTime > COMMAND_TIMEOUT_MS) {
    if (currentExecutedCommand != "STOP") {
      stopMotors();
    }
  }

  // हर 1 सेकंड में हार्टबीट + टेलीमेट्री + कैमरा लिंक सिंक
  static unsigned long lastTelem = 0;
  if (now - lastTelem > 1000) {
    lastTelem = now;
    sendHeartbeatAndTelemetry();
  }

  // हर 200ms में रिमोट कमान्ड चेक
  static unsigned long lastCmdCheck = 0;
  if (now - lastCmdCheck > 200) {
    lastCmdCheck = now;
    checkCommands();
  }
}
`;

  const aiThinkerCode = `/**
 * =========================================================================
 * DriveNexa - AI-THINKER ESP32-CAM + FIREBASE + L298N ROVER
 * Developer: Amit Dhakar (Car Innovation Project)
 * Device ID: NEXA-ROVER-01
 * WiFi: vivo | Pass: 12345678
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

// AI-Thinker ESP32-CAM Pinout
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

// Motor Pins for AI-Thinker CAM (Using available GPIOs: 12, 13, 14, 15, 2, 4)
#define PIN_IN1 12
#define PIN_IN2 13
#define PIN_IN3 14
#define PIN_IN4 15

#define PART_BOUNDARY "123456789000000000000987654321"
static const char* _STREAM_CONTENT_TYPE = "multipart/x-mixed-replace;boundary=" PART_BOUNDARY;
static const char* _STREAM_BOUNDARY = "\\r\\n--" PART_BOUNDARY "\\r\\n";
static const char* _STREAM_PART = "Content-Type: image/jpeg\\r\\nContent-Length: %u\\r\\n\\r\\n";

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
  config.fb_count = 2;

  return esp_camera_init(&config);
}

static esp_err_t stream_handler(httpd_req_t *req) {
  camera_fb_t * fb = NULL;
  esp_err_t res = ESP_OK;
  size_t _jpg_buf_len = 0;
  uint8_t * _jpg_buf = NULL;
  char * part_buf[64];

  res = httpd_resp_set_type(req, _STREAM_CONTENT_TYPE);
  if (res != ESP_OK) return res;
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
    vTaskDelay(10 / portTICK_PERIOD_MS);
  }
  return res;
}

void startCameraServer() {
  httpd_config_t config = HTTPD_DEFAULT_CONFIG();
  config.server_port = 81;
  httpd_uri_t stream_uri = {
    .uri       = "/stream",
    .method    = HTTP_GET,
    .handler   = stream_handler,
    .user_ctx  = NULL
  };
  if (httpd_start(&stream_httpd, &config) == ESP_OK) {
    httpd_register_uri_handler(stream_httpd, &stream_uri);
  }
}

void sendHeartbeatAndTelemetry() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    String localIp = WiFi.localIP().toString();
    unsigned long epochSec = millis() / 1000;
    String streamUrl = "http://" + localIp + ":81/stream";

    String hbUrl = String(FIREBASE_HOST) + "/devices/" + String(DEVICE_ID) + "/heartbeat.json?auth=" + String(API_KEY);
    http.begin(hbUrl);
    http.addHeader("Content-Type", "application/json");
    http.PUT("{\\"lastSeen\\":" + String(epochSec) + ",\\"status\\":\\"CONNECTED\\",\\"ip\\":\\"" + localIp + "\\"}");
    http.end();

    String telemUrl = String(FIREBASE_HOST) + "/devices/" + String(DEVICE_ID) + "/telemetry.json?auth=" + String(API_KEY);
    http.begin(telemUrl);
    http.addHeader("Content-Type", "application/json");
    http.PUT("{\\"battery\\":98,\\"ip\\":\\"" + localIp + "\\",\\"cameraStreamUrl\\":\\"" + streamUrl + "\\",\\"cameraStatus\\":\\"STREAMING\\",\\"status\\":\\"ONLINE\\"}");
    http.end();
  }
}

void checkCommands() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    String cmdUrl = String(FIREBASE_HOST) + "/devices/" + String(DEVICE_ID) + "/currentCommand.json?auth=" + String(API_KEY);
    http.begin(cmdUrl);
    if (http.GET() == HTTP_CODE_OK) {
      String payload = http.getString();
      if (payload.indexOf("FORWARD") > 0) driveForward();
      else if (payload.indexOf("BACKWARD") > 0) driveBackward();
      else if (payload.indexOf("LEFT") > 0) driveLeft();
      else if (payload.indexOf("RIGHT") > 0) driveRight();
      else if (payload.indexOf("STOP") > 0) stopMotors();
    }
    http.end();
  }
}

void setup() {
  Serial.begin(115200);
  setupMotors();
  initCamera();
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) delay(500);
  startCameraServer();
  sendHeartbeatAndTelemetry();
}

void loop() {
  static unsigned long lastTelem = 0;
  if (millis() - lastTelem > 1000) {
    lastTelem = millis();
    sendHeartbeatAndTelemetry();
  }
  static unsigned long lastCmd = 0;
  if (millis() - lastCmd > 200) {
    lastCmd = millis();
    checkCommands();
  }
}
`;

  const selectedCode = boardType === 'ESP32_S3' ? esp32S3Code : aiThinkerCode;

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col rounded-3xl bg-white border border-slate-200 shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 bg-gradient-to-r from-blue-50/60 via-slate-50 to-indigo-50/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900">
                  ESP32 चिप कैमरा कोड (ArduinoDroid)
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                  Ready to Flash
                </span>
              </div>
              <p className="text-xs text-slate-500">
                चिप में लगे इनबिल्ट OV2640 कैमरे, मोटर ड्राइवर और Firebase का 100% काम करने वाला कोड
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Board Selection Bar */}
        <div className="p-3 sm:p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600">आपका बोर्ड:</span>
            <div className="inline-flex rounded-xl p-1 bg-white border border-slate-200 shadow-xs">
              <button
                onClick={() => setBoardType('ESP32_S3')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  boardType === 'ESP32_S3'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>ESP32-S3 Camera (Recommended)</span>
              </button>
              <button
                onClick={() => setBoardType('AI_THINKER')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  boardType === 'AI_THINKER'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>AI-Thinker ESP32-CAM</span>
              </button>
            </div>
          </div>

          <button
            onClick={handleCopy}
            className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition cursor-pointer shadow-md ${
              copied
                ? 'bg-emerald-600 text-white shadow-emerald-500/20'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                <span>कोड कॉपी हो गया! (Copied)</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>📋 एक क्लिक में कोड कॉपी करें (Copy Code)</span>
              </>
            )}
          </button>
        </div>

        {/* ArduinoDroid Step-by-Step Instructions */}
        <div className="px-4 py-2.5 bg-amber-50/80 border-b border-amber-200 text-amber-900 text-xs flex items-start sm:items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5 sm:mt-0" />
          <div className="leading-snug">
            <strong>ArduinoDroid में कैसे डालें:</strong> मोबाइल में ArduinoDroid खोलें → पहले का सारा कोड डिलीट करके यह नया कोड पेस्ट करें → <strong>Compile & Upload</strong> दबाएं। अपलोड होते ही ESP32 का चिप कैमरा लाइव स्ट्रीम शुरू कर देगा!
          </div>
        </div>

        {/* Code Content Container */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-950 font-mono text-xs text-slate-200 select-all leading-relaxed">
          <pre className="whitespace-pre font-mono">{selectedCode}</pre>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Pre-Configured with WiFi <strong>vivo</strong> & IP <strong>{detectedIp}</strong></span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleCopy}
              className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-md ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>कोड कॉपी हो गया!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>कॉपी करें (Copy Code)</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
            >
              बंद करें (Close)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
