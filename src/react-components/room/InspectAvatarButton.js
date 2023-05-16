import React from "react";
import { ReactComponent as AvatarIcon } from "../icons/Avatar.svg";
import { ToolbarButton } from "../input/ToolbarButton";
import { FormattedMessage } from "react-intl";

export function InspectAvatarButton(props) {
    return (
      <ToolbarButton
        {...props}
        icon={<AvatarIcon />}
        preset="accent4"
        label={<FormattedMessage id="avatar-toolbar-button" defaultMessage="My Avatar" />}
      />
    );
  }