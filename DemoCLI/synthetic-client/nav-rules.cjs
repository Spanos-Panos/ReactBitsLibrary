const NAV_COMPONENTS = [
  "Components/CardNav",
  "Components/StaggeredMenu",
  "Components/GooeyNav",
  "Components/Dock",
  "Components/PillNav",
  "Components/FlowingMenu",
];

const NAV_BY_AESTHETIC = {
  Editorial: "Components/CardNav",
  Minimal: "Components/PillNav",
  Futuristic: "Components/FlowingMenu",
  Brutalist: "Components/StaggeredMenu",
  colorful: "Components/GooeyNav",
};

function ensureNavForPages(selectedComponentIds, pages, aesthetic) {
  if (!Array.isArray(selectedComponentIds) || !Array.isArray(pages) || pages.length <= 1) {
    return { selectedComponentIds, injectedNavId: null };
  }
  const hasNav = selectedComponentIds.some(id => NAV_COMPONENTS.includes(id));
  if (hasNav) {
    return { selectedComponentIds, injectedNavId: null };
  }
  const navId = NAV_BY_AESTHETIC[aesthetic] || "Components/PillNav";
  return { selectedComponentIds: [...selectedComponentIds, navId], injectedNavId: navId };
}

module.exports = {
  NAV_COMPONENTS,
  NAV_BY_AESTHETIC,
  ensureNavForPages,
};
