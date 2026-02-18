/**
 * LivenessDetector State Machine for Glow Protocol
 *
 * Handles the logic for face liveness detection challenges (blink, head turns, etc.)
 * to prevent spoofing attacks (photo-of-photo, screen replay).
 */

export type LivenessState =
  | "idle"
  | "challenging"
  | "passed"
  | "failed"
  | "timeout";

export type LivenessChallenge =
  | "blink"
  | "turn_left"
  | "turn_right"
  | "nod"
  | "smile";

export interface LivenessConfig {
  timeoutMs: number;
  blinkThreshold: number;
  headTurnThreshold: number;
  smileThreshold: number;
}

/**
 * Normalized face result for liveness detection.
 * Maps from platform-specific detectors (MLKit, face-api.js).
 */
export interface LivenessFaceResult {
  leftEyeOpenProbability?: number;
  rightEyeOpenProbability?: number;
  yawAngle?: number; // head turn left/right (degrees)
  pitchAngle?: number; // head nod up/down (degrees)
  smilingProbability?: number;
}

export class LivenessDetector {
  private state: LivenessState = "idle";
  private currentChallenge: LivenessChallenge | null = null;
  private challenges: LivenessChallenge[] = [];
  private completedChallenges: LivenessChallenge[] = [];
  private config: LivenessConfig;
  private timer: any | null = null;
  private blinkFrames = 0;
  private readonly REQUIRED_BLINK_FRAMES = 2;

  constructor(config: Partial<LivenessConfig> = {}) {
    this.config = {
      timeoutMs: config.timeoutMs || 15000,
      blinkThreshold: config.blinkThreshold || 0.3,
      headTurnThreshold: config.headTurnThreshold || 20,
      smileThreshold: config.smileThreshold || 0.7,
    };
  }

  /**
   * Start a liveness detection sequence
   */
  public start(
    challenges: LivenessChallenge[] = ["blink", "turn_left", "turn_right"]
  ) {
    this.state = "challenging";
    this.challenges = [...challenges];
    this.completedChallenges = [];
    this.nextChallenge();
  }

  private nextChallenge() {
    if (this.completedChallenges.length === this.challenges.length) {
      this.state = "passed";
      this.stopTimer();
      this.currentChallenge = null;
      return;
    }

    const remaining = this.challenges.filter(
      (c) => !this.completedChallenges.includes(c)
    );
    // Randomize the next challenge to prevent predictable replay attacks
    this.currentChallenge =
      remaining[Math.floor(Math.random() * remaining.length)];
    this.resetChallengeState();
    this.startTimer();
  }

  private resetChallengeState() {
    this.blinkFrames = 0;
  }

  private startTimer() {
    this.stopTimer();
    this.timer = setTimeout(() => {
      if (this.state === "challenging") {
        this.state = "timeout";
      }
    }, this.config.timeoutMs);
  }

  private stopTimer() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  /**
   * Update the detector with a new face result from the camera frame.
   * Returns the current state of the detector.
   */
  public update(face: LivenessFaceResult): LivenessState {
    if (this.state !== "challenging" || !this.currentChallenge) {
      return this.state;
    }

    const isPassed = this.checkChallenge(face);
    if (isPassed) {
      this.completedChallenges.push(this.currentChallenge);
      this.nextChallenge();
    }

    return this.state;
  }

  private checkChallenge(face: LivenessFaceResult): boolean {
    switch (this.currentChallenge) {
      case "blink":
        // Blink detection: eyes must be closed for X frames then opened
        const isClosed =
          (face.leftEyeOpenProbability ?? 1) < this.config.blinkThreshold &&
          (face.rightEyeOpenProbability ?? 1) < this.config.blinkThreshold;

        if (isClosed) {
          this.blinkFrames++;
        } else if (this.blinkFrames >= this.REQUIRED_BLINK_FRAMES) {
          // If they were closed long enough and now they are open (since isClosed is false)
          return true;
        }
        return false;

      case "turn_left":
        return (face.yawAngle ?? 0) > this.config.headTurnThreshold;

      case "turn_right":
        return (face.yawAngle ?? 0) < -this.config.headTurnThreshold;

      case "nod":
        return Math.abs(face.pitchAngle ?? 0) > this.config.headTurnThreshold;

      case "smile":
        return (face.smilingProbability ?? 0) > this.config.smileThreshold;

      default:
        return false;
    }
  }

  /**
   * Reset the detector to idle state
   */
  public reset() {
    this.stopTimer();
    this.state = "idle";
    this.currentChallenge = null;
    this.challenges = [];
    this.completedChallenges = [];
  }

  /**
   * Get the current state and progress
   */
  public getStatus() {
    return {
      state: this.state,
      currentChallenge: this.currentChallenge,
      progress:
        this.challenges.length > 0
          ? this.completedChallenges.length / this.challenges.length
          : 0,
      completed: [...this.completedChallenges],
      remaining: this.challenges.filter(
        (c) => !this.completedChallenges.includes(c)
      ),
    };
  }
}
