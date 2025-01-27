import { GroundPlacement } from "./GroundPlacement";
import StateMachine from "SpectaclesInteractionKit/Utils/StateMachine";
import { ScreenLogger } from "./ScreenLogger";
import { PhoneController } from "./MotionController";
import { HeadData } from "./HeadData";
import { LSTween } from "./LSTween/LSTween";
import { Easing } from "./LSTween/TweenJS/Easing";

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
  bubble: SceneObject;
  signs: SceneObject;
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
  MENU = "Menu",
}

@component
export class NewScript extends BaseScriptComponent {
  @input calibrationUISteps: SceneObject[];
  @input camObject: SceneObject;
  @input instructionText: Text;
  @input groundPlacement: GroundPlacement;
  @input textContainer: SceneObject;
  @input headData: HeadData;
  @input bubble: SceneObject;
  @input signs: SceneObject;
  @input menu: SceneObject;
  @input englishAudioFiles: AudioFiles;
  @input dineAudioFiles: AudioFiles;

  @input handMeshes: RenderMeshVisual[];
  @input handMaterialStart: Material[];
  @input handMaterialOverlap: Material;

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

  private signObjects: SceneObject[] = [];
  private isEnglish: boolean = true;

  onAwake() {
    this.textContainer.enabled = false;
    this.instructionText.text = "";
    this.instructionText.enabled = false;
    this.stateMachine = new StateMachine("GameStateMachine");
    this.walkerMarker.enabled = false;
    const signParent = this.signs.getChild(0);
    this.signObjects = signParent.children;
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
      bubble: this.bubble,
      signs: this.signs,
    };

    this.setUpStateMachine(config);
    this.stateMachine.enterState(States.MENU);

    // this.walkeMarkerCollider.onOverlapEnter.add(
    //   (arg: OverlapEnterEventArgs) => {
    //     const overlapName = arg.overlap.collider.sceneObject.name;
    //     ScreenLogger.getInstance().log("Overlap Enter " + overlapName);
    //     if (overlapName.includes("Left")) {
    //       this.handMeshes[0].clearMaterials();
    //       this.handMeshes[0].addMaterial(this.handMaterialOverlap);
    //     } else if (overlapName.includes("Right")) {
    //       this.handMeshes[1].clearMaterials();
    //       this.handMeshes[1].addMaterial(this.handMaterialOverlap);
    //     }
    //   }
    // );

