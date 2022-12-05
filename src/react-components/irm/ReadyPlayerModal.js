import React, { useEffect, useRef } from "react";
import { Modal } from "../modal/Modal";
//import { FormattedMessage } from "react-intl";
import { CloseButton } from "../input/CloseButton";

const frameId = "ready_player_avatar_frame";
const frameSrc = `https://iptv.readyplayer.me/avatar?frameApi`;

function parse(event) {
  try {
    return JSON.parse(event.data);
  } catch (error) {
    return null;
  }
}

export default function ReadyPlayerModal({ onClose, onReady }) {
  const iframeRef = useRef(null);

  useEffect(() => {
    console.log("ReadyPlayerModal : setup...");

    const subscribe = event => {
      const json = parse(event);

      if (json?.source !== "readyplayerme") {
        return;
      }

      console.log(`ReadyPlayerModal : onMessage : ${event.data}`);

      switch (json.eventName) {
        case "v1.frame.ready":
          iframeRef.current.contentWindow.postMessage(
            JSON.stringify({
              target: "readyplayerme",
              type: "subscribe",
              eventName: "v1.**"
            }),
            "*"
          );
          break;

        case "v1.avatar.exported":
          const avatarSubId = Date.now().toString();
          //store.update({ profile: { ...store.state.profile, ...{ avatarId: json.data.url, avatarSubId } } });
          //scene.emit("avatar_updated");
          onReady(json.data.url, avatarSubId);
          onClose();
          break;
      }
    };

    window.addEventListener("message", subscribe);

    return () => {
      console.log("ReadyPlayerModal : cleanup...");

      window.removeEventListener("message", subscribe);
    };
  }, []);

  return (
    <Modal
      title="Create Avatar"
      beforeTitle={<CloseButton onClick={onClose} />}
    >
      <iframe
        title="Edit Avatar"
        ref={iframeRef}
        src={frameSrc}
        id={frameId}
        style={{ width: "100%", height: "600px" }}
        allow="camera *; microphone *"
      ></iframe>
    </Modal>
  );
}
