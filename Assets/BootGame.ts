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
import { AudioFiles } from "./AudioFiles";

type StateMachineConfig = {
  stateMachine: StateMachine;
  textContainer: SceneObject;
  instructionText: Text;
  groundPlacement: GroundPlacement;
  phoneController: PhoneController;
  audioPlayer: AudioComponent;
  calibrationUISteps: SceneObject[];
  englishAudioFiles: AudioFiles;
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

  @input englishAudioFiles: AudioFiles;

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
      calibrationUISteps: this.calibrationUISteps,
      englishAudioFiles: this.englishAudioFiles,
      audioPlayer: this.audioPlayer,
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
      calibrationUISteps,
      audioPlayer,
      englishAudioFiles,
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
        audioPlayer.audioTrack = englishAudioFiles.getTracks()[0];
        audioPlayer.setOnFinish(() => {
          audioPlayer.audioTrack = englishAudioFiles.getTracks()[1];
          audioPlayer.play(1);
          audioPlayer.setOnFinish(() => null);
        });
        audioPlayer.play(1);

        calibrationUISteps[0].enabled = true;

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
            //phoneController.clearOnPhoneTrackingStateChange();
            calibrationUISteps[0].enabled = false;
            audioPlayer.pause();
          },
        },
      ],
    });

    stateMachine.addState({
      name: States.SET_HAND_HEIGHT,
      onEnter: (state) => {
        // show text instructions telling user to hold their phone in their hand at their side
        calibrationUISteps[1].enabled = true;
        audioPlayer.audioTrack = englishAudioFiles.getTracks()[2];
        audioPlayer.setOnFinish(() => {
          setTimeout(() => {
            // get transform from motion controller
            this.handPosition = this.phoneController
              .getTransform()
              .getWorldPosition()
              .add(new vec3(0, 10, -5));
            this.walkerMarker
              .getTransform()
              .setWorldPosition(this.handPosition);
            this.walkerMarker.enabled = true;
            stateMachine.sendSignal(States.PHONE_IN_POCKET);
          }, 5000);

          audioPlayer.setOnFinish(() => null);
        });
        audioPlayer.play(1);
        // when phone is in position trigger timeout?
        // Add a confirm button?
      },
      transitions: [
        {
          nextStateName: States.PHONE_IN_POCKET,
          checkOnSignal(signal) {
            return signal === States.PHONE_IN_POCKET;
          },
          onExecution() {
            calibrationUISteps[1].enabled = false;
          },
        },
      ],
    });

    stateMachine.addState({
      name: States.PHONE_IN_POCKET,
      onEnter: (state) => {
        // show text instructions telling user to put their phone in their pocket
        calibrationUISteps[2].enabled = true;
        audioPlayer.audioTrack = englishAudioFiles.getTracks()[3];

        audioPlayer.setOnFinish(() => {
          setTimeout(() => {
            stateMachine.sendSignal(States.GET_WALKER);
          }, 4000);
          audioPlayer.setOnFinish(() => null);
        });
        audioPlayer.play(1);
      },
      transitions: [
        {
          nextStateName: States.GET_WALKER,
          checkOnSignal(signal) {
            return signal === States.GET_WALKER;
          },
          onExecution() {
            calibrationUISteps[2].enabled = false;
          },
        },
      ],
    });

    stateMachine.addState({
      name: States.GET_WALKER,
      onEnter: () => {
        calibrationUISteps[3].enabled = true;
        // play 4, 5
        audioPlayer.audioTrack = englishAudioFiles.getTracks()[4];
        audioPlayer.setOnFinish(() => {
          audioPlayer.audioTrack = englishAudioFiles.getTracks()[5];
          audioPlayer.play(1);
          audioPlayer.setOnFinish(() => null);
          setTimeout(() => {
            // play 6

            audioPlayer.audioTrack = englishAudioFiles.getTracks()[6];
            audioPlayer.setOnFinish(() => {
              stateMachine.sendSignal(States.STAND_STRAIGHT);
              audioPlayer.setOnFinish(() => null);
            });
            audioPlayer.play(1);
          }, 4000);
        });
        audioPlayer.play(1);
      },
      transitions: [
        {
          nextStateName: States.STAND_STRAIGHT,
          checkOnSignal(signal) {
            return signal === States.STAND_STRAIGHT;
          },
          onExecution() {
            calibrationUISteps[3].enabled = false;
          },
        },
      ],
    });

    stateMachine.addState({
      name: States.STAND_STRAIGHT,
      onEnter: () => {
        calibrationUISteps[4].enabled = true;
        setTimeout(() => {
          calibrationUISteps[4].enabled = false;
          calibrationUISteps[5].enabled = true;
          setTimeout(() => {
            stateMachine.sendSignal(States.FOLLOW);
          }, 3000);
        }, 3000);
      },
      transitions: [
        {
          nextStateName: States.FOLLOW,
          checkOnSignal(signal) {
            return signal === States.FOLLOW;
          },
          onExecution() {
            calibrationUISteps[4].enabled = false;
            calibrationUISteps[5].enabled = false;
          },
        },
      ],
    });

    stateMachine.addState({
      name: States.FOLLOW,
      onEnter: () => {
        // consider adding this to prev state transition onExecte
        this.cameraStartPosition = this.camObject
          .getTransform()
          .getWorldPosition();

        this.headData.startTracking(this.cameraStartPosition);
        // play tracks7 8 9 back to back
        audioPlayer.audioTrack = englishAudioFiles.getTracks()[7];
        audioPlayer.setOnFinish(() => {
          audioPlayer.audioTrack = englishAudioFiles.getTracks()[8];
          audioPlayer.play(1);
          audioPlayer.setOnFinish(() => {
            audioPlayer.audioTrack = englishAudioFiles.getTracks()[9];
            audioPlayer.play(1);
            audioPlayer.setOnFinish(() => null);
          });
        });
        audioPlayer.play(1);
      },
    });
  };
}
