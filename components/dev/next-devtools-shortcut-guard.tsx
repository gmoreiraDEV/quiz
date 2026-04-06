"use client";

import { useEffect } from "react";

const SAFE_SHORTCUT = "Alt+Shift+KeyD";
const PATCH_FLAG = "__lureness_quiz_next_devtools_shortcut_patched__";

export function NextDevtoolsShortcutGuard() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") {
      return;
    }

    const nextWindow = window as Window & {
      __lureness_quiz_next_devtools_shortcut_patched__?: boolean;
    };

    if (nextWindow[PATCH_FLAG]) {
      return;
    }

    nextWindow[PATCH_FLAG] = true;

    void fetch("/__nextjs_devtools_config", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        hideShortcut: SAFE_SHORTCUT,
      }),
      keepalive: true,
    }).catch(() => {
      nextWindow[PATCH_FLAG] = false;
    });
  }, []);

  return null;
}
