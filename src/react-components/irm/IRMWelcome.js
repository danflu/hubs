import React, { useEffect, useState } from "react";
import ReadyPlayerModal from "./ReadyPlayerModal";
import styles from "./IRMWelcome.scss";
import image from "../../assets/images/realms.png";

const IRMWelcome = props => {
  const [ready, setReady] = useState(false);
  const [editAvatar, setEditAvatar] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [avatarSubId, setAvatarSubId] = useState(null);

  useEffect(() => {
    const setVisiblility = (idArray, visible) => {
      idArray.forEach(id => {
        const el = document.getElementById(id);
        el.style.visibility = visible ? "visible" : "hidden";
      });
    };
    setVisiblility(["a-scene-container", "preload-overlay"], ready);
  }, [ready]);

  useEffect( () => {
    setEditAvatar(props.editAvatarMode === true);
  }, []);

  const onEditAvatarOpenHandler = () => {
    setEditAvatar(true);
  }

  const onEditAvatarCloseHandler = () => {
    console.log(`IRMWelcome : onEditAvatarCloseHandler`);
    setEditAvatar(false);
    if (props.editAvatarMode) {
      setReady(true);
    }
  }

  const onEditAvatarReadyHandler = (avatarUrl, avatarSubId) => {
    console.log(`IRMWelcome : onEditAvatarReadyHandler : avatarUrl:${avatarUrl}, avatarSubId:${avatarSubId}`);
    setAvatarUrl(avatarUrl);
    setAvatarSubId(avatarSubId);
  }

  const onEnterMetaverseHandler = () => {
    setReady(true);
  };

  if (ready) {
    const avatar = (avatarUrl != null && avatarSubId != null) ? {avatarUrl, avatarSubId} : undefined;
    props.loadMetaverse(avatar);
    return <></>
  }
  return (
    <div style={{ pointerEvents: "auto" }}>
      {!props.editAvatarMode &&
      <div>
        <div>
          <img src={image}/>
        </div>
      </div>
      }

      {editAvatar && <ReadyPlayerModal onClose={onEditAvatarCloseHandler} onReady={onEditAvatarReadyHandler}/>}

      {!props.editAvatarMode &&
      <div>
        <button className={"button-36"} onClick={onEditAvatarOpenHandler}>Edit Avatar</button>
        <button className={"button-36"} disabled={editAvatar} onClick={onEnterMetaverseHandler}>Enter Metaverse</button>
      </div>
      }
    </div>
  );
};

export default IRMWelcome;
