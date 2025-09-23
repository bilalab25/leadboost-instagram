import { useEffect } from "react";
import WebFont from "webfontloader";

export function useGoogleFontLoader(fonts: string[]) {
  useEffect(() => {
    if (fonts.length > 0) {
      WebFont.load({
        google: {
          families: fonts,
        },
      });
    }
  }, [fonts]);
}
