import { GroundPlacement } from "./GroundPlacement";
import StateMachine from "SpectaclesInteractionKit/Utils/StateMachine";
import { ScreenLogger } from "./ScreenLogger";
import { PhoneController } from "./MotionController";
import { HeadData } from "./HeadData";
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
  GET_WALKER = "GetWalker",
  STAND_STRAIGHT = "StandStraight",
  DONT_LEAN = "DontLean",
}

@component
export class NewScript extends BaseScriptComponent {
  @input calibrationUISteps: SceneObject[];
  @input camObject: SceneObject;
  @input instructionText: Text;
  @input groundPlacement: GroundPlacement;
  @input textContainer: SceneObject;
  @input headData: HeadData;
  @allowUndefined
  @input
  audioPlayer: AudioComponent;

  @input phoneController: PhoneController;

  @input walkerMarker: SceneObject;

  private stateMachine: StateMachine;
  private handPosition: vec3;
  private groundPosition: vec3;
  private groundRotation: quat;
  private cameraStartPosition: vec3;
  private trackHead: boolean = false;

  onAwake() {
    this.textContainer.enabled = false;
    this.instructionText.text = "";
    this.instructionText.enabled = false;
    this.stateMachine = new StateMachine("GameStateMachine");
    this.walkerMarker.enabled = false;

    // didnt really need to do this, oh well
    const config: StateMachineConfig = {
      stateMachine: this.stateMachine,
      textContainer: this.textContainer,
      instructionText: this.instructionText,
      groundPlacement: this.groundPlacement,
      phoneController: this.phoneController,
    };

    this.setUpStateMachine(config);
    this.stateMachine.enterState(States.PHONE_CALIBRATION);
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
        this.calibrationUISteps[0].enabled = true;

        phoneController.setOnPhoneTrackingStateChange((val) => {
          // disable text
          ScreenLogger.getInstance().log("Phone Tracking State Change " + val);

          stateMachine.sendSignal(States.SET_HAND_HEIGHT);
        });
      },
      transitions: [
        {
          nextStateName: States.SET_HAND_HEIGHT,
          checkOnSignal(signal) {
            return signal === States.SET_HAND_HEIGHT;
          },
          onExecution() {
            // this.phoneController.clearOnPhoneTrackingStateChange();
            this.calibrationUISteps[0].enabled = false;
          },
        },
      ],
    });

    // stateMachine.addState({
    //   name: States.SET_HAND_HEIGHT,
    //   onEnter: (state) => {
    //     // show text instructions telling user to hold their phone in their hand at their side
    //     this.calibrationUISteps[1].enabled = true;

    //     // when phone is in position trigger timeout?
    //     // Add a confirm button?

    //     setTimeout(() => {
    //       // get transform from motion controller
    //       this.handPosition = this.phoneController
    //         .getTransform()
    //         .getWorldPosition()
    //         .add(new vec3(0, 10, -5));

    //       this.walkerMarker.getTransform().setWorldPosition(this.handPosition);

    //       this.walkerMarker.enabled = true;

    //       stateMachine.sendSignal(States.PHONE_IN_POCKET);
    //     }, 15000);
    //   },
    //   transitions: [
    //     {
    //       nextStateName: States.PHONE_IN_POCKET,
    //       checkOnSignal(signal) {
    //         return signal === States.PHONE_IN_POCKET;
    //       },
    //       onExecution() {
    //         this.calibrationUISteps[1].enabled = false;
    //       },
    //     },
    //   ],
    // });

    // stateMachine.addState({
    //   name: States.PHONE_IN_POCKET,
    //   onEnter: (state) => {
    //     // show text instructions telling user to put their phone in their pocket
    //     this.calibrationUISteps[2].enabled = true;

    //     setTimeout(() => {
    //       stateMachine.sendSignal(States.GET_WALKER);
    //     }, 5000);
    //   },
    //   transitions: [
    //     {
    //       nextStateName: States.GET_WALKER,
    //       checkOnSignal(signal) {
    //         return signal === States.GET_WALKER;
    //       },
    //       onExecution() {
    //         this.calibrationUISteps[2].enabled = false;
    //       },
    //     },
    //   ],
    // });

    // stateMachine.addState({
    //   name: States.GET_WALKER,
    //   onEnter: () => {
    //     this.calibrationUISteps[3].enabled = true;
    //   },
    //   transitions: [
    //     {
    //       nextStateName: States.STAND_STRAIGHT,
    //       checkOnSignal(signal) {
    //         return signal === States.STAND_STRAIGHT;
    //       },
    //       onExecution() {
    //         this.calibrationUISteps[3].enabled = false;
    //       },
    //     },
    //   ],
    // });

    // stateMachine.addState({
    //   name: States.STAND_STRAIGHT,
    //   onEnter: () => {
    //     this.calibrationUISteps[4].enabled = true;
    //   },
    //   transitions: [
    //     {
    //       nextStateName: States.DONT_LEAN,
    //       checkOnSignal(signal) {
    //         return signal === States.DONT_LEAN;
    //       },
    //       onExecution() {
    //         this.calibrationUISteps[4].enabled = false;
    //       },
    //     },
    //   ],
    // });

    // stateMachine.addState({
    //   name: States.DONT_LEAN,
    //   onEnter: () => {
    //     this.calibrationUISteps[5].enabled = true;
    //   },
    //   transitions: [
    //     {
    //       nextStateName: States.FOLLOW,
    //       checkOnSignal(signal) {
    //         return signal === States.FOLLOW;
    //       },
    //       onExecution() {
    //         this.calibrationUISteps[5].enabled = false;
    //       },
    //     },
    //   ],
    // });

    // stateMachine.addState({
    //   name: States.FOLLOW,
    //   onEnter: () => {
    //     // consider adding this to prev state transition onExecte
    //     this.cameraStartPosition = this.camObject
    //       .getTransform()
    //       .getWorldPosition();

    //     this.headData.startTracking(this.cameraStartPosition);
    //     textContainer.enabled = true;
    //     this.instructionText.enabled = true;
    //     this.instructionText.text = "Grab the walker and follow the path";

    //     // show ui 4 and then 5
    //   },
    // });
  };
}