    // this.walkeMarkerCollider.onOverlapExit.add((arg: OverlapExitEventArgs) => {
    //   ScreenLogger.getInstance().log("Overlap Exit");
    //   const overlapName = arg.overlap.collider.sceneObject.name;
    //   if (overlapName.includes("left")) {
    //     this.handMeshes[0].clearMaterials();
    //     this.handMeshes[0].addMaterial(this.handMaterialStart[0]);
    //   } else if (overlapName.includes("right")) {
    //     this.handMeshes[1].clearMaterials();
    //     this.handMeshes[1].addMaterial(this.handMaterialStart[1]);
    //   }
    // });
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
      bubble,
      signs,
    } = config;

    stateMachine.addState({
      name: States.MENU,
      onEnter: () => {
        this.menu.getTransform().setWorldPosition(
          this.camObject
            .getTransform()
            .getWorldPosition()
            .add(
              this.camObject.getTransform().forward.add(new vec3(0, 0, -120))
            )
        );
        audioPlayer.audioTrack = this.englishAudioFiles.getTracks()[12];
        audioPlayer.play(1);
        this.menu.enabled = true;
      },
    });

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

          //ScreenLogger.getInstance().log("Ground Y " + this.groundPosition.y);

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
        const audioFiles = this.isEnglish
          ? this.englishAudioFiles
          : this.dineAudioFiles;
        // enable to text telling user to begin phone calibration
        audioPlayer.audioTrack = audioFiles.getTracks()[0];
        audioPlayer.setOnFinish(() => {
          audioPlayer.audioTrack = audioFiles.getTracks()[1];
          audioPlayer.play(1);
          audioPlayer.setOnFinish(() => null);
        });
        audioPlayer.play(1);

        calibrationUISteps[0].enabled = true;

        phoneController.setOnPhoneTrackingStateChange((val) => {
          // disable text
          //ScreenLogger.getInstance().log("Phone Tracking State Change " + val);

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
        const audioFiles = this.isEnglish
          ? this.englishAudioFiles
          : this.dineAudioFiles;
        // show text instructions telling user to hold their phone in their hand at their side
        calibrationUISteps[1].enabled = true;
        audioPlayer.audioTrack = audioFiles.getTracks()[2];
        audioPlayer.setOnFinish(() => {
          setTimeout(() => {
            // get transform from motion controller
            this.handPosition = this.phoneController
              .getTransform()
              .getWorldPosition()
              .add(new vec3(0, 10, -38));
            this.walkerMarker
              .getTransform()
              .setWorldPosition(this.handPosition);
            this.walkerMarker.enabled = true;
            stateMachine.sendSignal(States.PHONE_IN_POCKET);
          }, 4000);

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
            audioPlayer.pause();
            calibrationUISteps[1].enabled = false;
          },
        },
      ],
    });

    stateMachine.addState({
      name: States.PHONE_IN_POCKET,
      onEnter: (state) => {
        const audioFiles = this.isEnglish
          ? this.englishAudioFiles
          : this.dineAudioFiles;
        // show text instructions telling user to put their phone in their pocket
        calibrationUISteps[2].enabled = true;
        audioPlayer.audioTrack = audioFiles.getTracks()[3];

        audioPlayer.setOnFinish(() => {
          setTimeout(() => {
            stateMachine.sendSignal(States.GET_WALKER);
          }, 3000);
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
            audioPlayer.pause();
            calibrationUISteps[2].enabled = false;
          },
        },
      ],
    });

    stateMachine.addState({
      name: States.GET_WALKER,
      onEnter: () => {
        const audioFiles = this.isEnglish
          ? this.englishAudioFiles
          : this.dineAudioFiles;
        calibrationUISteps[3].enabled = true;
        // play 4, 5
        audioPlayer.audioTrack = audioFiles.getTracks()[4];
        audioPlayer.setOnFinish(() => {
          audioPlayer.audioTrack = audioFiles.getTracks()[5];
          audioPlayer.play(1);
          audioPlayer.setOnFinish(() => null);
          setTimeout(() => {
            // play 6

            audioPlayer.audioTrack = audioFiles.getTracks()[6];
            audioPlayer.setOnFinish(() => {
              stateMachine.sendSignal(States.STAND_STRAIGHT);
              audioPlayer.setOnFinish(() => null);
            });
            audioPlayer.play(1);
          }, 7000);
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
            audioPlayer.pause();
          },
        },
      ],
    });

    stateMachine.addState({
      name: States.STAND_STRAIGHT,
      onEnter: () => {
        const audioFiles = this.isEnglish
          ? this.englishAudioFiles
          : this.dineAudioFiles;
        calibrationUISteps[4].enabled = true;
        audioPlayer.audioTrack = audioFiles.getTracks()[8];
        audioPlayer.play(1);
        setTimeout(() => {
          calibrationUISteps[4].enabled = false;
          calibrationUISteps[5].enabled = true;
          setTimeout(() => {
            stateMachine.sendSignal(States.FOLLOW);
          }, 6000);
        }, 6000);
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
            audioPlayer.pause();
          },
        },
      ],
    });

    stateMachine.addState({
      name: States.FOLLOW,
      onEnter: () => {
        const audioFiles = this.isEnglish
          ? this.englishAudioFiles
          : this.dineAudioFiles;
        // consider adding this to prev state transition onExecte
        this.cameraStartPosition = this.camObject
          .getTransform()
          .getWorldPosition();

        this.headData.startTracking(this.cameraStartPosition);
        // play tracks7 8 9 back to back
        audioPlayer.audioTrack = audioFiles.getTracks()[7];
        audioPlayer.setOnFinish(() => {
          audioPlayer.audioTrack = audioFiles.getTracks()[9];
          audioPlayer.play(1);
          audioPlayer.setOnFinish(() => {
            audioPlayer.setOnFinish(() => null);
          });
        });
        // show bubble 460 cm in front of user using cam forward vector
        bubble.getTransform().setWorldPosition(
          this.camObject
            .getTransform()
            .getWorldPosition()
            .add(
              this.camObject.getTransform().forward.add(new vec3(0, 0, -460))
            )
        );

        signs.getTransform().setWorldPosition(
          this.camObject
            .getTransform()
            .getWorldPosition()
            .add(
              this.camObject.getTransform().forward.add(new vec3(0, 0, -200))
            )
        );

        for (let i = 0; i < this.signObjects.length; i++) {
          LSTween.scaleFromToLocal(
            this.signObjects[i].getTransform(),
            new vec3(0, 0, 0),
            new vec3(100, 100, 100),
            1000
          )
            .easing(Easing.Bounce.InOut)
            .delay(i === 0 ? 250 : i === 1 ? 500 : 1000)
            .onStart(() => {
              this.signObjects[i].enabled = true;
            })
            .start();
        }

        function playAudio(track: number, onFinish: () => void) {
          audioPlayer.audioTrack = audioFiles.getTracks()[track];

          audioPlayer.setOnFinish(() => {
            setTimeout(() => {
              onFinish();
            }, 2000);
          });
          audioPlayer.play(1);
        }

        if (this.isEnglish) {
          playAudio(10, () => {
            playAudio(11, () => {
              playAudio(9, () => {});
            });
          });
        } else {
          playAudio(13, () => {
            playAudio(14, () => {
              playAudio(15, () => {});
            });
          });
        }

        //

        // play 9 10 11 with 2 second delay between each

        bubble.enabled = true;
        //signs.enabled = true;
        audioPlayer.play(1);
      },
    });
  };

  public englishMode = () => {
    this.isEnglish = true;
    this.menu.enabled = false;
    this.stateMachine.enterState(States.PHONE_CALIBRATION);
  };

  public dineMode = () => {
    this.isEnglish = false;
    this.menu.enabled = false;
    this.stateMachine.enterState(States.PHONE_CALIBRATION);
  };
}
