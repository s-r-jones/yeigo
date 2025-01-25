import { ScreenLogger } from "./ScreenLogger";
import { lerp } from "./SpectaclesInteractionKit/Utils/mathUtils";

@component
export class HeadData extends BaseScriptComponent {
  @input camObject: SceneObject;
  @input warningUI: SceneObject;
  @input distanceThreshold: number = -7;

  private headStartPosition: vec3 | null = null;
  private currentHeadRotation: quat;
  private updateEvent: LateUpdateEvent;
  private frameCount: number = 0;
  private frameSkip: number = 30;
  private showingWarningUI: boolean = false;
  public headDistanceFromStart: number = 0;

  private outOfRangeCallback: () => void | null = null;

  onAwake() {}

  setOutOfRangeCallback(callback: () => void) {
    this.outOfRangeCallback = callback;
  }

  clearOutOfRangeCallback() {
    this.outOfRangeCallback = null;
  }

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
    ScreenLogger.getInstance().log("Starting head tracking");
    this.headStartPosition = pos;
    this.updateEvent = this.createEvent("LateUpdateEvent");
    this.updateEvent.bind(this.onLateUpdate.bind(this));
    this.updateEvent.enabled = true;
  }

  onLateUpdate = () => {
    this.frameCount++;
    if (this.frameCount % this.frameSkip !== 0) return;

    this.setCurrentHeadRotation(
      this.camObject.getTransform().getWorldRotation()
    );

    if (!this.headStartPosition) return;

    // log the Y distance from start pos Y
    const distance =
      this.camObject.getTransform().getWorldPosition().y -
      this.headStartPosition.y;

    this.headDistanceFromStart = distance;

    if (distance < this.distanceThreshold && !this.showingWarningUI) {
      this.showingWarningUI = true;
      this.warningUI.enabled = true;
    } else if (distance >= this.distanceThreshold && this.showingWarningUI) {
      this.showingWarningUI = false;
      this.warningUI.enabled = false;
    }

    if (this.showingWarningUI) {
      const pos = lerpVec3(
        this.warningUI.getTransform().getWorldPosition(),
        this.camObject.getTransform().getWorldPosition(),
        0.5
      );
      this.warningUI.getTransform().setWorldPosition(pos);
      // rotate warning UI to face camera

      // slerp warning rotation to camera rotation
      const rot = quat.slerp(
        this.warningUI.getTransform().getWorldRotation(),
        this.camObject.getTransform().getWorldRotation(),
        0.5
      );
      this.warningUI.getTransform().setWorldRotation(rot);
    }

    // place warning UI several cm's in front of camera
  };
}

function lerpVec3(a: vec3, b: vec3, t: number) {
  // use imported lerp to lerp between two vec3s
  // need a lerp for each component
  return new vec3(lerp(a.x, b.x, t), lerp(a.y, b.y, t), lerp(a.z, b.z, t));
}
