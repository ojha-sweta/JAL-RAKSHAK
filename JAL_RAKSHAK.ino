/*
  ============================================================================
  WATER PURIFICATION SYSTEM — ESP32 CONTROL FIRMWARE
  ============================================================================
  Implements the logic described in the supplied process/logic PDF:
    Page 1 : Hardware layout (Point A -> S4 -> P1 -> Filters -> Point B ->
              P2 -> S1/S2/S3 -> Reject/Recycle/Purified tanks, P3 recycle
              return pump, F1/F2/F3 float switches)
    Page 2 : Point A sampling, S4 valve logic, P1 feed pump logic
    Page 3-4: Point B sampling (pH/TDS/Turbidity/Temp), P2 pump logic
    Page 5 : S1 / S2 / S3 decision logic (reject / recycle / purified)
    Page 6 : Relay module info (3 pumps on MOSFET relay bank, 4 valves on a
              separate relay bank)

  IMPORTANT — read before flashing:
  This firmware fills in a few gaps/ambiguities/conflicts found in the PDF.
  See the chat message / project notes for the full list. Key ones:
    - P3 is wired to GPIO 17 (the user-provided table said GPIO 13, which
      collides with F2; the PDF's own GPIO table on page 6 says GPIO 17).
    - "P1 starts with power supply (or as S1 starts)" is treated as a typo
      for "as S4 starts" (S1 has no logical connection to the feed pump).
    - Priority when deciding S1 vs S2 vs S3 is: S3 (purified) first,
      then S1 (reject / stagnation / cycle-limit), then S2 (recycle),
      else default to S1. This order is an assumption — the PDF does not
      state it explicitly, only that just one of the three is ever open.
    - Sensor raw->engineering-unit formulas are NOT given in the PDF and
      are placeholders (typical Gravity/DFRobot-style TDS/Turbidity/pH
      analog sensors). You MUST calibrate these for your actual sensors.
    - The "% improvement" and "number of cycles" logic that the PDF says
      is computed on a "backend server" is implemented locally here (TDS
      based) so the board can run standalone. Replace evaluateImprovement()
      with an HTTP/MQTT call to your backend if required.
  ============================================================================
*/

#include <Wire.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <Adafruit_ADS1X15.h>

// ============================================================================
// PIN DEFINITIONS  (per PDF page 6 GPIO table, with the P3 fix noted above)
// ============================================================================

// ---- Relay outputs : valves (assumed standard relay board -> active LOW) ---
#define PIN_S4   2    // Inlet supply valve (raw tank -> feed line) / also
                       // gates recycle-water merge point per page-6 table
#define PIN_S1   25   // Point B -> Reject tank valve
#define PIN_S2   26   // Point B -> Recycle tank valve
#define PIN_S3   19   // Point B -> Purified tank valve

// ---- Relay outputs : pumps (assumed MOSFET relay board -> active HIGH) ----
#define PIN_P1   27   // Main feed pump (raw tank -> filters)
#define PIN_P2   14   // Point B tank -> S1/S2/S3 outlet pump
#define PIN_P3   13   // Recycle pump (recycle tank -> feed line)

// ---- Digital inputs : float switches (assumed NO switch to GND, INPUT_PULLUP) --
#define PIN_F1   15   // Point B (treated) tank HIGH level float
#define PIN_F2   12   // Point B (treated) tank LOW level float
                       // NOTE: GPIO12 is an ESP32 boot-strapping pin (MTDI /
                       // flash voltage select). If it reads HIGH at power-up
                       // it can force the flash into 1.8V mode and prevent
                       // boot on most 3.3V-flash boards. Since this is wired
                       // as INPUT_PULLUP (idle = HIGH), verify your specific
                       // board boots reliably with this float switch attached;
                       // if not, this is the one pin in this table worth
                       // relocating.
#define PIN_F3   23   // Recycle tank LOW level float

// ---- Digital input : flow sensor pulse output ----
#define PIN_FLOW 18

// ---- OneWire temperature buses (one sensor per bus) ----
#define PIN_TEMP_A 4
#define PIN_TEMP_B 5

