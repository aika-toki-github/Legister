import * as Material from "https://cdn.jsdelivr.net/npm/@material/material-color-utilities/+esm";
export function setTheme(SourceColor) {
  let theme = Material.themeFromSourceColor(SourceColor);
  let schemes = theme.schemes;
  Object.keys(schemes).forEach((e, i) => {
    Object.keys(schemes[e]).forEach((value, index) => {
      schemes[e][value];
    });
  });
  console.log(theme.schemes);
  console.log(Material);
}
