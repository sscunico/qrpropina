"use client";

import { useState } from "react";

type Props = {
  displayName: string;
  photoUrl: string | null;
};

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function CreatorAvatar({ displayName, photoUrl }: Props) {
  const [failed, setFailed] = useState(false);

  if (photoUrl && !failed) {
    return (
      <img
        alt={displayName}
        className="avatar avatar-photo"
        decoding="async"
        referrerPolicy="no-referrer"
        src={photoUrl}
        onError={() => setFailed(true)}
      />
    );
  }

  return <div className="avatar">{initials(displayName)}</div>;
}