// ---- Analog inputs, ESP32 ADC1 channels (safe to use with WiFi) ----
#define PIN_TDS_A   32
#define PIN_TURB_B  33
#define PIN_TDS_B   34
#define PIN_TURB_A  35

// ---- I2C bus for ADS1115 (pH sensor — only one pH probe, at Point B) ----
#define I2C_SDA 21
#define I2C_SCL 22
#define PH_ADS_CHANNEL 0   // ADS1115 input channel the pH probe is wired to

// ============================================================================
// RELAY POLARITY  — VERIFY AGAINST YOUR ACTUAL HARDWARE BEFORE USE
// ============================================================================
const bool VALVE_ACTIVE_LOW = true;   // standard relay module: LOW = energised
const bool PUMP_ACTIVE_LOW  = false;  // MOSFET relay module: HIGH = energised

// ============================================================================
// CONFIGURATION CONSTANTS  (from PDF logic, page 5 unless noted)
// ============================================================================

// -- Sampling --
const int   SAMPLE_COUNT        = 100;   // "100 samples collected"
const unsigned long SAMPLE_INTERVAL_MS = 100; // spacing between samples (~10s total)

// -- Cycle / reject logic (page 5, S1 box) --
// Diagram: "Number of cycles >= 3 (Maximum cycle count + 1)"
// => Maximum cycle count = 2, reject triggers once cycles reach 3.
const int   MAX_CYCLE_COUNT           = 2;
const float IMPROVEMENT_THRESHOLD_PCT = 8.0; // "% improvement <= 8%" => reject

// -- S2 Recycle-tank conditions (need >=3 of 4 true) --
const float S2_PH_LOW1  = 5.0,  S2_PH_HIGH1 = 6.0;   // 5<=pH<=6
const float S2_PH_LOW2  = 9.0,  S2_PH_HIGH2 = 10.0;  // OR 9<=pH<=10
const float S2_TURB_LOW = 30.0, S2_TURB_HIGH = 70.0; // 30<Turb<70 NTU
const float S2_TEMP_LOW = 40.0, S2_TEMP_HIGH = 45.0; // 40<=Temp<=45 C
const float S2_TDS_LOW  = 1000.0, S2_TDS_HIGH = 1500.0; // 1000<=TDS<1500

// -- S3 Purified-tank conditions (need >=3 of 4 true) --
const float S3_PH_LOW   = 6.5,  S3_PH_HIGH  = 8.5;   // 6.5<=pH<=8.5
const float S3_TURB_MAX = 5.0;                       // Turb <= 5 NTU
const float S3_TDS_MAX  = 500.0;                     // TDS <= 500 mg/L
const float S3_TEMP_LOW = 0.0,  S3_TEMP_HIGH = 40.0; // 0<=Temp<=40 C

// -- Flow sensor calibration (typical hall-effect flow meter, e.g. YF-S201) --
// TODO CALIBRATE to your actual sensor's pulses-per-litre spec.
const float FLOW_PULSES_PER_LITRE = 450.0;

// ============================================================================
// GLOBAL OBJECTS
// ============================================================================
OneWire oneWireA(PIN_TEMP_A);
OneWire oneWireB(PIN_TEMP_B);
DallasTemperature tempSensorA(&oneWireA);
DallasTemperature tempSensorB(&oneWireB);
Adafruit_ADS1115 ads;

// ============================================================================
// SYSTEM STATE MACHINE
// ============================================================================
enum SystemState {
  STATE_INIT,
  STATE_SAMPLE_A,       // one-shot baseline reading at Point A
  STATE_REFILL_B,       // (re)start P1, S4 already open
  STATE_FILL_B,         // P1 running, waiting for F1 (high level)
  STATE_SAMPLE_B,       // 100-sample average at Point B
  STATE_DECIDE,         // evaluate S1/S2/S3 routing
  STATE_DRAIN_TO_REJECT,
  STATE_DRAIN_TO_PURIFIED,
  STATE_DRAIN_TO_RECYCLE,
  STATE_RECYCLE_FILLING,  // waiting for F3 to start P3
  STATE_RECYCLE_PUMPING,  // P3 running, waiting for F3 to clear (empty)
  STATE_DONE               // purified batch complete
};

