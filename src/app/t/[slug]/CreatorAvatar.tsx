"use client";

import { useState } from "react";

type Props = {
  displayName: string;
  photoUrl: string | null;
};

export function CreatorAvatar({ displayName, photoUrl }: Props) {
  const [failed, setFailed] = useState(false);

  const src = photoUrl && !failed ? photoUrl : "/default-profile.svg";

  return (
    <img
      alt={displayName || "Avatar"}
      className={`avatar avatar-photo${(!photoUrl || failed) ? " avatar-photo--default" : ""}`}
      decoding="async"
      referrerPolicy="no-referrer"
      src={src}
      onError={() => setFailed(true)}
    />
  );
}
