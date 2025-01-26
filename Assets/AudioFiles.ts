@component
export class AudioFiles extends BaseScriptComponent {
  @input audioTracks: AudioTrackAsset[];

  onAwake() {}

  public getTracks = () => this.audioTracks;
}
