const MotionControllerModule = require("LensStudio:MotionControllerModule");

import { ScreenLogger } from "./ScreenLogger";

@component
export class PhoneController extends BaseScriptComponent {
  private transform;
  private controller;
  private onPhoneTrackingStateChange: (val: boolean) => void;
  public isPhoneTracking: boolean = false;
  onAwake() {
    var options = MotionController.Options.create();

    options.motionType = MotionController.MotionType.SixDoF;

    this.controller = MotionControllerModule.getController(options);

    this.transform = this.sceneObject.getTransform();
    this.controller.onTransformEvent.add(this.updateTransform.bind(this));

    this.controller.onControllerStateChange.add(
      this.trackingStateChange.bind(this)
    );
  }

  updateTransform(position, rotation) {
    this.transform.setWorldPosition(position);
    this.transform.setWorldRotation(rotation);
  }

  trackingStateChange(val) {
    this.isPhoneTracking = val;
    ScreenLogger.getInstance().log("isTracking " + val);

    if (this.onPhoneTrackingStateChange) {
      this.onPhoneTrackingStateChange(this.isPhoneTracking);
    }
  }

  setOnPhoneTrackingStateChange(callback: (val: boolean) => void) {
    this.onPhoneTrackingStateChange = callback;
  }

  clearOnPhoneTrackingStateChange() {
    this.onPhoneTrackingStateChange = null;
  }
}