SystemState state = STATE_INIT;

enum Route { ROUTE_NONE, ROUTE_S1_REJECT, ROUTE_S2_RECYCLE, ROUTE_S3_PURIFIED };

// ---- stored stable readings ----
float tdsA = 0, turbA = 0, tempA = 0;             // Point A baseline (one-shot)
float tdsB = 0, turbB = 0, tempB = 0, phB = 0;    // Point B (per cycle)
float prevTdsB = -1;                               // previous cycle's TDS_B, for % improvement
int   currentCycle = 0;

// ---- flow sensor pulse counting ----
volatile unsigned long flowPulseCount = 0;
void IRAM_ATTR flowISR() {
  flowPulseCount++;
}

// ============================================================================
// LOW-LEVEL HELPERS : relays, floats
// ============================================================================
void valveWrite(int pin, bool open) {
  bool level = VALVE_ACTIVE_LOW ? !open : open;
  digitalWrite(pin, level ? LOW : HIGH); // level==true means "energise" -> LOW when active-low
}
// valveWrite helper above is intentionally explicit; simplified wrapper below:
void openValve(int pin)  { digitalWrite(pin, VALVE_ACTIVE_LOW ? LOW  : HIGH); }
void closeValve(int pin) { digitalWrite(pin, VALVE_ACTIVE_LOW ? HIGH : LOW);  }

void startPump(int pin) { digitalWrite(pin, PUMP_ACTIVE_LOW ? LOW  : HIGH); }
void stopPump(int pin)  { digitalWrite(pin, PUMP_ACTIVE_LOW ? HIGH : LOW);  }

// Float switches: wired NO-to-GND with INPUT_PULLUP -> reads LOW when triggered.
bool floatTriggered(int pin) {
  return digitalRead(pin) == LOW;
}

// ============================================================================
// SENSOR RAW -> ENGINEERING UNIT CONVERSIONS
// TODO CALIBRATE ALL OF THESE — the PDF specifies thresholds in real units
// (pH, NTU, mg/L, deg C) but does not specify the sensor calibration curves.
// Placeholders below follow common Gravity/DFRobot-style analog sensor math.
// ============================================================================

float adcToVoltage(int adcPin) {
  int raw = analogRead(adcPin);           // 0-4095 on ESP32 (12-bit)
  return raw * (3.3f / 4095.0f);
}

float readTDS(int adcPin, float waterTempC) {
  float v = adcToVoltage(adcPin);
  // temperature compensation (25 C reference), typical Gravity TDS formula
  float compCoeff = 1.0f + 0.02f * (waterTempC - 25.0f);
  float compVoltage = v / compCoeff;
  float tds = (133.42f * compVoltage * compVoltage * compVoltage
               - 255.86f * compVoltage * compVoltage
               + 857.39f * compVoltage) * 0.5f;
  return tds < 0 ? 0 : tds; // mg/L
}

float readTurbidity(int adcPin) {
  float v = adcToVoltage(adcPin);
  // Placeholder quadratic mapping, clear-water ~3.3V -> ~0 NTU convention varies
  // by sensor; RECALIBRATE with turbidity standards for your probe.
  float ntu = -1120.4f * v * v + 5742.3f * v - 4352.9f;
  if (ntu < 0) ntu = 0;
  return ntu;
}

float readPH() {
  int16_t raw = ads.readADC_SingleEnded(PH_ADS_CHANNEL);
  float voltage = ads.computeVolts(raw); // volts
  // Placeholder DFRobot-style calibration: pH7 at NEUTRAL_V, slope below.
  const float NEUTRAL_V = 1.500f; // TODO CALIBRATE with pH 7 buffer
  const float SLOPE_V_PER_PH = -0.180f; // TODO CALIBRATE with pH 4/10 buffers
  float ph = 7.0f + (voltage - NEUTRAL_V) / SLOPE_V_PER_PH;
  return ph;
}

