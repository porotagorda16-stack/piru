export const MAIN_CPP_CODE = `/**
 * ==============================================================================
 * PROYECTO: Control de Robot Sumo con ESP32 y L298N
 * PROTOCOLO: Bluetooth Clásico (BluetoothSerial) - Nombre: "RobotSumo"
 * COMANDOS: W/w (Avanzar), S/s (Retroceder), A/a (Girar Izq), D/d (Girar Der), L/l (STOP)
 * AUTOR: Generado para PlatformIO / Arduino Framework
 * ==============================================================================
 */

#include <Arduino.h>
#include "BluetoothSerial.h"

// ==========================================
// CONFIGURACIÓN DE PINES (GPIO)
// EXACTAMENTE SEGÚN ESPECIFICACIONES
// ==========================================
// Driver L298N Motor Izquierdo (OUT1, OUT2)
const int PIN_IN1 = 26; // Sentido 1 Izquierda
const int PIN_IN2 = 27; // Sentido 2 Izquierda
const int PIN_ENA = 14; // PWM Velocidad Izquierda (Jumper ENA retirado)

// Driver L298N Motor Derecho (OUT3, OUT4)
const int PIN_IN3 = 25; // Sentido 1 Derecha
const int PIN_IN4 = 33; // Sentido 2 Derecha
const int PIN_ENB = 32; // PWM Velocidad Derecha (Jumper ENB retirado)

// ==========================================
// CONFIGURACIÓN DE VELOCIDAD Y PWM
// ==========================================
// Velocidad inicial: 200 de 255 (modificable libremente entre 0 y 255)
int velocidadActual = 200;

// Parámetros PWM para el ESP32 (LEDC)
const int PWM_FREQ = 1000;       // 1000 Hz frecuencia recomendada para motores DC
const int PWM_RES  = 8;          // Resolución de 8 bits (valores de 0 a 255)
const int PWM_CH_ENA = 0;        // Canal LEDC para motor izquierdo
const int PWM_CH_ENB = 1;        // Canal LEDC para motor derecho

// ==========================================
// SISTEMA DE SEGURIDAD / FAILSAFE (WATCHDOG)
// ==========================================
// Tiempo máximo sin recibir comandos antes de detener automáticamente los motores
const unsigned long TIEMPO_SEGURIDAD_MS = 500;
unsigned long ultimoComandoMillis = 0;
bool robotEnMovimiento = false;

// Instancia de Bluetooth Clásico
BluetoothSerial SerialBT;

// Nombre del dispositivo Bluetooth
const char* BT_DEVICE_NAME = "RobotSumo";

// ==========================================
// DECLARACIÓN DE FUNCIONES DE CONTROL
// ==========================================
void aplicarPWM(int velocidadIzq, int velocidadDer);
void avanzar();
void retroceder();
void girarIzquierda();
void girarDerecha();
void detenerRobot();
void procesarComando(char c);

void setup() {
  // 1. Iniciar monitor serial a 115200 baudios
  Serial.begin(115200);
  delay(500);
  Serial.println("\n==============================================");
  Serial.println("  SISTEMA DE CONTROL - ROBOT SUMO ESP32       ");
  Serial.println("==============================================");

  // 2. Configurar pines de dirección como SALIDAS digitales
  pinMode(PIN_IN1, OUTPUT);
  pinMode(PIN_IN2, OUTPUT);
  pinMode(PIN_IN3, OUTPUT);
  pinMode(PIN_IN4, OUTPUT);

  // 3. Configurar canales PWM para ENA y ENB
  // Soporta tanto ESP32 Core v2.x como v3.x
  #if defined(ESP_ARDUINO_VERSION_MAJOR) && (ESP_ARDUINO_VERSION_MAJOR >= 3)
    ledcAttach(PIN_ENA, PWM_FREQ, PWM_RES);
    ledcAttach(PIN_ENB, PWM_FREQ, PWM_RES);
  #else
    ledcSetup(PWM_CH_ENA, PWM_FREQ, PWM_RES);
    ledcAttachPin(PIN_ENA, PWM_CH_ENA);
    ledcSetup(PWM_CH_ENB, PWM_FREQ, PWM_RES);
    ledcAttachPin(PIN_ENB, PWM_CH_ENB);
  #endif

  // 4. Iniciar con los motores completamente detenidos
  detenerRobot();

  // 5. Iniciar Bluetooth Clásico con el nombre "RobotSumo"
  if (SerialBT.begin(BT_DEVICE_NAME)) {
    Serial.print("[BT INICIADO]: Dispositivo listo. Nombre: ");
    Serial.println(BT_DEVICE_NAME);
    Serial.println("[BT INFO]: Empareja tu celular o PC con 'RobotSumo'");
  } else {
    Serial.println("[BT ERROR]: No se pudo iniciar Bluetooth Clásico");
  }

  Serial.println("Comandos aceptados: W (Avanzar), S (Retroceder), A (Izq), D (Der), L (STOP)");
  Serial.printf("Velocidad configurada: %d / 255\\n", velocidadActual);
  Serial.printf("Failsafe de seguridad activo: %lu ms\\n", TIEMPO_SEGURIDAD_MS);
  Serial.println("==============================================\\n");
}

void loop() {
  // 1. Comprobar si hay datos entrantes por Bluetooth
  if (SerialBT.available()) {
    char comando = (char)SerialBT.read();
    procesarComando(comando);
  }

  // 2. Comprobar también por el Monitor Serial (para pruebas directas por USB)
  if (Serial.available()) {
    char comandoSerial = (char)Serial.read();
    procesarComando(comandoSerial);
  }

  // 3. SISTEMA DE SEGURIDAD (FAILSAFE WATCHDOG)
  // Si el robot se está moviendo y han pasado más de 500ms sin recibir ningún comando,
  // detener inmediatamente los motores para evitar que el robot choque o caiga del ring.
  if (robotEnMovimiento && (millis() - ultimoComandoMillis > TIEMPO_SEGURIDAD_MS)) {
    detenerRobot();
    robotEnMovimiento = false;
    Serial.println("[SEGURIDAD]: Timeout >500ms sin señal. Motores detenidos automaticamente.");
  }
}

/**
 * Procesa los comandos recibidos por Bluetooth o Serial
 * Acepta tanto mayúsculas como minúsculas
 */
void procesarComando(char c) {
  // Ignorar caracteres de salto de línea o retorno de carro
  if (c == '\\r' || c == '\\n' || c == ' ') return;

  // Convertir a mayúscula para simplificar la comparación
  char cmd = toupper(c);

  // El comando L (STOP) tiene prioridad absoluta
  if (cmd == 'L') {
    detenerRobot();
    robotEnMovimiento = false;
    ultimoComandoMillis = millis();
    Serial.println("[COMANDO 'L']: DETENER ROBOT (STOP) -> Ambos motores apagados");
    return;
  }

  switch (cmd) {
    case 'W': // Avanzar
      avanzar();
      robotEnMovimiento = true;
      ultimoComandoMillis = millis();
      Serial.printf("[COMANDO 'W']: AVANZAR -> Ambos motores adelante | Vel: %d\\n", velocidadActual);
      break;

    case 'S': // Retroceder
      retroceder();
      robotEnMovimiento = true;
      ultimoComandoMillis = millis();
      Serial.printf("[COMANDO 'S']: RETROCEDER -> Ambos motores atras | Vel: %d\\n", velocidadActual);
      break;

    case 'A': // Girar a la izquierda
      girarIzquierda();
      robotEnMovimiento = true;
      ultimoComandoMillis = millis();
      Serial.printf("[COMANDO 'A']: GIRAR IZQUIERDA -> Motor Izq atras, Der adelante | Vel: %d\\n", velocidadActual);
      break;

    case 'D': // Girar a la derecha
      girarDerecha();
      robotEnMovimiento = true;
      ultimoComandoMillis = millis();
      Serial.printf("[COMANDO 'D']: GIRAR DERECHA -> Motor Izq adelante, Der atras | Vel: %d\\n", velocidadActual);
      break;

    default:
      // Comando no reconocido
      Serial.printf("[AVISO]: Caracter '%c' recibido (no reconocido)\\n", c);
      break;
  }
}

/**
 * Aplica el ciclo de trabajo PWM a los canales ENA y ENB
 */
void aplicarPWM(int velocidadIzq, int velocidadDer) {
  velocidadIzq = constrain(velocidadIzq, 0, 255);
  velocidadDer = constrain(velocidadDer, 0, 255);

  #if defined(ESP_ARDUINO_VERSION_MAJOR) && (ESP_ARDUINO_VERSION_MAJOR >= 3)
    ledcWrite(PIN_ENA, velocidadIzq);
    ledcWrite(PIN_ENB, velocidadDer);
  #else
    ledcWrite(PWM_CH_ENA, velocidadIzq);
    ledcWrite(PWM_CH_ENB, velocidadDer);
  #endif
}

/**
 * AVANZAR (W / w):
 * Motor Izquierdo adelante (IN1=HIGH, IN2=LOW)
 * Motor Derecho adelante   (IN3=HIGH, IN4=LOW)
 */
void avanzar() {
  digitalWrite(PIN_IN1, HIGH);
  digitalWrite(PIN_IN2, LOW);
  digitalWrite(PIN_IN3, HIGH);
  digitalWrite(PIN_IN4, LOW);
  aplicarPWM(velocidadActual, velocidadActual);
}

/**
 * RETROCEDER (S / s):
 * Motor Izquierdo atrás (IN1=LOW, IN2=HIGH)
 * Motor Derecho atrás   (IN3=LOW, IN4=HIGH)
 */
void retroceder() {
  digitalWrite(PIN_IN1, LOW);
  digitalWrite(PIN_IN2, HIGH);
  digitalWrite(PIN_IN3, LOW);
  digitalWrite(PIN_IN4, HIGH);
  aplicarPWM(velocidadActual, velocidadActual);
}

/**
 * GIRAR A LA IZQUIERDA (A / a):
 * Motor Izquierdo retrocede (IN1=LOW, IN2=HIGH)
 * Motor Derecho avanza     (IN3=HIGH, IN4=LOW)
 */
void girarIzquierda() {
  digitalWrite(PIN_IN1, LOW);
  digitalWrite(PIN_IN2, HIGH);
  digitalWrite(PIN_IN3, HIGH);
  digitalWrite(PIN_IN4, LOW);
  aplicarPWM(velocidadActual, velocidadActual);
}

/**
 * GIRAR A LA DERECHA (D / d):
 * Motor Izquierdo avanza     (IN1=HIGH, IN2=LOW)
 * Motor Derecho retrocede   (IN3=LOW, IN4=HIGH)
 */
void girarDerecha() {
  digitalWrite(PIN_IN1, HIGH);
  digitalWrite(PIN_IN2, LOW);
  digitalWrite(PIN_IN3, LOW);
  digitalWrite(PIN_IN4, HIGH);
  aplicarPWM(velocidadActual, velocidadActual);
}

/**
 * DETENER ROBOT (L / l):
 * Ambos motores apagados y PWM a 0
 */
void detenerRobot() {
  digitalWrite(PIN_IN1, LOW);
  digitalWrite(PIN_IN2, LOW);
  digitalWrite(PIN_IN3, LOW);
  digitalWrite(PIN_IN4, LOW);
  aplicarPWM(0, 0);
}
`;

