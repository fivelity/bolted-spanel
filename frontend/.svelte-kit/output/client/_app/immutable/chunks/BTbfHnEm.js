import {
  w as Y,
  x as R,
  y as B,
  E as K,
  z as M,
  H as C,
  A as F,
  B as $,
  C as D,
  D as Z,
  F as w,
  G as q,
  U as z,
  I as G,
  J as H,
  K as J,
  L as Q,
  M as V,
  N as W,
  O as N,
  P as X,
  Q as j,
  R as L,
  T as k,
  g as P,
  V as A,
  W as ee,
  X as re,
  Y as ne,
  Z as U,
  _ as se,
  $ as ae,
  i as ue,
  a0 as ie,
  a1 as g,
  a2 as y,
  a3 as te,
  u as fe,
  a4 as le,
  a5 as ce,
  a6 as de,
  a7 as oe,
  a8 as _e,
  S as ve,
  a9 as pe,
} from "./BOYRZm52.js";
function xe(e, r, s = !1) {
  R && B();
  var n = e,
    i = null,
    t = null,
    l = z,
    o = s ? K : 0,
    v = !1;
  const m = (c, u = !0) => {
    ((v = !0), _(u, c));
  };
  var f = null;
  function x() {
    f !== null && (f.lastChild.remove(), n.before(f), (f = null));
    var c = l ? i : t,
      u = l ? t : i;
    (c && H(c),
      u &&
        J(u, () => {
          l ? (t = null) : (i = null);
        }));
  }
  const _ = (c, u) => {
    if (l === (l = c)) return;
    let I = !1;
    if (R) {
      const b = M(n) === C;
      !!l === b && ((n = F()), $(n), D(!1), (I = !0));
    }
    var p = G(),
      d = n;
    if (
      (p && ((f = document.createDocumentFragment()), f.append((d = Z()))),
      l ? (i ?? (i = u && w(() => u(d)))) : (t ?? (t = u && w(() => u(d)))),
      p)
    ) {
      var S = q,
        h = l ? i : t,
        a = l ? t : i;
      (h && S.skipped_effects.delete(h),
        a && S.skipped_effects.add(a),
        S.add_callback(x));
    } else x();
    I && D(!0);
  };
  (Y(() => {
    ((v = !1), r(m), v || _(null, null));
  }, o),
    R && (n = Q));
}
let E = !1,
  T = Symbol();
function Ie(e, r, s) {
  const n = s[r] ?? (s[r] = { store: null, source: X(void 0), unsubscribe: N });
  if (n.store !== e && !(T in s))
    if ((n.unsubscribe(), (n.store = e ?? null), e == null))
      ((n.source.v = void 0), (n.unsubscribe = N));
    else {
      var i = !0;
      ((n.unsubscribe = j(e, (t) => {
        i ? (n.source.v = t) : L(n.source, t);
      })),
        (i = !1));
    }
  return e && T in s ? k(e) : P(n.source);
}
function Ee() {
  const e = {};
  function r() {
    V(() => {
      for (var s in e) e[s].unsubscribe();
      W(e, T, { enumerable: !1, value: !0 });
    });
  }
  return [e, r];
}
function Re(e, r, s) {
  return (e.set(s), r);
}
function be(e) {
  var r = E;
  try {
    return ((E = !1), [e(), E]);
  } finally {
    E = r;
  }
}
const Se = {
  get(e, r) {
    if (!e.exclude.includes(r)) return e.props[r];
  },
  set(e, r) {
    return !1;
  },
  getOwnPropertyDescriptor(e, r) {
    if (!e.exclude.includes(r) && r in e.props)
      return { enumerable: !0, configurable: !0, value: e.props[r] };
  },
  has(e, r) {
    return e.exclude.includes(r) ? !1 : r in e.props;
  },
  ownKeys(e) {
    return Reflect.ownKeys(e.props).filter((r) => !e.exclude.includes(r));
  },
};
function Te(e, r, s) {
  return new Proxy({ props: e, exclude: r }, Se);
}
const he = {
  get(e, r) {
    if (!e.exclude.includes(r))
      return (P(e.version), r in e.special ? e.special[r]() : e.props[r]);
  },
  set(e, r, s) {
    if (!(r in e.special)) {
      var n = A;
      try {
        (y(e.parent_effect),
          (e.special[r] = Pe(
            {
              get [r]() {
                return e.props[r];
              },
            },
            r,
            U,
          )));
      } finally {
        y(n);
      }
    }
    return (e.special[r](s), g(e.version), !0);
  },
  getOwnPropertyDescriptor(e, r) {
    if (!e.exclude.includes(r) && r in e.props)
      return { enumerable: !0, configurable: !0, value: e.props[r] };
  },
  deleteProperty(e, r) {
    return (e.exclude.includes(r) || (e.exclude.push(r), g(e.version)), !0);
  },
  has(e, r) {
    return e.exclude.includes(r) ? !1 : r in e.props;
  },
  ownKeys(e) {
    return Reflect.ownKeys(e.props).filter((r) => !e.exclude.includes(r));
  },
};
function Ae(e, r) {
  return new Proxy(
    { props: e, exclude: r, special: {}, version: ee(0), parent_effect: A },
    he,
  );
}
function Pe(e, r, s, n) {
  var h;
  var i = !le || (s & ce) !== 0,
    t = (s & te) !== 0,
    l = (s & oe) !== 0,
    o = n,
    v = !0,
    m = () => (v && ((v = !1), (o = l ? fe(n) : n)), o),
    f;
  if (t) {
    var x = ve in e || pe in e;
    f =
      ((h = re(e, r)) == null ? void 0 : h.set) ??
      (x && r in e ? (a) => (e[r] = a) : void 0);
  }
  var _,
    c = !1;
  (t ? ([_, c] = be(() => e[r])) : (_ = e[r]),
    _ === void 0 && n !== void 0 && ((_ = m()), f && (i && ne(), f(_))));
  var u;
  if (
    (i
      ? (u = () => {
          var a = e[r];
          return a === void 0 ? m() : ((v = !0), a);
        })
      : (u = () => {
          var a = e[r];
          return (a !== void 0 && (o = void 0), a === void 0 ? o : a);
        }),
    i && !(s & U))
  )
    return u;
  if (f) {
    var I = e.$$legacy;
    return function (a, b) {
      return arguments.length > 0
        ? ((!i || !b || I || c) && f(b ? u() : a), a)
        : u();
    };
  }
  var p = !1,
    d = (s & de ? ue : ie)(() => ((p = !1), u()));
  t && P(d);
  var S = A;
  return function (a, b) {
    if (arguments.length > 0) {
      const O = b ? P(d) : i && t ? se(a) : a;
      return (L(d, O), (p = !0), o !== void 0 && (o = O), a);
    }
    return (_e && p) || S.f & ae ? d.v : P(d);
  };
}
export { Ee as a, Re as b, xe as i, Ae as l, Pe as p, Te as r, Ie as s };
