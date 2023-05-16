import { paths } from "./userinput/paths";
export class InspectYourselfSystem {
  tick(scene, userinput, cameraSystem) {
    if (!scene.is("entered")) return;
    if (userinput.get(paths.actions.startInspectingSelf)) {
      const rig = document.getElementById("avatar-rig");
      cameraSystem.inspect(rig, 1.5);
      window.irmCtrl.resetInspectAvatar(true);
    }
    else if (window.irmCtrl.isInspectAvatarToggle())
    {
      if (window.irmCtrl.isInspectAvatar())
      {
        const rig = document.getElementById("avatar-rig");
        cameraSystem.inspect(rig, 1.5);
      }
      else
      {
        cameraSystem.uninspect();
      }
      window.irmCtrl.resetInspectAvatar();
    }
  }
}
