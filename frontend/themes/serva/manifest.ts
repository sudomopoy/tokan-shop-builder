import { ThemeManifest } from "../types";
import ServaThemeProvider from "./provider";

export const themeManifest = {
  id: "serva",
  provider: ServaThemeProvider,
};

export default themeManifest as ThemeManifest;

