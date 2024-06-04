const UUID_DIGITS = "0123456789abcdef";
class UUID {
  constructor(t) {
    this.bytes = t;
  }
  static ofInner(t) {
    if (16 !== t.length) throw new TypeError("not 128-bit length");
    return new UUID(t);
  }
  static fromFieldsV7(t, e, r, n) {
    if (
      !Number.isInteger(t) ||
      !Number.isInteger(e) ||
      !Number.isInteger(r) ||
      !Number.isInteger(n) ||
      t < 0 ||
      e < 0 ||
      r < 0 ||
      n < 0 ||
      t > 0xffffffffffff ||
      e > 4095 ||
      r > 1073741823 ||
      n > 4294967295
    )
      throw new RangeError("invalid field value");
    const i = new Uint8Array(16);
    return (
      (i[0] = t / 2 ** 40),
      (i[1] = t / 2 ** 32),
      (i[2] = t / 2 ** 24),
      (i[3] = t / 65536),
      (i[4] = t / 256),
      (i[5] = t),
      (i[6] = 112 | (e >>> 8)),
      (i[7] = e),
      (i[8] = 128 | (r >>> 24)),
      (i[9] = r >>> 16),
      (i[10] = r >>> 8),
      (i[11] = r),
      (i[12] = n >>> 24),
      (i[13] = n >>> 16),
      (i[14] = n >>> 8),
      (i[15] = n),
      new UUID(i)
    );
  }
  static parse(t) {
    var e, r, n, i;
    let o;
    switch (t.length) {
      case 32:
        o = null === (e = /^[0-9a-f]{32}$/i.exec(t)) || void 0 === e ? void 0 : e[0];
        break;
      case 36:
        o = null === (r = /^([0-9a-f]{8})-([0-9a-f]{4})-([0-9a-f]{4})-([0-9a-f]{4})-([0-9a-f]{12})$/i.exec(t)) || void 0 === r ? void 0 : r.slice(1, 6).join("");
        break;
      case 38:
        o = null === (n = /^\{([0-9a-f]{8})-([0-9a-f]{4})-([0-9a-f]{4})-([0-9a-f]{4})-([0-9a-f]{12})\}$/i.exec(t)) || void 0 === n ? void 0 : n.slice(1, 6).join("");
        break;
      case 45:
        o = null === (i = /^urn:uuid:([0-9a-f]{8})-([0-9a-f]{4})-([0-9a-f]{4})-([0-9a-f]{4})-([0-9a-f]{12})$/i.exec(t)) || void 0 === i ? void 0 : i.slice(1, 6).join("");
    }
    if (o) {
      const t = new Uint8Array(16);
      for (let e = 0; e < 16; e += 4) {
        const r = parseInt(o.substring(2 * e, 2 * e + 8), 16);
        (t[e + 0] = r >>> 24), (t[e + 1] = r >>> 16), (t[e + 2] = r >>> 8), (t[e + 3] = r);
      }
      return new UUID(t);
    }
    throw new SyntaxError("could not parse UUID string");
  }
  toString() {
    let t = "";
    for (let e = 0; e < this.bytes.length; e++) (t += UUID_DIGITS.charAt(this.bytes[e] >>> 4)), (t += UUID_DIGITS.charAt(15 & this.bytes[e])), (3 !== e && 5 !== e && 7 !== e && 9 !== e) || (t += "-");
    return t;
  }
  toHex() {
    let t = "";
    for (let e = 0; e < this.bytes.length; e++) (t += UUID_DIGITS.charAt(this.bytes[e] >>> 4)), (t += UUID_DIGITS.charAt(15 & this.bytes[e]));
    return t;
  }
  toJSON() {
    return this.toString();
  }
  getVariant() {
    const t = this.bytes[8] >>> 4;
    if (t < 0) throw new Error("unreachable");
    if (t <= 7) return this.bytes.every((t) => 0 === t) ? "NIL" : "VAR_0";
    if (t <= 11) return "VAR_10";
    if (t <= 13) return "VAR_110";
    if (t <= 15) return this.bytes.every((t) => 255 === t) ? "MAX" : "VAR_RESERVED";
    throw new Error("unreachable");
  }
  getVersion() {
    return "VAR_10" === this.getVariant() ? this.bytes[6] >>> 4 : void 0;
  }
  clone() {
    return new UUID(this.bytes.slice(0));
  }
  equals(t) {
    return 0 === this.compareTo(t);
  }
  compareTo(t) {
    for (let e = 0; e < 16; e++) {
      const r = this.bytes[e] - t.bytes[e];
      if (0 !== r) return Math.sign(r);
    }
    return 0;
  }
}
class V7Generator {
  constructor(t) {
    (this.timestamp = 0), (this.counter = 0), (this.random = null != t ? t : getDefaultRandom());
  }
  generate() {
    return this.generateOrResetCore(Date.now(), 1e4);
  }
  generateOrAbort() {
    return this.generateOrAbortCore(Date.now(), 1e4);
  }
  generateOrResetCore(t, e) {
    let r = this.generateOrAbortCore(t, e);
    return void 0 === r && ((this.timestamp = 0), (r = this.generateOrAbortCore(t, e))), r;
  }
  generateOrAbortCore(t, e) {
    if (!Number.isInteger(t) || t < 1 || t > 0xffffffffffff) throw new RangeError("`unixTsMs` must be a 48-bit positive integer");
    if (e < 0 || e > 0xffffffffffff) throw new RangeError("`rollbackAllowance` out of reasonable range");
    if (t > this.timestamp) (this.timestamp = t), this.resetCounter();
    else {
      if (!(t + e >= this.timestamp)) return;
      this.counter++, this.counter > 4398046511103 && (this.timestamp++, this.resetCounter());
    }
    return UUID.fromFieldsV7(this.timestamp, Math.trunc(this.counter / 2 ** 30), this.counter & (2 ** 30 - 1), this.random.nextUint32());
  }
  resetCounter() {
    this.counter = 1024 * this.random.nextUint32() + (1023 & this.random.nextUint32());
  }
  generateV4() {
    const t = new Uint8Array(Uint32Array.of(this.random.nextUint32(), this.random.nextUint32(), this.random.nextUint32(), this.random.nextUint32()).buffer);
    return (t[6] = 64 | (t[6] >>> 4)), (t[8] = 128 | (t[8] >>> 2)), UUID.ofInner(t);
  }
}
const getDefaultRandom = () => {
  if ("undefined" != typeof crypto && void 0 !== crypto.getRandomValues) return new BufferedCryptoRandom();
  if ("undefined" != typeof UUIDV7_DENY_WEAK_RNG && UUIDV7_DENY_WEAK_RNG) throw new Error("no cryptographically strong RNG available");
  return { nextUint32: () => 65536 * Math.trunc(65536 * Math.random()) + Math.trunc(65536 * Math.random()) };
};
class BufferedCryptoRandom {
  constructor() {
    (this.buffer = new Uint32Array(8)), (this.cursor = 65535);
  }
  nextUint32() {
    return this.cursor >= this.buffer.length && (crypto.getRandomValues(this.buffer), (this.cursor = 0)), this.buffer[this.cursor++];
  }
}
let defaultGenerator;
const uuidv7 = () => uuidv7obj().toString();
const uuidv7obj = () => (defaultGenerator || (defaultGenerator = new V7Generator())).generate();
const uuidv4 = () => uuidv4obj().toString();
const uuidv4obj = () => (defaultGenerator || (defaultGenerator = new V7Generator())).generateV4();
