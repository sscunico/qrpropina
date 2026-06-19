"use client";

import { useEffect } from "react";
import { markNotificationsReadAction } from "./actions";

export function MarkReadOnMount() {
  useEffect(() => {
    markNotificationsReadAction();
  }, []);
  return null;
}
