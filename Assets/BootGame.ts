import { GroundPlacement } from "./GroundPlacement";
import StateMachine from "SpectaclesInteractionKit/Utils/StateMachine";
import { ScreenLogger } from "./ScreenLogger";
import { PhoneController } from "./MotionController";
import { LSTween } from "./LSTween/LSTween";
import {
  setTimeout,
  clearTimeout,
} from "./SpectaclesInteractionKit/Utils/debounce";

type StateMachineConfig = {
  stateMachine: StateMachine;
  textContainer: SceneObject;
  instructionText: Text;
  groundPlacement: GroundPlacement;
  phoneController: PhoneController;
  audioPlayer?: AudioComponent;
};

enum States {
  INTRO = "Intro",
  GROUND_CALIBRATION = "GroundCalibration",
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

    const config: StateMachineConfig = {
      stateMachine: this.stateMachine,
      textContainer: this.textContainer,
      instructionText: this.instructionText,
      groundPlacement: this.groundPlacement,
      phoneController: this.phoneController,
    };

    this.setUpStateMachine(config);
    this.stateMachine.enterState(States.GROUND_CALIBRATION);
  }

  private setUpStateMachine = (config: StateMachineConfig) => {
    const {
      stateMachine,
      textContainer,
      instructionText,
      groundPlacement,
      phoneController,
    } = config;
    stateMachine.addState({
      name: States.GROUND_CALIBRATION,
      onEnter: (state) => {
        textContainer.enabled = true;
        instructionText.enabled = true;
        instructionText.text = "look at the ground to start";
        groundPlacement.startSurfaceDetection((pos, rot) => {
          textContainer.enabled = false;
          instructionText.enabled = false;
          instructionText.text = "";

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
      onEnter: (state) => {
        // enable to text telling user to begin phone calibration
        this.textContainer.enabled = true;
        this.instructionText.enabled = true;
        this.instructionText.text =
          "Enable Phone Controller mode within your Spectacles App";

        phoneController.setOnPhoneTrackingStateChange((val) => {
          // disable text
          ScreenLogger.getInstance().log("Phone Tracking State Change " + val);
          this.instructionText.text = "";
          this.instructionText.enabled = false;

          textContainer.enabled = false;

          stateMachine.sendSignal(States.SET_HAND_HEIGHT);
        });
      },
      transitions: [
        {
          nextStateName: States.SET_HAND_HEIGHT,
          checkOnSignal(signal) {
            //this.phoneController.clearOnPhoneTrackingStateChange();
            return signal === States.SET_HAND_HEIGHT;
          },
        },
      ],
    });

    stateMachine.addState({
      name: States.SET_HAND_HEIGHT,
      onEnter: (state) => {
        // show text instructions telling user to hold their phone in their hand at their side
        textContainer.enabled = true;
        this.instructionText.enabled = true;
        this.instructionText.text =
          "Hold your phone in your hand, and hold your hand down at your side";

        // when phone is in position trigger timeout?
        // Add a confirm button?

        // setTimeout(() => {
        //   // get transform from motion controller
        //   this.handPosition = this.phoneController
        //     .getTransform()
        //     .getWorldPosition();

        //   ScreenLogger.getInstance().log("Hand Y " + this.handPosition.y);
        // }, 5000);
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
  };
}
