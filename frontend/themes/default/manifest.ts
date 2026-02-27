import { ThemeManifest } from "../types";
import DefaultThemeProvider from "./provider";

export const themeManifest = {
  id: "default",
  provider: DefaultThemeProvider
};

export default themeManifest as ThemeManifest;
