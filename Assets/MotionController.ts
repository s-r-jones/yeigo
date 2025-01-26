const MotionControllerModule = require("LensStudio:MotionControllerModule");

import { ScreenLogger } from "./ScreenLogger";

@component
export class PhoneController extends BaseScriptComponent {
  private transform;
  private started = false;
  private controller;
  private onPhoneTrackingStarted: (val?: boolean) => void | null = null;
  public isPhoneTracking: boolean = false;
  onAwake() {
    var options = MotionController.Options.create();

    options.motionType = MotionController.MotionType.SixDoF;

    this.controller = MotionControllerModule.getController(options);

    this.transform = this.sceneObject.getTransform();
    this.controller.onTransformEvent.add(this.updateTransform.bind(this));
  }

  updateTransform(position, rotation) {
    this.transform.setWorldPosition(position);
    this.transform.setWorldRotation(rotation);
    if (!this.started) {
      this.started = true;

      this.onPhoneTrackingStarted(true);
    }
  }

  trackingStateChange(val) {
    this.isPhoneTracking = val;
    //ScreenLogger.getInstance().log("isTracking " + val);

    if (this.onPhoneTrackingStarted !== null) {
      this.onPhoneTrackingStarted();
    }
  }

  setOnPhoneTrackingStateChange(callback: (val?: boolean) => void) {
    // ScreenLogger.getInstance().log("Setting onPhoneTrackingStateChange");
    this.onPhoneTrackingStarted = callback;
  }

  clearOnPhoneTrackingStateChange() {
    this.controller.onControllerStateChange.remove(this.onPhoneTrackingStarted);
  }
}
