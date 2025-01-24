import { GroundPlacement } from "./GroundPlacement";
import StateMachine from "SpectaclesInteractionKit/Utils/StateMachine";
import { ScreenLogger } from "./ScreenLogger";
import { PhoneController } from "./MotionController";
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
  @input instructionText: Text;
  @input groundPlacement: GroundPlacement;
  @input textContainer: SceneObject;
  @allowUndefined
  @input
  audioPlayer: AudioComponent;

  @input phoneController: PhoneController;

  private stateMachine: StateMachine;
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
        this.groundPlacement.startSurfaceDetection(() => {
          this.textContainer.enabled = false;
          this.instructionText.enabled = false;
          this.instructionText.text = "";

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
  }
}
