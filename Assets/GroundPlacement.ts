import { SurfaceDetection } from "./SurfaceDetection";
import { ScreenLogger } from "./ScreenLogger";

@component
export class GroundPlacement extends BaseScriptComponent {
  @input
  @allowUndefined
  objectVisuals: SceneObject;

  @input
  @allowUndefined
  surfaceDetection: SurfaceDetection;

  private cubeTrans;

  onAwake() {
    this.cubeTrans = this.getSceneObject().getTransform();

    // this.createEvent("OnStartEvent").bind(() => {
    //   this.startSurfaceDetection();
    // });
  }

  public startSurfaceDetection(cb?: (pos: vec3, rot: quat) => void) {
    this.objectVisuals.enabled = false;
    this.surfaceDetection.startGroundCalibration((pos, rot) => {
      this.onSurfaceDetected(pos, rot);
      if (cb) {
        cb(pos, rot);
      }
    });
  }

  private onSurfaceDetected(pos: vec3, rot: quat) {
    this.objectVisuals.enabled = true;
    this.cubeTrans.setWorldPosition(pos);
    this.cubeTrans.setWorldRotation(rot);
    //Instance().log("Surface detected");
  }
}
