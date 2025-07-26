import { F as slot } from "../../chunks/index.js";
function _layout($$payload, $$props) {
  $$payload.out.push(`<main class="min-h-screen bg-gray-900 text-white"><!---->`);
  slot($$payload, $$props, "default", {});
  $$payload.out.push(`<!----></main>`);
}
export {
  _layout as default
};
