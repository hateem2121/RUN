// @ts-nocheck
/// <reference types="vite/client" />
import React from "react";

if (import.meta.env.DEV) {
  try {
    const { default: wdyr } =
      await import("@welldone-software/why-did-you-render");

    wdyr(React, {
      trackAllPureComponents: true,
      trackHooks: true,
      logOnDifferentValues: true,
    });
  } catch (_error) {}
}