float readTempC(DallasTemperature &sensor) {
  sensor.requestTemperatures();
  float t = sensor.getTempCByIndex(0);
  if (t == DEVICE_DISCONNECTED_C) t = 25.0f; // fallback
  return t;
}

// ============================================================================
// SAMPLING ROUTINES — "100 samples over an interval, average -> stable reading"
// Blocking is acceptable here: nothing else needs concurrent servicing during
// these windows per the PDF sequence (P1/P2 are not running while sampling).
// ============================================================================

void samplePointA() {
  Serial.println(F("[Point A] Sampling 100 readings..."));
  double sumTds = 0, sumTurb = 0, sumTemp = 0;
  for (int i = 0; i < SAMPLE_COUNT; i++) {
    sumTemp += readTempC(tempSensorA);
    sumTds  += readTDS(PIN_TDS_A, sumTemp / (i + 1));
    sumTurb += readTurbidity(PIN_TURB_A);
    delay(SAMPLE_INTERVAL_MS);
  }
  tempA = sumTemp / SAMPLE_COUNT;
  tdsA  = sumTds  / SAMPLE_COUNT;
  turbA = sumTurb / SAMPLE_COUNT;
  Serial.printf("[Point A] STABLE -> TDS=%.1f mg/L  Turb=%.1f NTU  Temp=%.1f C\n",
                tdsA, turbA, tempA);
}

void samplePointB() {
  Serial.println(F("[Point B] Sampling 100 readings..."));
  double sumTds = 0, sumTurb = 0, sumTemp = 0, sumPh = 0;
  for (int i = 0; i < SAMPLE_COUNT; i++) {
    float t = readTempC(tempSensorB);
    sumTemp += t;
    sumTds  += readTDS(PIN_TDS_B, t);
    sumTurb += readTurbidity(PIN_TURB_B);
    sumPh   += readPH();
    delay(SAMPLE_INTERVAL_MS);
  }
  tempB = sumTemp / SAMPLE_COUNT;
  tdsB  = sumTds  / SAMPLE_COUNT;
  turbB = sumTurb / SAMPLE_COUNT;
  phB   = sumPh   / SAMPLE_COUNT;
  Serial.printf("[Point B] STABLE -> TDS=%.1f mg/L Turb=%.1f NTU Temp=%.1f C pH=%.2f\n",
                tdsB, turbB, tempB, phB);
}

// ============================================================================
// DECISION LOGIC  (PDF page 5)
// ============================================================================

// % improvement in successive cycles, based on TDS_B reduction.
// NOTE: PDF says this is computed on a "backend server" — replace this
// function with a network call if you need the exact backend algorithm.
float evaluateImprovementPct() {
  if (prevTdsB <= 0) return 100.0f; // first cycle: treat as fully improved
  if (prevTdsB == 0) return 0.0f;
  return ((prevTdsB - tdsB) / prevTdsB) * 100.0f;
}

int countTrue(bool a, bool b, bool c, bool d) {
  return (a?1:0) + (b?1:0) + (c?1:0) + (d?1:0);
}