export const PLATFORMIO_INI_CODE = `; ==============================================================================
; PlatformIO Project Configuration File para Robot Sumo ESP32
; ==============================================================================

[env:esp32dev]
platform = espressif32
board = esp32dev
framework = arduino

; Velocidad del monitor serie (coincide con Serial.begin(115200))
monitor_speed = 115200

; Filtros para visualización limpia en terminal
monitor_filters = esp32_exception_decoder, default

; Opciones de subida
upload_speed = 921600

; Partición recomendada para soporte de Bluetooth Clásico (requiere espacio)
board_build.partitions = huge_app.csv

; Librerías necesarias:
; BluetoothSerial viene incluida nativamente en el framework Arduino de ESP32.
; No se requieren dependencias externas adicionales en lib_deps.
`;

export const PINOUT_INFO = [
  {
    pinL298N: 'IN1',
    pinEsp32: 'GPIO 26',
    tipo: 'Digital OUT',
    funcion: 'Motor Izquierdo (Sentido 1)',
    color: 'emerald',
  },
  {
    pinL298N: 'IN2',
    pinEsp32: 'GPIO 27',
    tipo: 'Digital OUT',
    funcion: 'Motor Izquierdo (Sentido 2)',
    color: 'emerald',
  },
  {
    pinL298N: 'IN3',
    pinEsp32: 'GPIO 25',
    tipo: 'Digital OUT',
    funcion: 'Motor Derecho (Sentido 1)',
    color: 'blue',
  },
  {
    pinL298N: 'IN4',
    pinEsp32: 'GPIO 33',
    tipo: 'Digital OUT',
    funcion: 'Motor Derecho (Sentido 2)',
    color: 'blue',
  },
  {
    pinL298N: 'ENA',
    pinEsp32: 'GPIO 14',
    tipo: 'PWM (LEDC)',
    funcion: 'Velocidad Motor Izq (Jumper ENA retirado)',
    color: 'amber',
  },
  {
    pinL298N: 'ENB',
    pinEsp32: 'GPIO 32',
    tipo: 'PWM (LEDC)',
    funcion: 'Velocidad Motor Der (Jumper ENB retirado)',
    color: 'amber',
  },
  {
    pinL298N: 'GND',
    pinEsp32: 'GND',
    tipo: 'Tierra común',
    funcion: 'Unir GND del L298N, ESP32 y Polo (-) de Batería',
    color: 'slate',
  },
  {
    pinL298N: '+12V (VCC)',
    pinEsp32: 'Batería (+)',
    tipo: 'Alimentación',
    funcion: 'Polo (+) de batería (7.4V a 12V) pasando por Interruptor',
    color: 'rose',
  },
  {
    pinL298N: 'OUT1 y OUT2',
    pinEsp32: 'Motor Izq',
    tipo: 'Potencia',
    funcion: 'Conexión a bornes del Motor DC Izquierdo',
    color: 'indigo',
  },
  {
    pinL298N: 'OUT3 y OUT4',
    pinEsp32: 'Motor Der',
    tipo: 'Potencia',
    funcion: 'Conexión a bornes del Motor DC Derecho',
    color: 'indigo',
  },
];
