import {
  D as I,
  w as L,
  aa as Y,
  x as h,
  ab as A,
  ac as P,
  ad as C,
  C as y,
  B as E,
  L as d,
  ae as D,
  af as k,
  ag as T,
  y as x,
  ah as W,
  ai as q,
  aj as G,
  ak as J,
  al as K,
  am as Q,
  an as M,
  ao as X,
  ap as b,
  F as j,
  p as Z,
  c as i,
  aq as F,
  V as ee,
  n as te,
  ar as ae,
  M as ne,
  E as re,
  O as oe,
  as as se,
  at as g,
  b as ie,
  au as le,
  av as V,
  aw as ue,
  ax as H,
  a4 as ce,
  u as N,
  ay as fe,
  az as de,
  aA as _e,
  aB as pe,
  aC as he,
  aD as ve,
  aE as ye,
} from "./BOYRZm52.js";
function Ve(e) {
  return (
    e.endsWith("capture") &&
    e !== "gotpointercapture" &&
    e !== "lostpointercapture"
  );
}
const me = [
  "beforeinput",
  "click",
  "change",
  "dblclick",
  "contextmenu",
  "focusin",
  "focusout",
  "input",
  "keydown",
  "keyup",
  "mousedown",
  "mousemove",
  "mouseout",
  "mouseover",
  "mouseup",
  "pointerdown",
  "pointermove",
  "pointerout",
  "pointerover",
  "pointerup",
  "touchend",
  "touchmove",
  "touchstart",
];
function Ie(e) {
  return me.includes(e);
}
const ge = {
  formnovalidate: "formNoValidate",
  ismap: "isMap",
  nomodule: "noModule",
  playsinline: "playsInline",
  readonly: "readOnly",
  defaultvalue: "defaultValue",
  defaultchecked: "defaultChecked",
  srcobject: "srcObject",
  novalidate: "noValidate",
  allowfullscreen: "allowFullscreen",
  disablepictureinpicture: "disablePictureInPicture",
  disableremoteplayback: "disableRemotePlayback",
};
function Le(e) {
  return ((e = e.toLowerCase()), ge[e] ?? e);
}
const be = ["touchstart", "touchmove"];
function Ee(e) {
  return be.includes(e);
}
let s;
function we() {
  s = void 0;
}
function Pe(e) {
  let t = null,
    a = h;
  var o;
  if (h) {
    for (
      t = d, s === void 0 && (s = D(document.head));
      s !== null && (s.nodeType !== A || s.data !== P);

    )
      s = C(s);
    s === null ? y(!1) : (s = E(C(s)));
  }
  h || (o = document.head.appendChild(I()));
  try {
    L(() => e(o), Y);
  } finally {
    a && (y(!0), (s = d), E(t));
  }
}
function xe(e, t) {
  var a = t == null ? "" : typeof t == "object" ? t + "" : t;
  a !== (e.__t ?? (e.__t = e.nodeValue)) &&
    ((e.__t = a), (e.nodeValue = a + ""));
}
function $(e, t) {
  return z(e, t);
}
function Te(e, t) {
  (k(), (t.intro = t.intro ?? !1));
  const a = t.target,
    o = h,
    r = d;
  try {
    for (var n = D(a); n && (n.nodeType !== A || n.data !== P); ) n = C(n);
    if (!n) throw T;
    (y(!0), E(n), x());
    const c = z(e, { ...t, anchor: n });
    if (d === null || d.nodeType !== A || d.data !== W) throw (q(), T);
    return (y(!1), c);
  } catch (c) {
    if (c === T) return (t.recover === !1 && G(), k(), J(a), y(!1), $(e, t));
    throw c;
  } finally {
    (y(o), E(r), we());
  }
}
const v = new Map();
function z(
  e,
  { target: t, anchor: a, props: o = {}, events: r, context: n, intro: c = !0 },
) {
  k();
  var f = new Set(),
    _ = (p) => {
      for (var l = 0; l < p.length; l++) {
        var u = p[l];
        if (!f.has(u)) {
          f.add(u);
          var m = Ee(u);
          t.addEventListener(u, b, { passive: m });
          var O = v.get(u);
          O === void 0
            ? (document.addEventListener(u, b, { passive: m }), v.set(u, 1))
            : v.set(u, O + 1);
        }
      }
    };
  (_(K(Q)), M.add(_));
  var w = void 0,
    U = X(() => {
      var p = a ?? t.appendChild(I());
      return (
        j(() => {
          if (n) {
            Z({});
            var l = i;
            l.c = n;
          }
          (r && (o.$$events = r),
            h && F(p, null),
            (w = e(p, o) || {}),
            h && (ee.nodes_end = d),
            n && te());
        }),
        () => {
          var m;
          for (var l of f) {
            t.removeEventListener(l, b);
            var u = v.get(l);
            --u === 0
              ? (document.removeEventListener(l, b), v.delete(l))
              : v.set(l, u);
          }
          (M.delete(_),
            p !== a && ((m = p.parentNode) == null || m.removeChild(p)));
        }
      );
    });
  return (S.set(w, U), w);
}
let S = new WeakMap();
function Ae(e, t) {
  const a = S.get(e);
  return a ? (S.delete(e), a(t)) : Promise.resolve();
}
function je(e, t, ...a) {
  var o = e,
    r = oe,
    n;
  (L(() => {
    r !== (r = t()) && (n && (se(n), (n = null)), (n = j(() => r(o, ...a))));
  }, re),
    h && (o = d));
}
function Ce(e) {
  return (t, ...a) => {
    var _;
    var o = e(...a),
      r;
    if (h) ((r = d), x());
    else {
      var n = o.render().trim(),
        c = ae(n);
      ((r = D(c)), t.before(r));
    }
    const f = (_ = o.setup) == null ? void 0 : _.call(o, r);
    (F(r, r), typeof f == "function" && ne(f));
  };
}
function ke() {
  var e;
  return (
    V === null && le(),
    ((e = V).ac ?? (e.ac = new AbortController())).signal
  );
}
function B(e) {
  (i === null && g(),
    ce && i.l !== null
      ? R(i).m.push(e)
      : ie(() => {
          const t = N(e);
          if (typeof t == "function") return t;
        }));
}
function Se(e) {
  (i === null && g(), B(() => () => N(e)));
}
function De(e, t, { bubbles: a = !1, cancelable: o = !1 } = {}) {
  return new CustomEvent(e, { detail: t, bubbles: a, cancelable: o });
}
function Ne() {
  const e = i;
  return (
    e === null && g(),
    (t, a, o) => {
      var n;
      const r = (n = e.s.$$events) == null ? void 0 : n[t];
      if (r) {
        const c = ue(r) ? r.slice() : [r],
          f = De(t, a, o);
        for (const _ of c) _.call(e.x, f);
        return !f.defaultPrevented;
      }
      return !0;
    }
  );
}
function Re(e) {
  (i === null && g(), i.l === null && H(), R(i).b.push(e));
}
function Oe(e) {
  (i === null && g(), i.l === null && H(), R(i).a.push(e));
}
function R(e) {
  var t = e.l;
  return t.u ?? (t.u = { a: [], b: [], m: [] });
}
const Fe = Object.freeze(
  Object.defineProperty(
    {
      __proto__: null,
      afterUpdate: Oe,
      beforeUpdate: Re,
      createEventDispatcher: Ne,
      createRawSnippet: Ce,
      flushSync: fe,
      getAbortSignal: ke,
      getAllContexts: de,
      getContext: _e,
      hasContext: pe,
      hydrate: Te,
      mount: $,
      onDestroy: Se,
      onMount: B,
      setContext: he,
      settled: ve,
      tick: ye,
      unmount: Ae,
      untrack: N,
    },
    Symbol.toStringTag,
    { value: "Module" },
  ),
);
export {
  Ie as a,
  je as b,
  Ne as c,
  Pe as d,
  Fe as e,
  Te as h,
  Ve as i,
  $ as m,
  Le as n,
  B as o,
  xe as s,
  Ae as u,
};