Route evaluateRouting() {
  // ---- S3: purified conditions (need >=3 of 4) ----
  bool s3_ph   = (phB >= S3_PH_LOW && phB <= S3_PH_HIGH);
  bool s3_turb = (turbB <= S3_TURB_MAX);
  bool s3_tds  = (tdsB <= S3_TDS_MAX);
  bool s3_temp = (tempB >= S3_TEMP_LOW && tempB <= S3_TEMP_HIGH);
  bool s3ok = countTrue(s3_ph, s3_turb, s3_tds, s3_temp) >= 3;

  // ---- S1: reject conditions (stagnation OR cycle limit) ----
  float improvementPct = evaluateImprovementPct();
  bool s1_by_improvement = (currentCycle > 0) && (improvementPct <= IMPROVEMENT_THRESHOLD_PCT);
  bool s1_by_cycles = (currentCycle >= (MAX_CYCLE_COUNT + 1));
  bool s1ok = s1_by_improvement || s1_by_cycles;

  // ---- S2: recycle conditions (need >=3 of 4) ----
  bool s2_ph = (phB >= S2_PH_LOW1 && phB <= S2_PH_HIGH1) ||
               (phB >= S2_PH_LOW2 && phB <= S2_PH_HIGH2);
  bool s2_turb = (turbB > S2_TURB_LOW && turbB < S2_TURB_HIGH);
  bool s2_temp = (tempB >= S2_TEMP_LOW && tempB <= S2_TEMP_HIGH);
  bool s2_tds  = (tdsB >= S2_TDS_LOW && tdsB < S2_TDS_HIGH);
  bool s2ok = countTrue(s2_ph, s2_turb, s2_temp, s2_tds) >= 3;

  Serial.printf("[Decide] cycle=%d improvement=%.1f%% s3ok=%d s1ok=%d s2ok=%d\n",
                currentCycle, improvementPct, s3ok, s1ok, s2ok);

  prevTdsB = tdsB; // remember for next cycle's improvement calc

  // ---- Priority (ASSUMPTION — see notes): purified > reject > recycle > fallback reject
  if (s3ok) return ROUTE_S3_PURIFIED;
  if (s1ok) return ROUTE_S1_REJECT;
  if (s2ok) return ROUTE_S2_RECYCLE;
  return ROUTE_S1_REJECT; // ambiguous quality -> fail safe to reject
}

// ============================================================================
// SETUP
// ============================================================================
void setup() {
  Serial.begin(115200);
  delay(200);
  Serial.println(F("=== Water Purification Controller booting ==="));

  // Relay outputs
  pinMode(PIN_S4, OUTPUT); pinMode(PIN_S1, OUTPUT);
  pinMode(PIN_S2, OUTPUT); pinMode(PIN_S3, OUTPUT);
  pinMode(PIN_P1, OUTPUT); pinMode(PIN_P2, OUTPUT); pinMode(PIN_P3, OUTPUT);
  closeValve(PIN_S1); closeValve(PIN_S2); closeValve(PIN_S3); closeValve(PIN_S4);
  stopPump(PIN_P1); stopPump(PIN_P2); stopPump(PIN_P3);

  // Float switch inputs
  pinMode(PIN_F1, INPUT_PULLUP);
  pinMode(PIN_F2, INPUT_PULLUP);
  pinMode(PIN_F3, INPUT_PULLUP);

  // Flow sensor
  pinMode(PIN_FLOW, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(PIN_FLOW), flowISR, FALLING);

  // Temperature sensors
  tempSensorA.begin();
  tempSensorB.begin();

  // I2C / ADS1115 for pH
  Wire.begin(I2C_SDA, I2C_SCL);
  if (!ads.begin()) {
    Serial.println(F("WARNING: ADS1115 not found — pH readings will be invalid."));
  }
  ads.setGain(GAIN_ONE); // +/-4.096V range, adjust to your pH module's output swing

  state = STATE_INIT;
}

