import { GroundPlacement } from "./GroundPlacement";
import StateMachine from "SpectaclesInteractionKit/Utils/StateMachine";
import { ScreenLogger } from "./ScreenLogger";
import { PhoneController } from "./MotionController";
import { LSTween } from "./LSTween/LSTween";
import {
  setTimeout,
  clearTimeout,
} from "./SpectaclesInteractionKit/Utils/debounce";

enum States {
  INTRO = "Intro",
  FLOOR_CALIBRATION = "FloorCalibration",
  PHONE_CALIBRATION = "PhoneCalibration",
  SET_HAND_HEIGHT = "SetHandHeight",
  PHONE_IN_POCKET = "PhoneInPocket",
  FOLLOW = "Follow",
}

@component
export class NewScript extends BaseScriptComponent {
  @input camObject: SceneObject;
  @input instructionText: Text;
  @input groundPlacement: GroundPlacement;
  @input textContainer: SceneObject;
  @allowUndefined
  @input
  audioPlayer: AudioComponent;

  @input phoneController: PhoneController;

  private stateMachine: StateMachine;
  private handPosition: vec3;
  private groundPosition: vec3;
  private groundRotation: quat;
  onAwake() {
    this.textContainer.enabled = false;
    this.instructionText.text = "";
    this.instructionText.enabled = false;
    this.stateMachine = new StateMachine("GameStateMachine");
  }

  private setUpStateMachine(stateMachine: StateMachine) {
    stateMachine.addState({
      name: States.INTRO,
      onEnter(state) {
        this.textContainer.enabled = true;
        this.instructionText.enabled = true;
        this.instructionText.text = "look at the ground to start";
        this.groundPlacement.startSurfaceDetection((pos, rot) => {
          this.textContainer.enabled = false;
          this.instructionText.enabled = false;
          this.instructionText.text = "";

          this.groundPosition = pos;
          this.groundRotation = rot;

          ScreenLogger.getInstance().log("Ground Y " + this.groundPosition.y);

          stateMachine.sendSignal(States.PHONE_CALIBRATION);
        });
      },
      transitions: [
        {
          nextStateName: States.PHONE_CALIBRATION,
          checkOnSignal(signal) {
            return signal === States.PHONE_CALIBRATION;
          },
          onExecution() {},
        },
      ],
    });

    stateMachine.addState({
      name: States.PHONE_CALIBRATION,
      onEnter(state) {
        // enable to text telling user to begin phone calibration
        this.instructionText.enabled = true;
        this.instructionText.text =
          "Enable Phone Controller mode within your Spectacles App";

        this.phoneController.setOnPhoneTrackingStateChange((val) => {
          if (val) {
            // disable text
            this.instructionText.enabled = false;
            this.instructionText.text = "";

            stateMachine.sendSignal(States.SET_HAND_HEIGHT);
          }
        });
      },
      transitions: [
        {
          nextStateName: States.SET_HAND_HEIGHT,
          checkOnSignal(signal) {
            this.phoneController.clearOnPhoneTrackingStateChange();
            return signal === States.SET_HAND_HEIGHT;
          },
        },
      ],
    });

    stateMachine.addState({
      name: States.SET_HAND_HEIGHT,
      onEnter(state) {
        // show text instructions telling user to hold their phone in their hand at their side
        this.instructionText.enabled = true;
        this.instructionText.text =
          "Hold your phone in your hand, and hold your hand down at your side";

        setTimeout(() => {
          // get transform from motion controller
          this.handPosition = this.phoneController
            .getTransform()
            .getWorldPosition();

          ScreenLogger.getInstance().log("Hand Y " + this.handPosition.y);
        }, 5000);
      },
      transitions: [
        {
          nextStateName: States.PHONE_IN_POCKET,
          checkOnSignal(signal) {
            return signal === States.PHONE_IN_POCKET;
          },
        },
      ],
    });
  }
}
