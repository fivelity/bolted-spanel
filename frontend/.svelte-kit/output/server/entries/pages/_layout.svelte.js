import {
  F as sanitize_slots,
  G as sanitize_props,
  I as fallback,
  J as attr_class,
  K as clsx,
  M as slot,
  N as attr_style,
  O as bind_props,
  E as pop,
  A as push,
  P as stringify,
} from "../../chunks/index.js";
import "clsx";
import { w as writable, g as get, r as readable } from "../../chunks/index2.js";
import {
  arrow,
  flip,
  shift,
  offset,
  autoUpdate,
  computePosition,
} from "@floating-ui/dom";
const storePopup = writable(void 0);
const stores = {};
function localStorageStore(key, initialValue, options) {
  if (!stores[key]) {
    const store = writable(initialValue, (set2) => {});
    const { subscribe, set } = store;
    stores[key] = {
      set(value) {
        set(value);
      },
      update(updater) {
        const value = updater(get(store));
        set(value);
      },
      subscribe,
    };
  }
  return stores[key];
}
localStorageStore("modeOsPrefers", false);
localStorageStore("modeUserPrefers", void 0);
localStorageStore("modeCurrent", false);
function prefersReducedMotion() {
  return false;
}
readable(prefersReducedMotion(), (set) => {});
function AppShell($$payload, $$props) {
  const $$slots = sanitize_slots($$props);
  const $$sanitized_props = sanitize_props($$props);
  push();
  let classesBase,
    classesHeader,
    classesSidebarLeft,
    classesSidebarRight,
    classesPageHeader,
    classesPageContent,
    classesPageFooter,
    classesFooter;
  let scrollbarGutter = fallback($$props["scrollbarGutter"], "auto");
  let regionPage = fallback($$props["regionPage"], "");
  let slotHeader = fallback($$props["slotHeader"], "z-10");
  let slotSidebarLeft = fallback($$props["slotSidebarLeft"], "w-auto");
  let slotSidebarRight = fallback($$props["slotSidebarRight"], "w-auto");
  let slotPageHeader = fallback($$props["slotPageHeader"], "");
  let slotPageContent = fallback($$props["slotPageContent"], "");
  let slotPageFooter = fallback($$props["slotPageFooter"], "");
  let slotFooter = fallback($$props["slotFooter"], "");
  const cBaseAppShell = "w-full h-full flex flex-col overflow-hidden";
  const cContentArea = "w-full h-full flex overflow-hidden";
  const cPage = "flex-1 overflow-x-hidden flex flex-col";
  const cSidebarLeft = "flex-none overflow-x-hidden overflow-y-auto";
  const cSidebarRight = "flex-none overflow-x-hidden overflow-y-auto";
  classesBase = `${cBaseAppShell} ${$$sanitized_props.class ?? ""}`;
  classesHeader = `${slotHeader}`;
  classesSidebarLeft = `${cSidebarLeft} ${slotSidebarLeft}`;
  classesSidebarRight = `${cSidebarRight} ${slotSidebarRight}`;
  classesPageHeader = `${slotPageHeader}`;
  classesPageContent = `${slotPageContent}`;
  classesPageFooter = `${slotPageFooter}`;
  classesFooter = `${slotFooter}`;
  $$payload.out.push(
    `<div id="appShell"${attr_class(clsx(classesBase))} data-testid="app-shell">`,
  );
  if ($$slots.header) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(
      `<header id="shell-header"${attr_class(`flex-none ${stringify(classesHeader)}`)}><!---->`,
    );
    slot($$payload, $$props, "header", {}, null);
    $$payload.out.push(`<!----></header>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(
    `<!--]--> <div${attr_class(`flex-auto ${stringify(cContentArea)}`)}>`,
  );
  if ($$slots.sidebarLeft) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(
      `<aside id="sidebar-left"${attr_class(clsx(classesSidebarLeft))}><!---->`,
    );
    slot($$payload, $$props, "sidebarLeft", {}, null);
    $$payload.out.push(`<!----></aside>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(
    `<!--]--> <div id="page"${attr_class(`${stringify(regionPage)} ${stringify(cPage)}`)}${attr_style("", { "scrollbar-gutter": scrollbarGutter })}>`,
  );
  if ($$slots.pageHeader) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(
      `<header id="page-header"${attr_class(`flex-none ${stringify(classesPageHeader)}`)}><!---->`,
    );
    slot($$payload, $$props, "pageHeader", {}, () => {
      $$payload.out.push(`(slot:header)`);
    });
    $$payload.out.push(`<!----></header>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(
    `<!--]--> <main id="page-content"${attr_class(`flex-auto ${stringify(classesPageContent)}`)}><!---->`,
  );
  slot($$payload, $$props, "default", {}, null);
  $$payload.out.push(`<!----></main> `);
  if ($$slots.pageFooter) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(
      `<footer id="page-footer"${attr_class(`flex-none ${stringify(classesPageFooter)}`)}><!---->`,
    );
    slot($$payload, $$props, "pageFooter", {}, () => {
      $$payload.out.push(`(slot:footer)`);
    });
    $$payload.out.push(`<!----></footer>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--></div> `);
  if ($$slots.sidebarRight) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(
      `<aside id="sidebar-right"${attr_class(clsx(classesSidebarRight))}><!---->`,
    );
    slot($$payload, $$props, "sidebarRight", {}, null);
    $$payload.out.push(`<!----></aside>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--></div> `);
  if ($$slots.footer) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(
      `<footer id="shell-footer"${attr_class(`flex-none ${stringify(classesFooter)}`)}><!---->`,
    );
    slot($$payload, $$props, "footer", {}, null);
    $$payload.out.push(`<!----></footer>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--></div>`);
  bind_props($$props, {
    scrollbarGutter,
    regionPage,
    slotHeader,
    slotSidebarLeft,
    slotSidebarRight,
    slotPageHeader,
    slotPageContent,
    slotPageFooter,
    slotFooter,
  });
  pop();
}
function _layout($$payload, $$props) {
  push();
  storePopup.set({ computePosition, autoUpdate, offset, shift, flip, arrow });
  AppShell($$payload, {
    children: ($$payload2) => {
      $$payload2.out.push(`<!---->`);
      slot($$payload2, $$props, "default", {}, null);
      $$payload2.out.push(`<!---->`);
    },
    $$slots: { default: true },
  });
  pop();
}
export { _layout as default };
