#define S4 2
#define S1 25
#define S2 26
#define S3 19

#define P1 27
#define P2 14
#define P3 13

#define F3 23

void setup()
{
  pinMode(S4, OUTPUT);
  pinMode(S1, OUTPUT);
  pinMode(S2, OUTPUT);
  pinMode(S3, OUTPUT);

  pinMode(P1, OUTPUT);
  pinMode(P2, OUTPUT);
  pinMode(P3, OUTPUT);

  pinMode(F3, INPUT_PULLUP);

  // -------------------------------
  // Initial state
  // -------------------------------
  digitalWrite(S1, HIGH);   // CLOSED
  digitalWrite(S2, HIGH);   // CLOSED
  digitalWrite(S3, HIGH);   // CLOSED
  digitalWrite(S4, HIGH);   // CLOSED

  digitalWrite(P1, HIGH);   // OFF
  digitalWrite(P2, HIGH);   // OFF
  digitalWrite(P3, HIGH);   // OFF

  delay(1000);

  // =================================================
  // INITIAL FILL
  // S4 OPEN + P1 ON
  // =================================================

  digitalWrite(S4, LOW);
  digitalWrite(P1, LOW);

  delay(38000);

  digitalWrite(S4, HIGH);   // S4 CLOSED
  digitalWrite(P1, HIGH);   // P1 OFF


  // =================================================
  // LOOP 1
  // S3 OPEN + P2 ON
  // =================================================

  digitalWrite(S3, LOW);
  digitalWrite(P2, LOW);

  delay(20000);

  digitalWrite(P2, HIGH);   // P2 OFF
  digitalWrite(S3, HIGH);   // S3 CLOSED


  // =================================================
  // FILL AGAIN
  // S4 OPEN + P1 ON
  // =================================================

  digitalWrite(S4, LOW);
  digitalWrite(P1, LOW);

  delay(38000);

  digitalWrite(S4, HIGH);   // S4 CLOSED
  digitalWrite(P1, HIGH);   // P1 OFF


  // =================================================
  // LOOP 2
  // S1 OPEN + P2 ON
  // =================================================

  digitalWrite(S1, LOW);
  digitalWrite(P2, LOW);

  delay(20000);

  digitalWrite(P2, HIGH);   // P2 OFF
  digitalWrite(S1, HIGH);   // S1 CLOSED


  // =================================================
  // FILL AGAIN
  // S4 OPEN + P1 ON
  // =================================================

  digitalWrite(S4, LOW);
  digitalWrite(P1, LOW);

  delay(38000);

  digitalWrite(S4, HIGH);   // S4 CLOSED
  digitalWrite(P1, HIGH);   // P1 OFF


  // =================================================
  // LOOP 3
  // S2 OPEN + P2 ON
  // =================================================

  digitalWrite(S2, LOW);
  digitalWrite(P2, LOW);

  // P3 starts after 8 seconds 
  delay(8000); 

  digitalWrite(P3, LOW);    // P3 ON

 

  // P2 continues for remaining 28 seconds  
  delay(28000);  

  // Finish Loop 3
  digitalWrite(P2, HIGH);   // P2 OFF
digitalWrite(P3, HIGH);   // P3 OFF
  digitalWrite(S2, HIGH);   // S2 CLOSED
}

void loop()
{
  // Sequence complete
}