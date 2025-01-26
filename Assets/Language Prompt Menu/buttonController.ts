import { Interactable } from "../SpectaclesInteractionKit/Components/Interaction/Interactable/Interactable";

@component
export class buttonController extends BaseScriptComponent {
  @input tex_1: Texture;
  @input tex_2: Texture;

  interactable: Interactable;

  onAwake() {
    let img = this.sceneObject.getComponent("Image");
    let clonedMat = img.mainMaterial.clone();
    img.mainMaterial = clonedMat;
    this.interactable = this.sceneObject.getComponent(
      Interactable.getTypeName()
    );
    this.createEvent("OnStartEvent").bind(() => {
      this.interactable.onHoverEnter.add(() => {
        img.mainMaterial.mainPass.baseTex = this.tex_2;
      });
      this.interactable.onHoverExit.add(() => {
        img.mainMaterial.mainPass.baseTex = this.tex_1;
      });
    });
  }
}