// ============================================================================
// MAIN LOOP — non-blocking state machine
// ============================================================================
void loop() {
  switch (state) {

    // ---- Power-on: S4 opens immediately, then take Point A baseline once ----
    case STATE_INIT:
      Serial.println(F("[State] INIT — opening S4 (inlet supply valve)"));
      openValve(PIN_S4);
      closeValve(PIN_S1); closeValve(PIN_S2); closeValve(PIN_S3);
      stopPump(PIN_P2); stopPump(PIN_P3);
      currentCycle = 0;
      prevTdsB = -1;
      state = STATE_SAMPLE_A;
      break;

    case STATE_SAMPLE_A:
      samplePointA(); // one-shot baseline; not repeated in later cycles
      state = STATE_REFILL_B;
      break;

    // ---- Start / restart feed pump P1 (fires on power-up and each time
    //      S4 re-opens after a recycle pass) ----
    case STATE_REFILL_B:
      Serial.println(F("[State] Starting P1 (feed pump)"));
      startPump(PIN_P1);
      state = STATE_FILL_B;
      break;

    // ---- P1 runs until Point B tank hits HIGH level float F1 ----
    case STATE_FILL_B:
      if (floatTriggered(PIN_F1)) {
        Serial.println(F("[State] F1 (high level) reached — stopping P1"));
        stopPump(PIN_P1);
        state = STATE_SAMPLE_B;
      }
      break;

    case STATE_SAMPLE_B:
      samplePointB();
      state = STATE_DECIDE;
      break;

    case STATE_DECIDE: {
      Route route = evaluateRouting();
      closeValve(PIN_S1); closeValve(PIN_S2); closeValve(PIN_S3);

      if (route == ROUTE_S3_PURIFIED) {
        Serial.println(F("[Decide] -> S3 OPEN (purified)"));
        openValve(PIN_S3);
        state = STATE_DRAIN_TO_PURIFIED;
      } else if (route == ROUTE_S1_REJECT) {
        Serial.println(F("[Decide] -> S1 OPEN (reject)"));
        openValve(PIN_S1);
        state = STATE_DRAIN_TO_REJECT;
      } else {
        Serial.println(F("[Decide] -> S2 OPEN (recycle)"));
        openValve(PIN_S2);
        state = STATE_DRAIN_TO_RECYCLE;
      }
      // P2 starts whenever any of S1/S2/S3 opens (page 4)
      startPump(PIN_P2);
      break;
    }

    // ---- Draining Point B tank to REJECT tank until F2 (low level) ----
    case STATE_DRAIN_TO_REJECT:
      if (floatTriggered(PIN_F2)) {
        Serial.println(F("[State] F2 reached — reject drain complete"));
        stopPump(PIN_P2);
        closeValve(PIN_S1);
        // Loop back for the next batch (S4 already open, raw tank assumed refillable)
        state = STATE_REFILL_B;
      }
      break;

    // ---- Draining Point B tank to PURIFIED tank until F2 (low level) ----
    case STATE_DRAIN_TO_PURIFIED:
      if (floatTriggered(PIN_F2)) {
        Serial.println(F("[State] F2 reached — purified drain complete"));
        stopPump(PIN_P2);
        closeValve(PIN_S3);
        state = STATE_DONE;
      }
      break;

    // ---- Draining Point B tank to RECYCLE tank until F2, then wait for
    //      recycle tank to fill (F3) before starting P3 ----
    case STATE_DRAIN_TO_RECYCLE:
      if (floatTriggered(PIN_F2)) {
        stopPump(PIN_P2); // Point B tank empty; keep S2 open, wait for F3
      }
      if (floatTriggered(PIN_F3)) {
        Serial.println(F("[State] F3 reached — starting P3, closing S4"));
        startPump(PIN_P3);
        closeValve(PIN_S4); // S4 closes when recycle pump P3 starts
        state = STATE_RECYCLE_PUMPING;
      }
      break;

    // ---- P3 pumps recycle-tank water back into the feed line until the
    //      recycle tank's low-level float F3 clears (tank empty) ----
    case STATE_RECYCLE_PUMPING:
      if (!floatTriggered(PIN_F3)) {
        Serial.println(F("[State] Recycle tank empty — stopping P3, reopening S4"));
        stopPump(PIN_P3);
        openValve(PIN_S4);
        closeValve(PIN_S2);
        currentCycle++;
        state = STATE_REFILL_B; // run the recycled batch through the filters again
      }
      break;

    // ---- Purified batch complete ----
    case STATE_DONE:
      Serial.println(F("[State] DONE — purified batch delivered."));
      // Auto-restart for continuous operation. Remove this block if you want
      // the system to idle here until manually reset.
      delay(2000);
      state = STATE_INIT;
      break;
  }

  // Lightweight periodic flow-total log (does not affect control logic)
  static unsigned long lastFlowLog = 0;
  if (millis() - lastFlowLog > 5000) {
    lastFlowLog = millis();
    noInterrupts();
    unsigned long pulses = flowPulseCount;
    interrupts();
    float litres = pulses / FLOW_PULSES_PER_LITRE;
    Serial.printf("[Flow] total pulses=%lu (%.2f L)\n", pulses, litres);
  }
}
