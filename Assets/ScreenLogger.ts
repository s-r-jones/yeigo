import WorldCameraFinderProvider from "SpectaclesInteractionKit/Providers/CameraProvider/WorldCameraFinderProvider";

@component
export class ScreenLogger extends BaseScriptComponent {
  debugText: Text;
  private static instance: ScreenLogger;

  @input
  @allowUndefined
  public debugCube: ObjectPrefab;

  @input
  @allowUndefined
  public font: Font;

  public static getInstance(): ScreenLogger {
    if (!ScreenLogger.instance) {
      return null;
    }
    return ScreenLogger.instance;
  }

  onAwake() {
    ScreenLogger.instance = this;
    this.createComponent();
  }

  createComponent = () => {
    let loggerObj = global.scene.createSceneObject("ScreenLogger");
    WorldCameraFinderProvider.getInstance().attachSceneObject(loggerObj);
    this.debugText = loggerObj.createComponent("Text");
    this.debugText.getTransform().setLocalPosition(new vec3(16, 24, -110));
    this.debugText.horizontalAlignment = HorizontalAlignment.Right;
    this.debugText.size = 54;
    this.debugText.text = "N/A";

    if (this.font) {
      this.debugText.font = this.font;
    }
  };

  public log(nText) {
    this.debugText.text = nText;
  }

  public placeDebugCube(pos, text) {
    if (this.debugCube) {
      let debugCube = this.debugCube.instantiate(this.sceneObject.getParent());
      debugCube.getTransform().setWorldPosition(pos);
      debugCube.name = "DC_" + text;
      let cubeText = debugCube.createComponent("Text");
      cubeText.size = 48;
      cubeText.text = text + "\n\n";
      let lookAtC = debugCube.createComponent("LookAtComponent");
      lookAtC.target = this.sceneObject;
      lookAtC.aimVectors = LookAtComponent.AimVectors.ZAimYUp;
    }
  }
}
