import { ScreenLogger } from "./ScreenLogger";

@component
export class HeadData extends BaseScriptComponent {
  @input camObject: SceneObject;

  private headStartPosition: vec3 | null = null;
  private currentHeadRotation: quat;
  private updateEvent: LateUpdateEvent;
  private frameCount: number = 0;
  private frameSkip: number = 100;
  onAwake() {}

  setHeadStartPosition(pos: vec3) {
    this.headStartPosition = pos;
  }

  getHeadStartPosition() {
    return this.headStartPosition;
  }

  setCurrentHeadRotation(rot: quat) {
    this.currentHeadRotation = rot;
  }

  getCurrentHeadRotation() {
    return this.currentHeadRotation;
  }

  startTracking(pos: vec3) {
    this.headStartPosition = pos;
    this.updateEvent = this.createEvent("LateUpdateEvent");
    this.updateEvent.bind(this.onLateUpdate.bind(this));
    this.updateEvent.enabled = true;
  }

  onLateUpdate() {
    this.frameCount++;
    if (this.frameCount % this.frameSkip !== 0) return;

    this.setCurrentHeadRotation(
      this.camObject.getTransform().getWorldRotation()
    );

    if (!this.headStartPosition) return;

    // log the Y distance from start pos Y
    const distance =
      this.headStartPosition.y -
      this.camObject.getTransform().getWorldPosition().y;

    ScreenLogger.getInstance().log("Y Distance from head start: " + distance);
  }
}
