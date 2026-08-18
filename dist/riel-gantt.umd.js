(function(global, factory) {
  typeof exports === "object" && typeof module !== "undefined" ? module.exports = factory() : typeof define === "function" && define.amd ? define(factory) : (global = typeof globalThis !== "undefined" ? globalThis : global || self, global.Gantt = factory());
})(this, (function() {
  "use strict";
  var hookCallback;
  function hooks() {
    return hookCallback.apply(null, arguments);
  }
  function setHookCallback(callback) {
    hookCallback = callback;
  }
  function isArray(input) {
    return input instanceof Array || Object.prototype.toString.call(input) === "[object Array]";
  }
  function isObject(input) {
    return input != null && Object.prototype.toString.call(input) === "[object Object]";
  }
  function hasOwnProp(a, b) {
    return Object.prototype.hasOwnProperty.call(a, b);
  }
  function isObjectEmpty(obj) {
    if (Object.getOwnPropertyNames) {
      return Object.getOwnPropertyNames(obj).length === 0;
    } else {
      var k;
      for (k in obj) {
        if (hasOwnProp(obj, k)) {
          return false;
        }
      }
      return true;
    }
  }
  function isUndefined(input) {
    return input === void 0;
  }
  function isNumber(input) {
    return typeof input === "number" || Object.prototype.toString.call(input) === "[object Number]";
  }
  function isDate(input) {
    return input instanceof Date || Object.prototype.toString.call(input) === "[object Date]";
  }
  function map(arr, fn) {
    var res = [], i, arrLen = arr.length;
    for (i = 0; i < arrLen; ++i) {
      res.push(fn(arr[i], i));
    }
    return res;
  }
  function extend(a, b) {
    for (var i in b) {
      if (hasOwnProp(b, i)) {
        a[i] = b[i];
      }
    }
    if (hasOwnProp(b, "toString")) {
      a.toString = b.toString;
    }
    if (hasOwnProp(b, "valueOf")) {
      a.valueOf = b.valueOf;
    }
    return a;
  }
  function createUTC(input, format2, locale2, strict) {
    return createLocalOrUTC(input, format2, locale2, strict, true).utc();
  }
  function defaultParsingFlags() {
    return {
      empty: false,
      unusedTokens: [],
      unusedInput: [],
      overflow: -2,
      charsLeftOver: 0,
      nullInput: false,
      invalidEra: null,
      invalidMonth: null,
      invalidFormat: false,
      userInvalidated: false,
      iso: false,
      parsedDateParts: [],
      era: null,
      meridiem: null,
      rfc2822: false,
      weekdayMismatch: false
    };
  }
  function getParsingFlags(m) {
    if (m._pf == null) {
      m._pf = defaultParsingFlags();
    }
    return m._pf;
  }
  var some;
  if (Array.prototype.some) {
    some = Array.prototype.some;
  } else {
    some = function(fun) {
      var t = Object(this), len = t.length >>> 0, i;
      for (i = 0; i < len; i++) {
        if (i in t && fun.call(this, t[i], i, t)) {
          return true;
        }
      }
      return false;
    };
  }
  function isValid(m) {
    var flags = null, parsedParts = false, isNowValid = m._d && !isNaN(m._d.getTime());
    if (isNowValid) {
      flags = getParsingFlags(m);
      parsedParts = some.call(flags.parsedDateParts, function(i) {
        return i != null;
      });
      isNowValid = flags.overflow < 0 && !flags.empty && !flags.invalidEra && !flags.invalidMonth && !flags.invalidWeekday && !flags.weekdayMismatch && !flags.nullInput && !flags.invalidFormat && !flags.userInvalidated && (!flags.meridiem || flags.meridiem && parsedParts);
      if (m._strict) {
        isNowValid = isNowValid && flags.charsLeftOver === 0 && flags.unusedTokens.length === 0 && flags.bigHour === void 0;
      }
    }
    if (Object.isFrozen == null || !Object.isFrozen(m)) {
      m._isValid = isNowValid;
    } else {
      return isNowValid;
    }
    return m._isValid;
  }
  function createInvalid(flags) {
    var m = createUTC(NaN);
    if (flags != null) {
      extend(getParsingFlags(m), flags);
    } else {
      getParsingFlags(m).userInvalidated = true;
    }
    return m;
  }
  var momentProperties = hooks.momentProperties = [], updateInProgress = false;
  function copyConfig(to2, from2) {
    var i, prop, val, momentPropertiesLen = momentProperties.length;
    if (!isUndefined(from2._isAMomentObject)) {
      to2._isAMomentObject = from2._isAMomentObject;
    }
    if (!isUndefined(from2._i)) {
      to2._i = from2._i;
    }
    if (!isUndefined(from2._f)) {
      to2._f = from2._f;
    }
    if (!isUndefined(from2._l)) {
      to2._l = from2._l;
    }
    if (!isUndefined(from2._strict)) {
      to2._strict = from2._strict;
    }
    if (!isUndefined(from2._tzm)) {
      to2._tzm = from2._tzm;
    }
    if (!isUndefined(from2._isUTC)) {
      to2._isUTC = from2._isUTC;
    }
    if (!isUndefined(from2._offset)) {
      to2._offset = from2._offset;
    }
    if (!isUndefined(from2._pf)) {
      to2._pf = getParsingFlags(from2);
    }
    if (!isUndefined(from2._locale)) {
      to2._locale = from2._locale;
    }
    if (momentPropertiesLen > 0) {
      for (i = 0; i < momentPropertiesLen; i++) {
        prop = momentProperties[i];
        val = from2[prop];
        if (!isUndefined(val)) {
          to2[prop] = val;
        }
      }
    }
    return to2;
  }
  function Moment(config) {
    copyConfig(this, config);
    this._d = new Date(config._d != null ? config._d.getTime() : NaN);
    if (!this.isValid()) {
      this._d = /* @__PURE__ */ new Date(NaN);
    }
    if (updateInProgress === false) {
      updateInProgress = true;
      hooks.updateOffset(this);
      updateInProgress = false;
    }
  }
  function isMoment(obj) {
    return obj instanceof Moment || obj != null && obj._isAMomentObject != null;
  }
  function warn(msg) {
    if (hooks.suppressDeprecationWarnings === false && typeof console !== "undefined" && console.warn) {
      console.warn("Deprecation warning: " + msg);
    }
  }
  function deprecate(msg, fn) {
    var firstTime = true;
    return extend(function() {
      if (hooks.deprecationHandler != null) {
        hooks.deprecationHandler(null, msg);
      }
      if (firstTime) {
        var args = [], arg, i, key, argLen = arguments.length;
        for (i = 0; i < argLen; i++) {
          arg = "";
          if (typeof arguments[i] === "object") {
            arg += "\n[" + i + "] ";
            for (key in arguments[0]) {
              if (hasOwnProp(arguments[0], key)) {
                arg += key + ": " + arguments[0][key] + ", ";
              }
            }
            arg = arg.slice(0, -2);
          } else {
            arg = arguments[i];
          }
          args.push(arg);
        }
        warn(
          msg + "\nArguments: " + Array.prototype.slice.call(args).join("") + "\n" + new Error().stack
        );
        firstTime = false;
      }
      return fn.apply(this, arguments);
    }, fn);
  }
  var deprecations = {};
  function deprecateSimple(name, msg) {
    if (hooks.deprecationHandler != null) {
      hooks.deprecationHandler(name, msg);
    }
    if (!deprecations[name]) {
      warn(msg);
      deprecations[name] = true;
    }
  }
  hooks.suppressDeprecationWarnings = false;
  hooks.deprecationHandler = null;
  function isFunction(input) {
    return typeof Function !== "undefined" && input instanceof Function || Object.prototype.toString.call(input) === "[object Function]";
  }
  function set(config) {
    var prop, i;
    for (i in config) {
      if (hasOwnProp(config, i)) {
        prop = config[i];
        if (isFunction(prop)) {
          this[i] = prop;
        } else {
          this["_" + i] = prop;
        }
      }
    }
    this._config = config;
    this._dayOfMonthOrdinalParseLenient = new RegExp(
      (this._dayOfMonthOrdinalParse.source || this._ordinalParse.source) + "|" + /\d{1,2}/.source
    );
  }
  function mergeConfigs(parentConfig, childConfig) {
    var res = extend({}, parentConfig), prop;
    for (prop in childConfig) {
      if (hasOwnProp(childConfig, prop)) {
        if (isObject(parentConfig[prop]) && isObject(childConfig[prop])) {
          res[prop] = {};
          extend(res[prop], parentConfig[prop]);
          extend(res[prop], childConfig[prop]);
        } else if (childConfig[prop] != null) {
          res[prop] = childConfig[prop];
        } else {
          delete res[prop];
        }
      }
    }
    for (prop in parentConfig) {
      if (hasOwnProp(parentConfig, prop) && !hasOwnProp(childConfig, prop) && isObject(parentConfig[prop])) {
        res[prop] = extend({}, res[prop]);
      }
    }
    return res;
  }
  function Locale(config) {
    if (config != null) {
      this.set(config);
    }
  }
  var keys;
  if (Object.keys) {
    keys = Object.keys;
  } else {
    keys = function(obj) {
      var i, res = [];
      for (i in obj) {
        if (hasOwnProp(obj, i)) {
          res.push(i);
        }
      }
      return res;
    };
  }
  var defaultCalendar = {
    sameDay: "[Today at] LT",
    nextDay: "[Tomorrow at] LT",
    nextWeek: "dddd [at] LT",
    lastDay: "[Yesterday at] LT",
    lastWeek: "[Last] dddd [at] LT",
    sameElse: "L"
  };
  function calendar(key, mom, now2) {
    var output = this._calendar[key] || this._calendar["sameElse"];
    return isFunction(output) ? output.call(mom, now2) : output;
  }
  function zeroFill(number, targetLength, forceSign) {
    var absNumber = "" + Math.abs(number), zerosToFill = targetLength - absNumber.length, sign2 = number >= 0;
    return (sign2 ? forceSign ? "+" : "" : "-") + Math.pow(10, Math.max(0, zerosToFill)).toString().substr(1) + absNumber;
  }
  var formattingTokens = /(\[[^\[]*\])|(\\)?([Hh]mm(ss)?|Mo|MM?M?M?|Do|DDDo|DD?D?D?|ddd?d?|do?|w[o|w]?|W[o|W]?|Qo?|N{1,5}|YYYYYY|YYYYY|YYYY|YY|y{2,4}|yo?|gg(ggg?)?|GG(GGG?)?|e|E|a|A|hh?|HH?|kk?|mm?|ss?|S{1,9}|x|X|zz?|ZZ?|.)/g, localFormattingTokens = /(\[[^\[]*\])|(\\)?(LTS|LT|LL?L?L?|l{1,4})/g, formatFunctions = {}, formatTokenFunctions = {};
  function addFormatToken(token2, padded, ordinal2, callback) {
    var func = callback;
    if (typeof callback === "string") {
      func = function() {
        return this[callback]();
      };
    }
    if (token2) {
      formatTokenFunctions[token2] = func;
    }
    if (padded) {
      formatTokenFunctions[padded[0]] = function() {
        return zeroFill(func.apply(this, arguments), padded[1], padded[2]);
      };
    }
    if (ordinal2) {
      formatTokenFunctions[ordinal2] = function() {
        return this.localeData().ordinal(
          func.apply(this, arguments),
          token2
        );
      };
    }
  }
  function removeFormattingTokens(input) {
    if (input.match(/\[[\s\S]/)) {
      return input.replace(/^\[|\]$/g, "");
    }
    return input.replace(/\\/g, "");
  }
  function makeFormatFunction(format2) {
    var array = format2.match(formattingTokens), i, length;
    for (i = 0, length = array.length; i < length; i++) {
      if (formatTokenFunctions[array[i]]) {
        array[i] = formatTokenFunctions[array[i]];
      } else {
        array[i] = removeFormattingTokens(array[i]);
      }
    }
    return function(mom) {
      var output = "", i2;
      for (i2 = 0; i2 < length; i2++) {
        output += isFunction(array[i2]) ? array[i2].call(mom, format2) : array[i2];
      }
      return output;
    };
  }
  function formatMoment(m, format2) {
    if (!m.isValid()) {
      return m.localeData().invalidDate();
    }
    format2 = expandFormat(format2, m.localeData());
    formatFunctions[format2] = formatFunctions[format2] || makeFormatFunction(format2);
    return formatFunctions[format2](m);
  }
  function expandFormat(format2, locale2) {
    var i = 5;
    function replaceLongDateFormatTokens(input) {
      return locale2.longDateFormat(input) || input;
    }
    localFormattingTokens.lastIndex = 0;
    while (i >= 0 && localFormattingTokens.test(format2)) {
      format2 = format2.replace(
        localFormattingTokens,
        replaceLongDateFormatTokens
      );
      localFormattingTokens.lastIndex = 0;
      i -= 1;
    }
    return format2;
  }
  var defaultLongDateFormat = {
    LTS: "h:mm:ss A",
    LT: "h:mm A",
    L: "MM/DD/YYYY",
    LL: "MMMM D, YYYY",
    LLL: "MMMM D, YYYY h:mm A",
    LLLL: "dddd, MMMM D, YYYY h:mm A"
  };
  function longDateFormat(key) {
    var format2 = this._longDateFormat[key], formatUpper = this._longDateFormat[key.toUpperCase()];
    if (format2 || !formatUpper) {
      return format2;
    }
    this._longDateFormat[key] = formatUpper.match(formattingTokens).map(function(tok) {
      if (tok === "MMMM" || tok === "MM" || tok === "DD" || tok === "dddd") {
        return tok.slice(1);
      }
      return tok;
    }).join("");
    return this._longDateFormat[key];
  }
  var defaultInvalidDate = "Invalid date";
  function invalidDate() {
    return this._invalidDate;
  }
  var defaultOrdinal = "%d", defaultDayOfMonthOrdinalParse = /\d{1,2}/;
  function ordinal(number) {
    return this._ordinal.replace("%d", number);
  }
  var defaultRelativeTime = {
    future: "in %s",
    past: "%s ago",
    s: "a few seconds",
    ss: "%d seconds",
    m: "a minute",
    mm: "%d minutes",
    h: "an hour",
    hh: "%d hours",
    d: "a day",
    dd: "%d days",
    w: "a week",
    ww: "%d weeks",
    M: "a month",
    MM: "%d months",
    y: "a year",
    yy: "%d years"
  };
  function relativeTime(number, withoutSuffix, string, isFuture) {
    var output = this._relativeTime[string];
    return isFunction(output) ? output(number, withoutSuffix, string, isFuture) : output.replace(/%d/i, number);
  }
  function pastFuture(diff2, output) {
    var format2 = this._relativeTime[diff2 > 0 ? "future" : "past"];
    return isFunction(format2) ? format2(output) : format2.replace(/%s/i, output);
  }
  var aliases = {
    D: "date",
    dates: "date",
    date: "date",
    d: "day",
    days: "day",
    day: "day",
    e: "weekday",
    weekdays: "weekday",
    weekday: "weekday",
    E: "isoWeekday",
    isoweekdays: "isoWeekday",
    isoweekday: "isoWeekday",
    DDD: "dayOfYear",
    dayofyears: "dayOfYear",
    dayofyear: "dayOfYear",
    h: "hour",
    hours: "hour",
    hour: "hour",
    ms: "millisecond",
    milliseconds: "millisecond",
    millisecond: "millisecond",
    m: "minute",
    minutes: "minute",
    minute: "minute",
    M: "month",
    months: "month",
    month: "month",
    Q: "quarter",
    quarters: "quarter",
    quarter: "quarter",
    s: "second",
    seconds: "second",
    second: "second",
    gg: "weekYear",
    weekyears: "weekYear",
    weekyear: "weekYear",
    GG: "isoWeekYear",
    isoweekyears: "isoWeekYear",
    isoweekyear: "isoWeekYear",
    w: "week",
    weeks: "week",
    week: "week",
    W: "isoWeek",
    isoweeks: "isoWeek",
    isoweek: "isoWeek",
    y: "year",
    years: "year",
    year: "year"
  };
  function normalizeUnits(units) {
    return typeof units === "string" ? aliases[units] || aliases[units.toLowerCase()] : void 0;
  }
  function normalizeObjectUnits(inputObject) {
    var normalizedInput = {}, normalizedProp, prop;
    for (prop in inputObject) {
      if (hasOwnProp(inputObject, prop)) {
        normalizedProp = normalizeUnits(prop);
        if (normalizedProp) {
          normalizedInput[normalizedProp] = inputObject[prop];
        }
      }
    }
    return normalizedInput;
  }
  var priorities = {
    date: 9,
    day: 11,
    weekday: 11,
    isoWeekday: 11,
    dayOfYear: 4,
    hour: 13,
    millisecond: 16,
    minute: 14,
    month: 8,
    quarter: 7,
    second: 15,
    weekYear: 1,
    isoWeekYear: 1,
    week: 5,
    isoWeek: 5,
    year: 1
  };
  function getPrioritizedUnits(unitsObj) {
    var units = [], u;
    for (u in unitsObj) {
      if (hasOwnProp(unitsObj, u)) {
        units.push({ unit: u, priority: priorities[u] });
      }
    }
    units.sort(function(a, b) {
      return a.priority - b.priority;
    });
    return units;
  }
  var match1 = /\d/, match2 = /\d\d/, match3 = /\d{3}/, match4 = /\d{4}/, match6 = /[+-]?\d{6}/, match1to2 = /\d\d?/, match3to4 = /\d\d\d\d?/, match5to6 = /\d\d\d\d\d\d?/, match1to3 = /\d{1,3}/, match1to4 = /\d{1,4}/, match1to6 = /[+-]?\d{1,6}/, matchUnsigned = /\d+/, matchSigned = /[+-]?\d+/, matchOffset = /Z|[+-]\d\d:?\d\d/gi, matchShortOffset = /Z|[+-]\d\d(?::?\d\d)?/gi, matchTimestamp = /[+-]?\d+(\.\d{1,3})?/, matchWord = /[0-9]{0,256}['a-z\u00A0-\u05FF\u0700-\uD7FF\uF900-\uFDCF\uFDF0-\uFF07\uFF10-\uFFEF]{1,256}|[\u0600-\u06FF\/]{1,256}(\s*?[\u0600-\u06FF]{1,256}){1,2}/i, match1to2NoLeadingZero = /^[1-9]\d?/, match1to2HasZero = /^([1-9]\d|\d)/, regexes;
  regexes = {};
  function addRegexToken(token2, regex, strictRegex) {
    regexes[token2] = isFunction(regex) ? regex : function(isStrict, localeData2) {
      return isStrict && strictRegex ? strictRegex : regex;
    };
  }
  function getParseRegexForToken(token2, config) {
    if (!hasOwnProp(regexes, token2)) {
      return new RegExp(unescapeFormat(token2));
    }
    return regexes[token2](config._strict, config._locale);
  }
  function unescapeFormat(s) {
    return regexEscape(
      s.replace("\\", "").replace(
        /\\(\[)|\\(\])|\[([^\]\[]*)\]|\\(.)/g,
        function(matched, p1, p2, p3, p4) {
          return p1 || p2 || p3 || p4;
        }
      )
    );
  }
  function regexEscape(s) {
    return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
  }
  function absFloor(number) {
    if (number < 0) {
      return Math.ceil(number) || 0;
    } else {
      return Math.floor(number);
    }
  }
  function toInt(argumentForCoercion) {
    var coercedNumber = +argumentForCoercion, value = 0;
    if (coercedNumber !== 0 && isFinite(coercedNumber)) {
      value = absFloor(coercedNumber);
    }
    return value;
  }
  var tokens = {};
  function addParseToken(token2, callback) {
    var i, func = callback, tokenLen;
    if (typeof token2 === "string") {
      token2 = [token2];
    }
    if (isNumber(callback)) {
      func = function(input, array) {
        array[callback] = toInt(input);
      };
    }
    tokenLen = token2.length;
    for (i = 0; i < tokenLen; i++) {
      tokens[token2[i]] = func;
    }
  }
  function addWeekParseToken(token2, callback) {
    addParseToken(token2, function(input, array, config, token3) {
      config._w = config._w || {};
      callback(input, config._w, config, token3);
    });
  }
  function addTimeToArrayFromToken(token2, input, config) {
    if (input != null && hasOwnProp(tokens, token2)) {
      tokens[token2](input, config._a, config, token2);
    }
  }
  function isLeapYear(year) {
    return year % 4 === 0 && year % 100 !== 0 || year % 400 === 0;
  }
  var YEAR$1 = 0, MONTH$1 = 1, DATE = 2, HOUR$1 = 3, MINUTE$1 = 4, SECOND$1 = 5, MILLISECOND$1 = 6, WEEK = 7, WEEKDAY = 8;
  addFormatToken("Y", 0, 0, function() {
    var y = this.year();
    return y <= 9999 ? zeroFill(y, 4) : "+" + y;
  });
  addFormatToken(0, ["YY", 2], 0, function() {
    return this.year() % 100;
  });
  addFormatToken(0, ["YYYY", 4], 0, "year");
  addFormatToken(0, ["YYYYY", 5], 0, "year");
  addFormatToken(0, ["YYYYYY", 6, true], 0, "year");
  addRegexToken("Y", matchSigned);
  addRegexToken("YY", match1to2, match2);
  addRegexToken("YYYY", match1to4, match4);
  addRegexToken("YYYYY", match1to6, match6);
  addRegexToken("YYYYYY", match1to6, match6);
  addParseToken(["YYYYY", "YYYYYY"], YEAR$1);
  addParseToken("YYYY", function(input, array) {
    array[YEAR$1] = input.length === 2 ? hooks.parseTwoDigitYear(input) : toInt(input);
  });
  addParseToken("YY", function(input, array) {
    array[YEAR$1] = hooks.parseTwoDigitYear(input);
  });
  addParseToken("Y", function(input, array) {
    array[YEAR$1] = parseInt(input, 10);
  });
  function daysInYear(year) {
    return isLeapYear(year) ? 366 : 365;
  }
  hooks.parseTwoDigitYear = function(input) {
    return toInt(input) + (toInt(input) > 68 ? 1900 : 2e3);
  };
  var getSetYear = makeGetSet("FullYear", true);
  function getIsLeapYear() {
    return isLeapYear(this.year());
  }
  function makeGetSet(unit, keepTime) {
    return function(value) {
      if (value != null) {
        set$1(this, unit, value);
        hooks.updateOffset(this, keepTime);
        return this;
      } else {
        return get(this, unit);
      }
    };
  }
  function get(mom, unit) {
    if (!mom.isValid()) {
      return NaN;
    }
    var d = mom._d, isUTC = mom._isUTC;
    switch (unit) {
      case "Milliseconds":
        return isUTC ? d.getUTCMilliseconds() : d.getMilliseconds();
      case "Seconds":
        return isUTC ? d.getUTCSeconds() : d.getSeconds();
      case "Minutes":
        return isUTC ? d.getUTCMinutes() : d.getMinutes();
      case "Hours":
        return isUTC ? d.getUTCHours() : d.getHours();
      case "Date":
        return isUTC ? d.getUTCDate() : d.getDate();
      case "Day":
        return isUTC ? d.getUTCDay() : d.getDay();
      case "Month":
        return isUTC ? d.getUTCMonth() : d.getMonth();
      case "FullYear":
        return isUTC ? d.getUTCFullYear() : d.getFullYear();
      default:
        return NaN;
    }
  }
  function set$1(mom, unit, value) {
    var d, isUTC, year, month, date;
    if (!mom.isValid() || isNaN(value)) {
      return;
    }
    d = mom._d;
    isUTC = mom._isUTC;
    switch (unit) {
      case "Milliseconds":
        return void (isUTC ? d.setUTCMilliseconds(value) : d.setMilliseconds(value));
      case "Seconds":
        return void (isUTC ? d.setUTCSeconds(value) : d.setSeconds(value));
      case "Minutes":
        return void (isUTC ? d.setUTCMinutes(value) : d.setMinutes(value));
      case "Hours":
        return void (isUTC ? d.setUTCHours(value) : d.setHours(value));
      case "Date":
        return void (isUTC ? d.setUTCDate(value) : d.setDate(value));
      // case 'Day': // Not real
      //    return void (isUTC ? d.setUTCDay(value) : d.setDay(value));
      // case 'Month': // Not used because we need to pass two variables
      //     return void (isUTC ? d.setUTCMonth(value) : d.setMonth(value));
      case "FullYear":
        break;
      // See below ...
      default:
        return;
    }
    year = value;
    month = mom.month();
    date = mom.date();
    date = date === 29 && month === 1 && !isLeapYear(year) ? 28 : date;
    void (isUTC ? d.setUTCFullYear(year, month, date) : d.setFullYear(year, month, date));
  }
  function stringGet(units) {
    units = normalizeUnits(units);
    if (isFunction(this[units])) {
      return this[units]();
    }
    return this;
  }
  function stringSet(units, value) {
    if (typeof units === "object") {
      units = normalizeObjectUnits(units);
      var prioritized = getPrioritizedUnits(units), i, prioritizedLen = prioritized.length;
      for (i = 0; i < prioritizedLen; i++) {
        this[prioritized[i].unit](units[prioritized[i].unit]);
      }
    } else {
      units = normalizeUnits(units);
      if (isFunction(this[units])) {
        return this[units](value);
      }
    }
    return this;
  }
  function mod(n, x) {
    return (n % x + x) % x;
  }
  var indexOf;
  if (Array.prototype.indexOf) {
    indexOf = Array.prototype.indexOf;
  } else {
    indexOf = function(o) {
      var i;
      for (i = 0; i < this.length; ++i) {
        if (this[i] === o) {
          return i;
        }
      }
      return -1;
    };
  }
  function daysInMonth(year, month) {
    if (isNaN(year) || isNaN(month)) {
      return NaN;
    }
    var modMonth = mod(month, 12);
    year += (month - modMonth) / 12;
    return modMonth === 1 ? isLeapYear(year) ? 29 : 28 : 31 - modMonth % 7 % 2;
  }
  addFormatToken("M", ["MM", 2], "Mo", function() {
    return this.month() + 1;
  });
  addFormatToken("MMM", 0, 0, function(format2) {
    return this.localeData().monthsShort(this, format2);
  });
  addFormatToken("MMMM", 0, 0, function(format2) {
    return this.localeData().months(this, format2);
  });
  addRegexToken("M", match1to2, match1to2NoLeadingZero);
  addRegexToken("MM", match1to2, match2);
  addRegexToken("MMM", function(isStrict, locale2) {
    return locale2.monthsShortRegex(isStrict);
  });
  addRegexToken("MMMM", function(isStrict, locale2) {
    return locale2.monthsRegex(isStrict);
  });
  addParseToken(["M", "MM"], function(input, array) {
    array[MONTH$1] = toInt(input) - 1;
  });
  addParseToken(["MMM", "MMMM"], function(input, array, config, token2) {
    var month = config._locale.monthsParse(input, token2, config._strict);
    if (month != null) {
      array[MONTH$1] = month;
    } else {
      getParsingFlags(config).invalidMonth = input;
    }
  });
  var defaultLocaleMonths = "January_February_March_April_May_June_July_August_September_October_November_December".split(
    "_"
  ), defaultLocaleMonthsShort = "Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec".split("_"), MONTHS_IN_FORMAT = /D[oD]?(\[[^\[\]]*\]|\s)+MMMM?/, defaultMonthsShortRegex = matchWord, defaultMonthsRegex = matchWord;
  function localeMonths(m, format2) {
    if (!m) {
      return isArray(this._months) ? this._months : this._months["standalone"];
    }
    return isArray(this._months) ? this._months[m.month()] : this._months[(this._months.isFormat || MONTHS_IN_FORMAT).test(format2) ? "format" : "standalone"][m.month()];
  }
  function localeMonthsShort(m, format2) {
    if (!m) {
      return isArray(this._monthsShort) ? this._monthsShort : this._monthsShort["standalone"];
    }
    return isArray(this._monthsShort) ? this._monthsShort[m.month()] : this._monthsShort[MONTHS_IN_FORMAT.test(format2) ? "format" : "standalone"][m.month()];
  }
  function handleStrictParse(monthName, format2, strict) {
    var i, ii, mom, llc = monthName.toLocaleLowerCase();
    if (!this._monthsParse) {
      this._monthsParse = [];
      this._longMonthsParse = [];
      this._shortMonthsParse = [];
      for (i = 0; i < 12; ++i) {
        mom = createUTC([2e3, i]);
        this._shortMonthsParse[i] = this.monthsShort(
          mom,
          ""
        ).toLocaleLowerCase();
        this._longMonthsParse[i] = this.months(mom, "").toLocaleLowerCase();
      }
    }
    if (strict) {
      if (format2 === "MMM") {
        ii = indexOf.call(this._shortMonthsParse, llc);
        return ii !== -1 ? ii : null;
      } else {
        ii = indexOf.call(this._longMonthsParse, llc);
        return ii !== -1 ? ii : null;
      }
    } else {
      if (format2 === "MMM") {
        ii = indexOf.call(this._shortMonthsParse, llc);
        if (ii !== -1) {
          return ii;
        }
        ii = indexOf.call(this._longMonthsParse, llc);
        return ii !== -1 ? ii : null;
      } else {
        ii = indexOf.call(this._longMonthsParse, llc);
        if (ii !== -1) {
          return ii;
        }
        ii = indexOf.call(this._shortMonthsParse, llc);
        return ii !== -1 ? ii : null;
      }
    }
  }
  function localeMonthsParse(monthName, format2, strict) {
    var i, mom, regex;
    if (this._monthsParseExact) {
      return handleStrictParse.call(this, monthName, format2, strict);
    }
    if (!this._monthsParse) {
      this._monthsParse = [];
      this._longMonthsParse = [];
      this._shortMonthsParse = [];
    }
    for (i = 0; i < 12; i++) {
      mom = createUTC([2e3, i]);
      if (strict && !this._longMonthsParse[i]) {
        this._longMonthsParse[i] = new RegExp(
          "^" + this.months(mom, "").replace(".", "") + "$",
          "i"
        );
        this._shortMonthsParse[i] = new RegExp(
          "^" + this.monthsShort(mom, "").replace(".", "") + "$",
          "i"
        );
      }
      if (!strict && !this._monthsParse[i]) {
        regex = "^" + this.months(mom, "") + "|^" + this.monthsShort(mom, "");
        this._monthsParse[i] = new RegExp(regex.replace(".", ""), "i");
      }
      if (strict && format2 === "MMMM" && this._longMonthsParse[i].test(monthName)) {
        return i;
      } else if (strict && format2 === "MMM" && this._shortMonthsParse[i].test(monthName)) {
        return i;
      } else if (!strict && this._monthsParse[i].test(monthName)) {
        return i;
      }
    }
  }
  function setMonth(mom, value) {
    if (!mom.isValid()) {
      return mom;
    }
    if (typeof value === "string") {
      if (/^\d+$/.test(value)) {
        value = toInt(value);
      } else {
        value = mom.localeData().monthsParse(value);
        if (!isNumber(value)) {
          return mom;
        }
      }
    }
    var month = value, date = mom.date();
    date = date < 29 ? date : Math.min(date, daysInMonth(mom.year(), month));
    void (mom._isUTC ? mom._d.setUTCMonth(month, date) : mom._d.setMonth(month, date));
    return mom;
  }
  function getSetMonth(value) {
    if (value != null) {
      setMonth(this, value);
      hooks.updateOffset(this, true);
      return this;
    } else {
      return get(this, "Month");
    }
  }
  function getDaysInMonth() {
    return daysInMonth(this.year(), this.month());
  }
  function monthsShortRegex(isStrict) {
    if (this._monthsParseExact) {
      if (!hasOwnProp(this, "_monthsRegex")) {
        computeMonthsParse.call(this);
      }
      if (isStrict) {
        return this._monthsShortStrictRegex;
      } else {
        return this._monthsShortRegex;
      }
    } else {
      if (!hasOwnProp(this, "_monthsShortRegex")) {
        this._monthsShortRegex = defaultMonthsShortRegex;
      }
      return this._monthsShortStrictRegex && isStrict ? this._monthsShortStrictRegex : this._monthsShortRegex;
    }
  }
  function monthsRegex(isStrict) {
    if (this._monthsParseExact) {
      if (!hasOwnProp(this, "_monthsRegex")) {
        computeMonthsParse.call(this);
      }
      if (isStrict) {
        return this._monthsStrictRegex;
      } else {
        return this._monthsRegex;
      }
    } else {
      if (!hasOwnProp(this, "_monthsRegex")) {
        this._monthsRegex = defaultMonthsRegex;
      }
      return this._monthsStrictRegex && isStrict ? this._monthsStrictRegex : this._monthsRegex;
    }
  }
  function computeMonthsParse() {
    function cmpLenRev(a, b) {
      return b.length - a.length;
    }
    var shortPieces = [], longPieces = [], mixedPieces = [], i, mom, shortP, longP;
    for (i = 0; i < 12; i++) {
      mom = createUTC([2e3, i]);
      shortP = regexEscape(this.monthsShort(mom, ""));
      longP = regexEscape(this.months(mom, ""));
      shortPieces.push(shortP);
      longPieces.push(longP);
      mixedPieces.push(longP);
      mixedPieces.push(shortP);
    }
    shortPieces.sort(cmpLenRev);
    longPieces.sort(cmpLenRev);
    mixedPieces.sort(cmpLenRev);
    this._monthsRegex = new RegExp("^(" + mixedPieces.join("|") + ")", "i");
    this._monthsShortRegex = this._monthsRegex;
    this._monthsStrictRegex = new RegExp(
      "^(" + longPieces.join("|") + ")",
      "i"
    );
    this._monthsShortStrictRegex = new RegExp(
      "^(" + shortPieces.join("|") + ")",
      "i"
    );
  }
  function createDate(y, m, d, h, M, s, ms) {
    var date;
    if (y < 100 && y >= 0) {
      date = new Date(y + 400, m, d, h, M, s, ms);
      if (isFinite(date.getFullYear())) {
        date.setFullYear(y);
      }
    } else {
      date = new Date(y, m, d, h, M, s, ms);
    }
    return date;
  }
  function createUTCDate(y) {
    var date, args;
    if (y < 100 && y >= 0) {
      args = Array.prototype.slice.call(arguments);
      args[0] = y + 400;
      date = new Date(Date.UTC.apply(null, args));
      if (isFinite(date.getUTCFullYear())) {
        date.setUTCFullYear(y);
      }
    } else {
      date = new Date(Date.UTC.apply(null, arguments));
    }
    return date;
  }
  function firstWeekOffset(year, dow, doy) {
    var fwd = 7 + dow - doy, fwdlw = (7 + createUTCDate(year, 0, fwd).getUTCDay() - dow) % 7;
    return -fwdlw + fwd - 1;
  }
  function dayOfYearFromWeeks(year, week, weekday, dow, doy) {
    var localWeekday = (7 + weekday - dow) % 7, weekOffset = firstWeekOffset(year, dow, doy), dayOfYear = 1 + 7 * (week - 1) + localWeekday + weekOffset, resYear, resDayOfYear;
    if (dayOfYear <= 0) {
      resYear = year - 1;
      resDayOfYear = daysInYear(resYear) + dayOfYear;
    } else if (dayOfYear > daysInYear(year)) {
      resYear = year + 1;
      resDayOfYear = dayOfYear - daysInYear(year);
    } else {
      resYear = year;
      resDayOfYear = dayOfYear;
    }
    return {
      year: resYear,
      dayOfYear: resDayOfYear
    };
  }
  function weekOfYear(mom, dow, doy) {
    var weekOffset = firstWeekOffset(mom.year(), dow, doy), week = Math.floor((mom.dayOfYear() - weekOffset - 1) / 7) + 1, resWeek, resYear;
    if (week < 1) {
      resYear = mom.year() - 1;
      resWeek = week + weeksInYear(resYear, dow, doy);
    } else if (week > weeksInYear(mom.year(), dow, doy)) {
      resWeek = week - weeksInYear(mom.year(), dow, doy);
      resYear = mom.year() + 1;
    } else {
      resYear = mom.year();
      resWeek = week;
    }
    return {
      week: resWeek,
      year: resYear
    };
  }
  function weeksInYear(year, dow, doy) {
    var weekOffset = firstWeekOffset(year, dow, doy), weekOffsetNext = firstWeekOffset(year + 1, dow, doy);
    return (daysInYear(year) - weekOffset + weekOffsetNext) / 7;
  }
  addFormatToken("w", ["ww", 2], "wo", "week");
  addFormatToken("W", ["WW", 2], "Wo", "isoWeek");
  addRegexToken("w", match1to2, match1to2NoLeadingZero);
  addRegexToken("ww", match1to2, match2);
  addRegexToken("W", match1to2, match1to2NoLeadingZero);
  addRegexToken("WW", match1to2, match2);
  addWeekParseToken(
    ["w", "ww", "W", "WW"],
    function(input, week, config, token2) {
      week[token2.substr(0, 1)] = toInt(input);
    }
  );
  function localeWeek(mom) {
    return weekOfYear(mom, this._week.dow, this._week.doy).week;
  }
  var defaultLocaleWeek = {
    dow: 0,
    // Sunday is the first day of the week.
    doy: 6
    // The week that contains Jan 6th is the first week of the year.
  };
  function localeFirstDayOfWeek() {
    return this._week.dow;
  }
  function localeFirstDayOfYear() {
    return this._week.doy;
  }
  function getSetWeek(input) {
    var week = this.localeData().week(this);
    return input == null ? week : this.add((input - week) * 7, "d");
  }
  function getSetISOWeek(input) {
    var week = weekOfYear(this, 1, 4).week;
    return input == null ? week : this.add((input - week) * 7, "d");
  }
  addFormatToken("d", 0, "do", "day");
  addFormatToken("dd", 0, 0, function(format2) {
    return this.localeData().weekdaysMin(this, format2);
  });
  addFormatToken("ddd", 0, 0, function(format2) {
    return this.localeData().weekdaysShort(this, format2);
  });
  addFormatToken("dddd", 0, 0, function(format2) {
    return this.localeData().weekdays(this, format2);
  });
  addFormatToken("e", 0, 0, "weekday");
  addFormatToken("E", 0, 0, "isoWeekday");
  addRegexToken("d", match1to2);
  addRegexToken("e", match1to2);
  addRegexToken("E", match1to2);
  addRegexToken("dd", function(isStrict, locale2) {
    return locale2.weekdaysMinRegex(isStrict);
  });
  addRegexToken("ddd", function(isStrict, locale2) {
    return locale2.weekdaysShortRegex(isStrict);
  });
  addRegexToken("dddd", function(isStrict, locale2) {
    return locale2.weekdaysRegex(isStrict);
  });
  addWeekParseToken(["dd", "ddd", "dddd"], function(input, week, config, token2) {
    var weekday = config._locale.weekdaysParse(input, token2, config._strict);
    if (weekday != null) {
      week.d = weekday;
    } else {
      getParsingFlags(config).invalidWeekday = input;
    }
  });
  addWeekParseToken(["d", "e", "E"], function(input, week, config, token2) {
    week[token2] = toInt(input);
  });
  function parseWeekday(input, locale2) {
    if (typeof input !== "string") {
      return input;
    }
    if (!isNaN(input)) {
      return parseInt(input, 10);
    }
    input = locale2.weekdaysParse(input);
    if (typeof input === "number") {
      return input;
    }
    return null;
  }
  function parseIsoWeekday(input, locale2) {
    if (typeof input === "string") {
      return locale2.weekdaysParse(input) % 7 || 7;
    }
    return isNaN(input) ? null : input;
  }
  function shiftWeekdays(ws, n) {
    return ws.slice(n, 7).concat(ws.slice(0, n));
  }
  var defaultLocaleWeekdays = "Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday".split("_"), defaultLocaleWeekdaysShort = "Sun_Mon_Tue_Wed_Thu_Fri_Sat".split("_"), defaultLocaleWeekdaysMin = "Su_Mo_Tu_We_Th_Fr_Sa".split("_"), defaultWeekdaysRegex = matchWord, defaultWeekdaysShortRegex = matchWord, defaultWeekdaysMinRegex = matchWord;
  function localeWeekdays(m, format2) {
    var weekdays = isArray(this._weekdays) ? this._weekdays : this._weekdays[m && m !== true && this._weekdays.isFormat.test(format2) ? "format" : "standalone"];
    return m === true ? shiftWeekdays(weekdays, this._week.dow) : m ? weekdays[m.day()] : weekdays;
  }
  function localeWeekdaysShort(m) {
    return m === true ? shiftWeekdays(this._weekdaysShort, this._week.dow) : m ? this._weekdaysShort[m.day()] : this._weekdaysShort;
  }
  function localeWeekdaysMin(m) {
    return m === true ? shiftWeekdays(this._weekdaysMin, this._week.dow) : m ? this._weekdaysMin[m.day()] : this._weekdaysMin;
  }
  function handleStrictParse$1(weekdayName, format2, strict) {
    var i, ii, mom, llc = weekdayName.toLocaleLowerCase();
    if (!this._weekdaysParse) {
      this._weekdaysParse = [];
      this._shortWeekdaysParse = [];
      this._minWeekdaysParse = [];
      for (i = 0; i < 7; ++i) {
        mom = createUTC([2e3, 1]).day(i);
        this._minWeekdaysParse[i] = this.weekdaysMin(
          mom,
          ""
        ).toLocaleLowerCase();
        this._shortWeekdaysParse[i] = this.weekdaysShort(
          mom,
          ""
        ).toLocaleLowerCase();
        this._weekdaysParse[i] = this.weekdays(mom, "").toLocaleLowerCase();
      }
    }
    if (strict) {
      if (format2 === "dddd") {
        ii = indexOf.call(this._weekdaysParse, llc);
        return ii !== -1 ? ii : null;
      } else if (format2 === "ddd") {
        ii = indexOf.call(this._shortWeekdaysParse, llc);
        return ii !== -1 ? ii : null;
      } else {
        ii = indexOf.call(this._minWeekdaysParse, llc);
        return ii !== -1 ? ii : null;
      }
    } else {
      if (format2 === "dddd") {
        ii = indexOf.call(this._weekdaysParse, llc);
        if (ii !== -1) {
          return ii;
        }
        ii = indexOf.call(this._shortWeekdaysParse, llc);
        if (ii !== -1) {
          return ii;
        }
        ii = indexOf.call(this._minWeekdaysParse, llc);
        return ii !== -1 ? ii : null;
      } else if (format2 === "ddd") {
        ii = indexOf.call(this._shortWeekdaysParse, llc);
        if (ii !== -1) {
          return ii;
        }
        ii = indexOf.call(this._weekdaysParse, llc);
        if (ii !== -1) {
          return ii;
        }
        ii = indexOf.call(this._minWeekdaysParse, llc);
        return ii !== -1 ? ii : null;
      } else {
        ii = indexOf.call(this._minWeekdaysParse, llc);
        if (ii !== -1) {
          return ii;
        }
        ii = indexOf.call(this._weekdaysParse, llc);
        if (ii !== -1) {
          return ii;
        }
        ii = indexOf.call(this._shortWeekdaysParse, llc);
        return ii !== -1 ? ii : null;
      }
    }
  }
  function localeWeekdaysParse(weekdayName, format2, strict) {
    var i, mom, regex;
    if (this._weekdaysParseExact) {
      return handleStrictParse$1.call(this, weekdayName, format2, strict);
    }
    if (!this._weekdaysParse) {
      this._weekdaysParse = [];
      this._minWeekdaysParse = [];
      this._shortWeekdaysParse = [];
      this._fullWeekdaysParse = [];
    }
    for (i = 0; i < 7; i++) {
      mom = createUTC([2e3, 1]).day(i);
      if (strict && !this._fullWeekdaysParse[i]) {
        this._fullWeekdaysParse[i] = new RegExp(
          "^" + this.weekdays(mom, "").replace(".", "\\.?") + "$",
          "i"
        );
        this._shortWeekdaysParse[i] = new RegExp(
          "^" + this.weekdaysShort(mom, "").replace(".", "\\.?") + "$",
          "i"
        );
        this._minWeekdaysParse[i] = new RegExp(
          "^" + this.weekdaysMin(mom, "").replace(".", "\\.?") + "$",
          "i"
        );
      }
      if (!this._weekdaysParse[i]) {
        regex = "^" + this.weekdays(mom, "") + "|^" + this.weekdaysShort(mom, "") + "|^" + this.weekdaysMin(mom, "");
        this._weekdaysParse[i] = new RegExp(regex.replace(".", ""), "i");
      }
      if (strict && format2 === "dddd" && this._fullWeekdaysParse[i].test(weekdayName)) {
        return i;
      } else if (strict && format2 === "ddd" && this._shortWeekdaysParse[i].test(weekdayName)) {
        return i;
      } else if (strict && format2 === "dd" && this._minWeekdaysParse[i].test(weekdayName)) {
        return i;
      } else if (!strict && this._weekdaysParse[i].test(weekdayName)) {
        return i;
      }
    }
  }
  function getSetDayOfWeek(input) {
    if (!this.isValid()) {
      return input != null ? this : NaN;
    }
    var day = get(this, "Day");
    if (input != null) {
      input = parseWeekday(input, this.localeData());
      return this.add(input - day, "d");
    } else {
      return day;
    }
  }
  function getSetLocaleDayOfWeek(input) {
    if (!this.isValid()) {
      return input != null ? this : NaN;
    }
    var weekday = (this.day() + 7 - this.localeData()._week.dow) % 7;
    return input == null ? weekday : this.add(input - weekday, "d");
  }
  function getSetISODayOfWeek(input) {
    if (!this.isValid()) {
      return input != null ? this : NaN;
    }
    if (input != null) {
      var weekday = parseIsoWeekday(input, this.localeData());
      return this.day(this.day() % 7 ? weekday : weekday - 7);
    } else {
      return this.day() || 7;
    }
  }
  function weekdaysRegex(isStrict) {
    if (this._weekdaysParseExact) {
      if (!hasOwnProp(this, "_weekdaysRegex")) {
        computeWeekdaysParse.call(this);
      }
      if (isStrict) {
        return this._weekdaysStrictRegex;
      } else {
        return this._weekdaysRegex;
      }
    } else {
      if (!hasOwnProp(this, "_weekdaysRegex")) {
        this._weekdaysRegex = defaultWeekdaysRegex;
      }
      return this._weekdaysStrictRegex && isStrict ? this._weekdaysStrictRegex : this._weekdaysRegex;
    }
  }
  function weekdaysShortRegex(isStrict) {
    if (this._weekdaysParseExact) {
      if (!hasOwnProp(this, "_weekdaysRegex")) {
        computeWeekdaysParse.call(this);
      }
      if (isStrict) {
        return this._weekdaysShortStrictRegex;
      } else {
        return this._weekdaysShortRegex;
      }
    } else {
      if (!hasOwnProp(this, "_weekdaysShortRegex")) {
        this._weekdaysShortRegex = defaultWeekdaysShortRegex;
      }
      return this._weekdaysShortStrictRegex && isStrict ? this._weekdaysShortStrictRegex : this._weekdaysShortRegex;
    }
  }
  function weekdaysMinRegex(isStrict) {
    if (this._weekdaysParseExact) {
      if (!hasOwnProp(this, "_weekdaysRegex")) {
        computeWeekdaysParse.call(this);
      }
      if (isStrict) {
        return this._weekdaysMinStrictRegex;
      } else {
        return this._weekdaysMinRegex;
      }
    } else {
      if (!hasOwnProp(this, "_weekdaysMinRegex")) {
        this._weekdaysMinRegex = defaultWeekdaysMinRegex;
      }
      return this._weekdaysMinStrictRegex && isStrict ? this._weekdaysMinStrictRegex : this._weekdaysMinRegex;
    }
  }
  function computeWeekdaysParse() {
    function cmpLenRev(a, b) {
      return b.length - a.length;
    }
    var minPieces = [], shortPieces = [], longPieces = [], mixedPieces = [], i, mom, minp, shortp, longp;
    for (i = 0; i < 7; i++) {
      mom = createUTC([2e3, 1]).day(i);
      minp = regexEscape(this.weekdaysMin(mom, ""));
      shortp = regexEscape(this.weekdaysShort(mom, ""));
      longp = regexEscape(this.weekdays(mom, ""));
      minPieces.push(minp);
      shortPieces.push(shortp);
      longPieces.push(longp);
      mixedPieces.push(minp);
      mixedPieces.push(shortp);
      mixedPieces.push(longp);
    }
    minPieces.sort(cmpLenRev);
    shortPieces.sort(cmpLenRev);
    longPieces.sort(cmpLenRev);
    mixedPieces.sort(cmpLenRev);
    this._weekdaysRegex = new RegExp("^(" + mixedPieces.join("|") + ")", "i");
    this._weekdaysShortRegex = this._weekdaysRegex;
    this._weekdaysMinRegex = this._weekdaysRegex;
    this._weekdaysStrictRegex = new RegExp(
      "^(" + longPieces.join("|") + ")",
      "i"
    );
    this._weekdaysShortStrictRegex = new RegExp(
      "^(" + shortPieces.join("|") + ")",
      "i"
    );
    this._weekdaysMinStrictRegex = new RegExp(
      "^(" + minPieces.join("|") + ")",
      "i"
    );
  }
  function hFormat() {
    return this.hours() % 12 || 12;
  }
  function kFormat() {
    return this.hours() || 24;
  }
  addFormatToken("H", ["HH", 2], 0, "hour");
  addFormatToken("h", ["hh", 2], 0, hFormat);
  addFormatToken("k", ["kk", 2], 0, kFormat);
  addFormatToken("hmm", 0, 0, function() {
    return "" + hFormat.apply(this) + zeroFill(this.minutes(), 2);
  });
  addFormatToken("hmmss", 0, 0, function() {
    return "" + hFormat.apply(this) + zeroFill(this.minutes(), 2) + zeroFill(this.seconds(), 2);
  });
  addFormatToken("Hmm", 0, 0, function() {
    return "" + this.hours() + zeroFill(this.minutes(), 2);
  });
  addFormatToken("Hmmss", 0, 0, function() {
    return "" + this.hours() + zeroFill(this.minutes(), 2) + zeroFill(this.seconds(), 2);
  });
  function meridiem(token2, lowercase) {
    addFormatToken(token2, 0, 0, function() {
      return this.localeData().meridiem(
        this.hours(),
        this.minutes(),
        lowercase
      );
    });
  }
  meridiem("a", true);
  meridiem("A", false);
  function matchMeridiem(isStrict, locale2) {
    return locale2._meridiemParse;
  }
  addRegexToken("a", matchMeridiem);
  addRegexToken("A", matchMeridiem);
  addRegexToken("H", match1to2, match1to2HasZero);
  addRegexToken("h", match1to2, match1to2NoLeadingZero);
  addRegexToken("k", match1to2, match1to2NoLeadingZero);
  addRegexToken("HH", match1to2, match2);
  addRegexToken("hh", match1to2, match2);
  addRegexToken("kk", match1to2, match2);
  addRegexToken("hmm", match3to4);
  addRegexToken("hmmss", match5to6);
  addRegexToken("Hmm", match3to4);
  addRegexToken("Hmmss", match5to6);
  addParseToken(["H", "HH"], HOUR$1);
  addParseToken(["k", "kk"], function(input, array, config) {
    var kInput = toInt(input);
    array[HOUR$1] = kInput === 24 ? 0 : kInput;
  });
  addParseToken(["a", "A"], function(input, array, config) {
    config._isPm = config._locale.isPM(input);
    config._meridiem = input;
  });
  addParseToken(["h", "hh"], function(input, array, config) {
    array[HOUR$1] = toInt(input);
    getParsingFlags(config).bigHour = true;
  });
  addParseToken("hmm", function(input, array, config) {
    var pos = input.length - 2;
    array[HOUR$1] = toInt(input.substr(0, pos));
    array[MINUTE$1] = toInt(input.substr(pos));
    getParsingFlags(config).bigHour = true;
  });
  addParseToken("hmmss", function(input, array, config) {
    var pos1 = input.length - 4, pos2 = input.length - 2;
    array[HOUR$1] = toInt(input.substr(0, pos1));
    array[MINUTE$1] = toInt(input.substr(pos1, 2));
    array[SECOND$1] = toInt(input.substr(pos2));
    getParsingFlags(config).bigHour = true;
  });
  addParseToken("Hmm", function(input, array, config) {
    var pos = input.length - 2;
    array[HOUR$1] = toInt(input.substr(0, pos));
    array[MINUTE$1] = toInt(input.substr(pos));
  });
  addParseToken("Hmmss", function(input, array, config) {
    var pos1 = input.length - 4, pos2 = input.length - 2;
    array[HOUR$1] = toInt(input.substr(0, pos1));
    array[MINUTE$1] = toInt(input.substr(pos1, 2));
    array[SECOND$1] = toInt(input.substr(pos2));
  });
  function localeIsPM(input) {
    return (input + "").toLowerCase().charAt(0) === "p";
  }
  var defaultLocaleMeridiemParse = /[ap]\.?m?\.?/i, getSetHour = makeGetSet("Hours", true);
  function localeMeridiem(hours2, minutes2, isLower) {
    if (hours2 > 11) {
      return isLower ? "pm" : "PM";
    } else {
      return isLower ? "am" : "AM";
    }
  }
  var baseConfig = {
    calendar: defaultCalendar,
    longDateFormat: defaultLongDateFormat,
    invalidDate: defaultInvalidDate,
    ordinal: defaultOrdinal,
    dayOfMonthOrdinalParse: defaultDayOfMonthOrdinalParse,
    relativeTime: defaultRelativeTime,
    months: defaultLocaleMonths,
    monthsShort: defaultLocaleMonthsShort,
    week: defaultLocaleWeek,
    weekdays: defaultLocaleWeekdays,
    weekdaysMin: defaultLocaleWeekdaysMin,
    weekdaysShort: defaultLocaleWeekdaysShort,
    meridiemParse: defaultLocaleMeridiemParse
  };
  var locales = {}, localeFamilies = {}, globalLocale;
  function commonPrefix(arr1, arr2) {
    var i, minl = Math.min(arr1.length, arr2.length);
    for (i = 0; i < minl; i += 1) {
      if (arr1[i] !== arr2[i]) {
        return i;
      }
    }
    return minl;
  }
  function normalizeLocale(key) {
    return key ? key.toLowerCase().replace("_", "-") : key;
  }
  function chooseLocale(names) {
    var i = 0, j, next, locale2, split;
    while (i < names.length) {
      split = normalizeLocale(names[i]).split("-");
      j = split.length;
      next = normalizeLocale(names[i + 1]);
      next = next ? next.split("-") : null;
      while (j > 0) {
        locale2 = loadLocale(split.slice(0, j).join("-"));
        if (locale2) {
          return locale2;
        }
        if (next && next.length >= j && commonPrefix(split, next) >= j - 1) {
          break;
        }
        j--;
      }
      i++;
    }
    return globalLocale;
  }
  function isLocaleNameSane(name) {
    return !!(name && name.match("^[^/\\\\]*$"));
  }
  function loadLocale(name) {
    var oldLocale = null, aliasedRequire;
    if (locales[name] === void 0 && typeof module !== "undefined" && module && module.exports && isLocaleNameSane(name)) {
      try {
        oldLocale = globalLocale._abbr;
        aliasedRequire = require;
        aliasedRequire("./locale/" + name);
        getSetGlobalLocale(oldLocale);
      } catch (e) {
        locales[name] = null;
      }
    }
    return locales[name];
  }
  function getSetGlobalLocale(key, values) {
    var data;
    if (key) {
      if (isUndefined(values)) {
        data = getLocale(key);
      } else {
        data = defineLocale(key, values);
      }
      if (data) {
        globalLocale = data;
      } else {
        if (typeof console !== "undefined" && console.warn) {
          console.warn(
            "Locale " + key + " not found. Did you forget to load it?"
          );
        }
      }
    }
    return globalLocale._abbr;
  }
  function defineLocale(name, config) {
    if (config !== null) {
      var locale2, parentConfig = baseConfig;
      config.abbr = name;
      if (locales[name] != null) {
        deprecateSimple(
          "defineLocaleOverride",
          "use moment.updateLocale(localeName, config) to change an existing locale. moment.defineLocale(localeName, config) should only be used for creating a new locale See http://momentjs.com/guides/#/warnings/define-locale/ for more info."
        );
        parentConfig = locales[name]._config;
      } else if (config.parentLocale != null) {
        if (locales[config.parentLocale] != null) {
          parentConfig = locales[config.parentLocale]._config;
        } else {
          locale2 = loadLocale(config.parentLocale);
          if (locale2 != null) {
            parentConfig = locale2._config;
          } else {
            if (!localeFamilies[config.parentLocale]) {
              localeFamilies[config.parentLocale] = [];
            }
            localeFamilies[config.parentLocale].push({
              name,
              config
            });
            return null;
          }
        }
      }
      locales[name] = new Locale(mergeConfigs(parentConfig, config));
      if (localeFamilies[name]) {
        localeFamilies[name].forEach(function(x) {
          defineLocale(x.name, x.config);
        });
      }
      getSetGlobalLocale(name);
      return locales[name];
    } else {
      delete locales[name];
      return null;
    }
  }
  function updateLocale(name, config) {
    if (config != null) {
      var locale2, tmpLocale, parentConfig = baseConfig;
      if (locales[name] != null && locales[name].parentLocale != null) {
        locales[name].set(mergeConfigs(locales[name]._config, config));
      } else {
        tmpLocale = loadLocale(name);
        if (tmpLocale != null) {
          parentConfig = tmpLocale._config;
        }
        config = mergeConfigs(parentConfig, config);
        if (tmpLocale == null) {
          config.abbr = name;
        }
        locale2 = new Locale(config);
        locale2.parentLocale = locales[name];
        locales[name] = locale2;
      }
      getSetGlobalLocale(name);
    } else {
      if (locales[name] != null) {
        if (locales[name].parentLocale != null) {
          locales[name] = locales[name].parentLocale;
          if (name === getSetGlobalLocale()) {
            getSetGlobalLocale(name);
          }
        } else if (locales[name] != null) {
          delete locales[name];
        }
      }
    }
    return locales[name];
  }
  function getLocale(key) {
    var locale2;
    if (key && key._locale && key._locale._abbr) {
      key = key._locale._abbr;
    }
    if (!key) {
      return globalLocale;
    }
    if (!isArray(key)) {
      locale2 = loadLocale(key);
      if (locale2) {
        return locale2;
      }
      key = [key];
    }
    return chooseLocale(key);
  }
  function listLocales() {
    return keys(locales);
  }
  function checkOverflow(m) {
    var overflow, a = m._a;
    if (a && getParsingFlags(m).overflow === -2) {
      overflow = a[MONTH$1] < 0 || a[MONTH$1] > 11 ? MONTH$1 : a[DATE] < 1 || a[DATE] > daysInMonth(a[YEAR$1], a[MONTH$1]) ? DATE : a[HOUR$1] < 0 || a[HOUR$1] > 24 || a[HOUR$1] === 24 && (a[MINUTE$1] !== 0 || a[SECOND$1] !== 0 || a[MILLISECOND$1] !== 0) ? HOUR$1 : a[MINUTE$1] < 0 || a[MINUTE$1] > 59 ? MINUTE$1 : a[SECOND$1] < 0 || a[SECOND$1] > 59 ? SECOND$1 : a[MILLISECOND$1] < 0 || a[MILLISECOND$1] > 999 ? MILLISECOND$1 : -1;
      if (getParsingFlags(m)._overflowDayOfYear && (overflow < YEAR$1 || overflow > DATE)) {
        overflow = DATE;
      }
      if (getParsingFlags(m)._overflowWeeks && overflow === -1) {
        overflow = WEEK;
      }
      if (getParsingFlags(m)._overflowWeekday && overflow === -1) {
        overflow = WEEKDAY;
      }
      getParsingFlags(m).overflow = overflow;
    }
    return m;
  }
  var extendedIsoRegex = /^\s*((?:[+-]\d{6}|\d{4})-(?:\d\d-\d\d|W\d\d-\d|W\d\d|\d\d\d|\d\d))(?:(T| )(\d\d(?::\d\d(?::\d\d(?:[.,]\d+)?)?)?)([+-]\d\d(?::?\d\d)?|\s*Z)?)?$/, basicIsoRegex = /^\s*((?:[+-]\d{6}|\d{4})(?:\d\d\d\d|W\d\d\d|W\d\d|\d\d\d|\d\d|))(?:(T| )(\d\d(?:\d\d(?:\d\d(?:[.,]\d+)?)?)?)([+-]\d\d(?::?\d\d)?|\s*Z)?)?$/, tzRegex = /Z|[+-]\d\d(?::?\d\d)?/, isoDates = [
    ["YYYYYY-MM-DD", /[+-]\d{6}-\d\d-\d\d/],
    ["YYYY-MM-DD", /\d{4}-\d\d-\d\d/],
    ["GGGG-[W]WW-E", /\d{4}-W\d\d-\d/],
    ["GGGG-[W]WW", /\d{4}-W\d\d/, false],
    ["YYYY-DDD", /\d{4}-\d{3}/],
    ["YYYY-MM", /\d{4}-\d\d/, false],
    ["YYYYYYMMDD", /[+-]\d{10}/],
    ["YYYYMMDD", /\d{8}/],
    ["GGGG[W]WWE", /\d{4}W\d{3}/],
    ["GGGG[W]WW", /\d{4}W\d{2}/, false],
    ["YYYYDDD", /\d{7}/],
    ["YYYYMM", /\d{6}/, false],
    ["YYYY", /\d{4}/, false]
  ], isoTimes = [
    ["HH:mm:ss.SSSS", /\d\d:\d\d:\d\d\.\d+/],
    ["HH:mm:ss,SSSS", /\d\d:\d\d:\d\d,\d+/],
    ["HH:mm:ss", /\d\d:\d\d:\d\d/],
    ["HH:mm", /\d\d:\d\d/],
    ["HHmmss.SSSS", /\d\d\d\d\d\d\.\d+/],
    ["HHmmss,SSSS", /\d\d\d\d\d\d,\d+/],
    ["HHmmss", /\d\d\d\d\d\d/],
    ["HHmm", /\d\d\d\d/],
    ["HH", /\d\d/]
  ], aspNetJsonRegex = /^\/?Date\((-?\d+)/i, rfc2822 = /^(?:(Mon|Tue|Wed|Thu|Fri|Sat|Sun),?\s)?(\d{1,2})\s(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s(\d{2,4})\s(\d\d):(\d\d)(?::(\d\d))?\s(?:(UT|GMT|[ECMP][SD]T)|([Zz])|([+-]\d{4}))$/, obsOffsets = {
    UT: 0,
    GMT: 0,
    EDT: -4 * 60,
    EST: -5 * 60,
    CDT: -5 * 60,
    CST: -6 * 60,
    MDT: -6 * 60,
    MST: -7 * 60,
    PDT: -7 * 60,
    PST: -8 * 60
  };
  function configFromISO(config) {
    var i, l, string = config._i, match = extendedIsoRegex.exec(string) || basicIsoRegex.exec(string), allowTime, dateFormat, timeFormat, tzFormat, isoDatesLen = isoDates.length, isoTimesLen = isoTimes.length;
    if (match) {
      getParsingFlags(config).iso = true;
      for (i = 0, l = isoDatesLen; i < l; i++) {
        if (isoDates[i][1].exec(match[1])) {
          dateFormat = isoDates[i][0];
          allowTime = isoDates[i][2] !== false;
          break;
        }
      }
      if (dateFormat == null) {
        config._isValid = false;
        return;
      }
      if (match[3]) {
        for (i = 0, l = isoTimesLen; i < l; i++) {
          if (isoTimes[i][1].exec(match[3])) {
            timeFormat = (match[2] || " ") + isoTimes[i][0];
            break;
          }
        }
        if (timeFormat == null) {
          config._isValid = false;
          return;
        }
      }
      if (!allowTime && timeFormat != null) {
        config._isValid = false;
        return;
      }
      if (match[4]) {
        if (tzRegex.exec(match[4])) {
          tzFormat = "Z";
        } else {
          config._isValid = false;
          return;
        }
      }
      config._f = dateFormat + (timeFormat || "") + (tzFormat || "");
      configFromStringAndFormat(config);
    } else {
      config._isValid = false;
    }
  }
  function extractFromRFC2822Strings(yearStr, monthStr, dayStr, hourStr, minuteStr, secondStr) {
    var result = [
      untruncateYear(yearStr),
      defaultLocaleMonthsShort.indexOf(monthStr),
      parseInt(dayStr, 10),
      parseInt(hourStr, 10),
      parseInt(minuteStr, 10)
    ];
    if (secondStr) {
      result.push(parseInt(secondStr, 10));
    }
    return result;
  }
  function untruncateYear(yearStr) {
    var year = parseInt(yearStr, 10);
    if (year <= 49) {
      return 2e3 + year;
    } else if (year <= 999) {
      return 1900 + year;
    }
    return year;
  }
  function preprocessRFC2822(s) {
    return s.replace(/\([^()]*\)|[\n\t]/g, " ").replace(/(\s\s+)/g, " ").replace(/^\s\s*/, "").replace(/\s\s*$/, "");
  }
  function checkWeekday(weekdayStr, parsedInput, config) {
    if (weekdayStr) {
      var weekdayProvided = defaultLocaleWeekdaysShort.indexOf(weekdayStr), weekdayActual = new Date(
        parsedInput[0],
        parsedInput[1],
        parsedInput[2]
      ).getDay();
      if (weekdayProvided !== weekdayActual) {
        getParsingFlags(config).weekdayMismatch = true;
        config._isValid = false;
        return false;
      }
    }
    return true;
  }
  function calculateOffset(obsOffset, militaryOffset, numOffset) {
    if (obsOffset) {
      return obsOffsets[obsOffset];
    } else if (militaryOffset) {
      return 0;
    } else {
      var hm = parseInt(numOffset, 10), m = hm % 100, h = (hm - m) / 100;
      return h * 60 + m;
    }
  }
  function configFromRFC2822(config) {
    var match = rfc2822.exec(preprocessRFC2822(config._i)), parsedArray;
    if (match) {
      parsedArray = extractFromRFC2822Strings(
        match[4],
        match[3],
        match[2],
        match[5],
        match[6],
        match[7]
      );
      if (!checkWeekday(match[1], parsedArray, config)) {
        return;
      }
      config._a = parsedArray;
      config._tzm = calculateOffset(match[8], match[9], match[10]);
      config._d = createUTCDate.apply(null, config._a);
      config._d.setUTCMinutes(config._d.getUTCMinutes() - config._tzm);
      getParsingFlags(config).rfc2822 = true;
    } else {
      config._isValid = false;
    }
  }
  function configFromString(config) {
    var matched = aspNetJsonRegex.exec(config._i);
    if (matched !== null) {
      config._d = /* @__PURE__ */ new Date(+matched[1]);
      return;
    }
    configFromISO(config);
    if (config._isValid === false) {
      delete config._isValid;
    } else {
      return;
    }
    configFromRFC2822(config);
    if (config._isValid === false) {
      delete config._isValid;
    } else {
      return;
    }
    if (config._strict) {
      config._isValid = false;
    } else {
      hooks.createFromInputFallback(config);
    }
  }
  hooks.createFromInputFallback = deprecate(
    "value provided is not in a recognized RFC2822 or ISO format. moment construction falls back to js Date(), which is not reliable across all browsers and versions. Non RFC2822/ISO date formats are discouraged. Please refer to http://momentjs.com/guides/#/warnings/js-date/ for more info.",
    function(config) {
      config._d = /* @__PURE__ */ new Date(config._i + (config._useUTC ? " UTC" : ""));
    }
  );
  function defaults(a, b, c) {
    if (a != null) {
      return a;
    }
    if (b != null) {
      return b;
    }
    return c;
  }
  function currentDateArray(config) {
    var nowValue = new Date(hooks.now());
    if (config._useUTC) {
      return [
        nowValue.getUTCFullYear(),
        nowValue.getUTCMonth(),
        nowValue.getUTCDate()
      ];
    }
    return [nowValue.getFullYear(), nowValue.getMonth(), nowValue.getDate()];
  }
  function configFromArray(config) {
    var i, date, input = [], currentDate, expectedWeekday, yearToUse;
    if (config._d) {
      return;
    }
    currentDate = currentDateArray(config);
    if (config._w && config._a[DATE] == null && config._a[MONTH$1] == null) {
      dayOfYearFromWeekInfo(config);
    }
    if (config._dayOfYear != null) {
      yearToUse = defaults(config._a[YEAR$1], currentDate[YEAR$1]);
      if (config._dayOfYear > daysInYear(yearToUse) || config._dayOfYear === 0) {
        getParsingFlags(config)._overflowDayOfYear = true;
      }
      date = createUTCDate(yearToUse, 0, config._dayOfYear);
      config._a[MONTH$1] = date.getUTCMonth();
      config._a[DATE] = date.getUTCDate();
    }
    for (i = 0; i < 3 && config._a[i] == null; ++i) {
      config._a[i] = input[i] = currentDate[i];
    }
    for (; i < 7; i++) {
      config._a[i] = input[i] = config._a[i] == null ? i === 2 ? 1 : 0 : config._a[i];
    }
    if (config._a[HOUR$1] === 24 && config._a[MINUTE$1] === 0 && config._a[SECOND$1] === 0 && config._a[MILLISECOND$1] === 0) {
      config._nextDay = true;
      config._a[HOUR$1] = 0;
    }
    config._d = (config._useUTC ? createUTCDate : createDate).apply(
      null,
      input
    );
    expectedWeekday = config._useUTC ? config._d.getUTCDay() : config._d.getDay();
    if (config._tzm != null) {
      config._d.setUTCMinutes(config._d.getUTCMinutes() - config._tzm);
    }
    if (config._nextDay) {
      config._a[HOUR$1] = 24;
    }
    if (config._w && typeof config._w.d !== "undefined" && config._w.d !== expectedWeekday) {
      getParsingFlags(config).weekdayMismatch = true;
    }
  }
  function dayOfYearFromWeekInfo(config) {
    var w, weekYear, week, weekday, dow, doy, temp, weekdayOverflow, curWeek;
    w = config._w;
    if (w.GG != null || w.W != null || w.E != null) {
      dow = 1;
      doy = 4;
      weekYear = defaults(
        w.GG,
        config._a[YEAR$1],
        weekOfYear(createLocal(), 1, 4).year
      );
      week = defaults(w.W, 1);
      weekday = defaults(w.E, 1);
      if (weekday < 1 || weekday > 7) {
        weekdayOverflow = true;
      }
    } else {
      dow = config._locale._week.dow;
      doy = config._locale._week.doy;
      curWeek = weekOfYear(createLocal(), dow, doy);
      weekYear = defaults(w.gg, config._a[YEAR$1], curWeek.year);
      week = defaults(w.w, curWeek.week);
      if (w.d != null) {
        weekday = w.d;
        if (weekday < 0 || weekday > 6) {
          weekdayOverflow = true;
        }
      } else if (w.e != null) {
        weekday = w.e + dow;
        if (w.e < 0 || w.e > 6) {
          weekdayOverflow = true;
        }
      } else {
        weekday = dow;
      }
    }
    if (week < 1 || week > weeksInYear(weekYear, dow, doy)) {
      getParsingFlags(config)._overflowWeeks = true;
    } else if (weekdayOverflow != null) {
      getParsingFlags(config)._overflowWeekday = true;
    } else {
      temp = dayOfYearFromWeeks(weekYear, week, weekday, dow, doy);
      config._a[YEAR$1] = temp.year;
      config._dayOfYear = temp.dayOfYear;
    }
  }
  hooks.ISO_8601 = function() {
  };
  hooks.RFC_2822 = function() {
  };
  function configFromStringAndFormat(config) {
    if (config._f === hooks.ISO_8601) {
      configFromISO(config);
      return;
    }
    if (config._f === hooks.RFC_2822) {
      configFromRFC2822(config);
      return;
    }
    config._a = [];
    getParsingFlags(config).empty = true;
    var string = "" + config._i, i, parsedInput, tokens2, token2, skipped, stringLength = string.length, totalParsedInputLength = 0, era, tokenLen;
    tokens2 = expandFormat(config._f, config._locale).match(formattingTokens) || [];
    tokenLen = tokens2.length;
    for (i = 0; i < tokenLen; i++) {
      token2 = tokens2[i];
      parsedInput = (string.match(getParseRegexForToken(token2, config)) || [])[0];
      if (parsedInput) {
        skipped = string.substr(0, string.indexOf(parsedInput));
        if (skipped.length > 0) {
          getParsingFlags(config).unusedInput.push(skipped);
        }
        string = string.slice(
          string.indexOf(parsedInput) + parsedInput.length
        );
        totalParsedInputLength += parsedInput.length;
      }
      if (formatTokenFunctions[token2]) {
        if (parsedInput) {
          getParsingFlags(config).empty = false;
        } else {
          getParsingFlags(config).unusedTokens.push(token2);
        }
        addTimeToArrayFromToken(token2, parsedInput, config);
      } else if (config._strict && !parsedInput) {
        getParsingFlags(config).unusedTokens.push(token2);
      }
    }
    getParsingFlags(config).charsLeftOver = stringLength - totalParsedInputLength;
    if (string.length > 0) {
      getParsingFlags(config).unusedInput.push(string);
    }
    if (config._a[HOUR$1] <= 12 && getParsingFlags(config).bigHour === true && config._a[HOUR$1] > 0) {
      getParsingFlags(config).bigHour = void 0;
    }
    getParsingFlags(config).parsedDateParts = config._a.slice(0);
    getParsingFlags(config).meridiem = config._meridiem;
    config._a[HOUR$1] = meridiemFixWrap(
      config._locale,
      config._a[HOUR$1],
      config._meridiem
    );
    era = getParsingFlags(config).era;
    if (era !== null) {
      config._a[YEAR$1] = config._locale.erasConvertYear(era, config._a[YEAR$1]);
    }
    configFromArray(config);
    checkOverflow(config);
  }
  function meridiemFixWrap(locale2, hour, meridiem2) {
    var isPm;
    if (meridiem2 == null) {
      return hour;
    }
    if (locale2.meridiemHour != null) {
      return locale2.meridiemHour(hour, meridiem2);
    } else if (locale2.isPM != null) {
      isPm = locale2.isPM(meridiem2);
      if (isPm && hour < 12) {
        hour += 12;
      }
      if (!isPm && hour === 12) {
        hour = 0;
      }
      return hour;
    } else {
      return hour;
    }
  }
  function configFromStringAndArray(config) {
    var tempConfig, bestMoment, scoreToBeat, i, currentScore, validFormatFound, bestFormatIsValid = false, configfLen = config._f.length;
    if (configfLen === 0) {
      getParsingFlags(config).invalidFormat = true;
      config._d = /* @__PURE__ */ new Date(NaN);
      return;
    }
    for (i = 0; i < configfLen; i++) {
      currentScore = 0;
      validFormatFound = false;
      tempConfig = copyConfig({}, config);
      if (config._useUTC != null) {
        tempConfig._useUTC = config._useUTC;
      }
      tempConfig._f = config._f[i];
      configFromStringAndFormat(tempConfig);
      if (isValid(tempConfig)) {
        validFormatFound = true;
      }
      currentScore += getParsingFlags(tempConfig).charsLeftOver;
      currentScore += getParsingFlags(tempConfig).unusedTokens.length * 10;
      getParsingFlags(tempConfig).score = currentScore;
      if (!bestFormatIsValid) {
        if (scoreToBeat == null || currentScore < scoreToBeat || validFormatFound) {
          scoreToBeat = currentScore;
          bestMoment = tempConfig;
          if (validFormatFound) {
            bestFormatIsValid = true;
          }
        }
      } else {
        if (currentScore < scoreToBeat) {
          scoreToBeat = currentScore;
          bestMoment = tempConfig;
        }
      }
    }
    extend(config, bestMoment || tempConfig);
  }
  function configFromObject(config) {
    if (config._d) {
      return;
    }
    var i = normalizeObjectUnits(config._i), dayOrDate = i.day === void 0 ? i.date : i.day;
    config._a = map(
      [i.year, i.month, dayOrDate, i.hour, i.minute, i.second, i.millisecond],
      function(obj) {
        return obj && parseInt(obj, 10);
      }
    );
    configFromArray(config);
  }
  function createFromConfig(config) {
    var res = new Moment(checkOverflow(prepareConfig(config)));
    if (res._nextDay) {
      res.add(1, "d");
      res._nextDay = void 0;
    }
    return res;
  }
  function prepareConfig(config) {
    var input = config._i, format2 = config._f;
    config._locale = config._locale || getLocale(config._l);
    if (input === null || format2 === void 0 && input === "") {
      return createInvalid({ nullInput: true });
    }
    if (typeof input === "string") {
      config._i = input = config._locale.preparse(input);
    }
    if (isMoment(input)) {
      return new Moment(checkOverflow(input));
    } else if (isDate(input)) {
      config._d = input;
    } else if (isArray(format2)) {
      configFromStringAndArray(config);
    } else if (format2) {
      configFromStringAndFormat(config);
    } else {
      configFromInput(config);
    }
    if (!isValid(config)) {
      config._d = null;
    }
    return config;
  }
  function configFromInput(config) {
    var input = config._i;
    if (isUndefined(input)) {
      config._d = new Date(hooks.now());
    } else if (isDate(input)) {
      config._d = new Date(input.valueOf());
    } else if (typeof input === "string") {
      configFromString(config);
    } else if (isArray(input)) {
      config._a = map(input.slice(0), function(obj) {
        return parseInt(obj, 10);
      });
      configFromArray(config);
    } else if (isObject(input)) {
      configFromObject(config);
    } else if (isNumber(input)) {
      config._d = new Date(input);
    } else {
      hooks.createFromInputFallback(config);
    }
  }
  function createLocalOrUTC(input, format2, locale2, strict, isUTC) {
    var c = {};
    if (format2 === true || format2 === false) {
      strict = format2;
      format2 = void 0;
    }
    if (locale2 === true || locale2 === false) {
      strict = locale2;
      locale2 = void 0;
    }
    if (isObject(input) && isObjectEmpty(input) || isArray(input) && input.length === 0) {
      input = void 0;
    }
    c._isAMomentObject = true;
    c._useUTC = c._isUTC = isUTC;
    c._l = locale2;
    c._i = input;
    c._f = format2;
    c._strict = strict;
    return createFromConfig(c);
  }
  function createLocal(input, format2, locale2, strict) {
    return createLocalOrUTC(input, format2, locale2, strict, false);
  }
  var prototypeMin = deprecate(
    "moment().min is deprecated, use moment.max instead. http://momentjs.com/guides/#/warnings/min-max/",
    function() {
      var other = createLocal.apply(null, arguments);
      if (this.isValid() && other.isValid()) {
        return other < this ? this : other;
      } else {
        return createInvalid();
      }
    }
  ), prototypeMax = deprecate(
    "moment().max is deprecated, use moment.min instead. http://momentjs.com/guides/#/warnings/min-max/",
    function() {
      var other = createLocal.apply(null, arguments);
      if (this.isValid() && other.isValid()) {
        return other > this ? this : other;
      } else {
        return createInvalid();
      }
    }
  );
  function pickBy(fn, moments) {
    var res, i;
    if (moments.length === 1 && isArray(moments[0])) {
      moments = moments[0];
    }
    if (!moments.length) {
      return createLocal();
    }
    res = moments[0];
    for (i = 1; i < moments.length; ++i) {
      if (!moments[i].isValid() || moments[i][fn](res)) {
        res = moments[i];
      }
    }
    return res;
  }
  function min() {
    var args = [].slice.call(arguments, 0);
    return pickBy("isBefore", args);
  }
  function max() {
    var args = [].slice.call(arguments, 0);
    return pickBy("isAfter", args);
  }
  var now = function() {
    return Date.now ? Date.now() : +/* @__PURE__ */ new Date();
  };
  var ordering = [
    "year",
    "quarter",
    "month",
    "week",
    "day",
    "hour",
    "minute",
    "second",
    "millisecond"
  ];
  function isDurationValid(m) {
    var key, unitHasDecimal = false, i, orderLen = ordering.length;
    for (key in m) {
      if (hasOwnProp(m, key) && !(indexOf.call(ordering, key) !== -1 && (m[key] == null || !isNaN(m[key])))) {
        return false;
      }
    }
    for (i = 0; i < orderLen; ++i) {
      if (m[ordering[i]]) {
        if (unitHasDecimal) {
          return false;
        }
        if (parseFloat(m[ordering[i]]) !== toInt(m[ordering[i]])) {
          unitHasDecimal = true;
        }
      }
    }
    return true;
  }
  function isValid$1() {
    return this._isValid;
  }
  function createInvalid$1() {
    return createDuration(NaN);
  }
  function Duration(duration) {
    var normalizedInput = normalizeObjectUnits(duration), years2 = normalizedInput.year || 0, quarters = normalizedInput.quarter || 0, months2 = normalizedInput.month || 0, weeks2 = normalizedInput.week || normalizedInput.isoWeek || 0, days2 = normalizedInput.day || 0, hours2 = normalizedInput.hour || 0, minutes2 = normalizedInput.minute || 0, seconds2 = normalizedInput.second || 0, milliseconds2 = normalizedInput.millisecond || 0;
    this._isValid = isDurationValid(normalizedInput);
    this._milliseconds = +milliseconds2 + seconds2 * 1e3 + // 1000
    minutes2 * 6e4 + // 1000 * 60
    hours2 * 1e3 * 60 * 60;
    this._days = +days2 + weeks2 * 7;
    this._months = +months2 + quarters * 3 + years2 * 12;
    this._data = {};
    this._locale = getLocale();
    this._bubble();
  }
  function isDuration(obj) {
    return obj instanceof Duration;
  }
  function absRound(number) {
    if (number < 0) {
      return Math.round(-1 * number) * -1;
    } else {
      return Math.round(number);
    }
  }
  function compareArrays(array1, array2, dontConvert) {
    var len = Math.min(array1.length, array2.length), lengthDiff = Math.abs(array1.length - array2.length), diffs = 0, i;
    for (i = 0; i < len; i++) {
      if (toInt(array1[i]) !== toInt(array2[i])) {
        diffs++;
      }
    }
    return diffs + lengthDiff;
  }
  function offset(token2, separator) {
    addFormatToken(token2, 0, 0, function() {
      var offset2 = this.utcOffset(), sign2 = "+";
      if (offset2 < 0) {
        offset2 = -offset2;
        sign2 = "-";
      }
      return sign2 + zeroFill(~~(offset2 / 60), 2) + separator + zeroFill(~~offset2 % 60, 2);
    });
  }
  offset("Z", ":");
  offset("ZZ", "");
  addRegexToken("Z", matchShortOffset);
  addRegexToken("ZZ", matchShortOffset);
  addParseToken(["Z", "ZZ"], function(input, array, config) {
    config._useUTC = true;
    config._tzm = offsetFromString(matchShortOffset, input);
  });
  var chunkOffset = /([\+\-]|\d\d)/gi;
  function offsetFromString(matcher, string) {
    var matches = (string || "").match(matcher), chunk, parts, minutes2;
    if (matches === null) {
      return null;
    }
    chunk = matches[matches.length - 1] || [];
    parts = (chunk + "").match(chunkOffset) || ["-", 0, 0];
    minutes2 = +(parts[1] * 60) + toInt(parts[2]);
    return minutes2 === 0 ? 0 : parts[0] === "+" ? minutes2 : -minutes2;
  }
  function cloneWithOffset(input, model) {
    var res, diff2;
    if (model._isUTC) {
      res = model.clone();
      diff2 = (isMoment(input) || isDate(input) ? input.valueOf() : createLocal(input).valueOf()) - res.valueOf();
      res._d.setTime(res._d.valueOf() + diff2);
      hooks.updateOffset(res, false);
      return res;
    } else {
      return createLocal(input).local();
    }
  }
  function getDateOffset(m) {
    return -Math.round(m._d.getTimezoneOffset());
  }
  hooks.updateOffset = function() {
  };
  function getSetOffset(input, keepLocalTime, keepMinutes) {
    var offset2 = this._offset || 0, localAdjust;
    if (!this.isValid()) {
      return input != null ? this : NaN;
    }
    if (input != null) {
      if (typeof input === "string") {
        input = offsetFromString(matchShortOffset, input);
        if (input === null) {
          return this;
        }
      } else if (Math.abs(input) < 16 && !keepMinutes) {
        input = input * 60;
      }
      if (!this._isUTC && keepLocalTime) {
        localAdjust = getDateOffset(this);
      }
      this._offset = input;
      this._isUTC = true;
      if (localAdjust != null) {
        this.add(localAdjust, "m");
      }
      if (offset2 !== input) {
        if (!keepLocalTime || this._changeInProgress) {
          addSubtract(
            this,
            createDuration(input - offset2, "m"),
            1,
            false
          );
        } else if (!this._changeInProgress) {
          this._changeInProgress = true;
          hooks.updateOffset(this, true);
          this._changeInProgress = null;
        }
      }
      return this;
    } else {
      return this._isUTC ? offset2 : getDateOffset(this);
    }
  }
  function getSetZone(input, keepLocalTime) {
    if (input != null) {
      if (typeof input !== "string") {
        input = -input;
      }
      this.utcOffset(input, keepLocalTime);
      return this;
    } else {
      return -this.utcOffset();
    }
  }
  function setOffsetToUTC(keepLocalTime) {
    return this.utcOffset(0, keepLocalTime);
  }
  function setOffsetToLocal(keepLocalTime) {
    if (this._isUTC) {
      this.utcOffset(0, keepLocalTime);
      this._isUTC = false;
      if (keepLocalTime) {
        this.subtract(getDateOffset(this), "m");
      }
    }
    return this;
  }
  function setOffsetToParsedOffset() {
    if (this._tzm != null) {
      this.utcOffset(this._tzm, false, true);
    } else if (typeof this._i === "string") {
      var tZone = offsetFromString(matchOffset, this._i);
      if (tZone != null) {
        this.utcOffset(tZone);
      } else {
        this.utcOffset(0, true);
      }
    }
    return this;
  }
  function hasAlignedHourOffset(input) {
    if (!this.isValid()) {
      return false;
    }
    input = input ? createLocal(input).utcOffset() : 0;
    return (this.utcOffset() - input) % 60 === 0;
  }
  function isDaylightSavingTime() {
    return this.utcOffset() > this.clone().month(0).utcOffset() || this.utcOffset() > this.clone().month(5).utcOffset();
  }
  function isDaylightSavingTimeShifted() {
    if (!isUndefined(this._isDSTShifted)) {
      return this._isDSTShifted;
    }
    var c = {}, other;
    copyConfig(c, this);
    c = prepareConfig(c);
    if (c._a) {
      other = c._isUTC ? createUTC(c._a) : createLocal(c._a);
      this._isDSTShifted = this.isValid() && compareArrays(c._a, other.toArray()) > 0;
    } else {
      this._isDSTShifted = false;
    }
    return this._isDSTShifted;
  }
  function isLocal() {
    return this.isValid() ? !this._isUTC : false;
  }
  function isUtcOffset() {
    return this.isValid() ? this._isUTC : false;
  }
  function isUtc() {
    return this.isValid() ? this._isUTC && this._offset === 0 : false;
  }
  var aspNetRegex = /^(-|\+)?(?:(\d*)[. ])?(\d+):(\d+)(?::(\d+)(\.\d*)?)?$/, isoRegex = /^(-|\+)?P(?:([-+]?[0-9,.]*)Y)?(?:([-+]?[0-9,.]*)M)?(?:([-+]?[0-9,.]*)W)?(?:([-+]?[0-9,.]*)D)?(?:T(?:([-+]?[0-9,.]*)H)?(?:([-+]?[0-9,.]*)M)?(?:([-+]?[0-9,.]*)S)?)?$/;
  function createDuration(input, key) {
    var duration = input, match = null, sign2, ret, diffRes;
    if (isDuration(input)) {
      duration = {
        ms: input._milliseconds,
        d: input._days,
        M: input._months
      };
    } else if (isNumber(input) || !isNaN(+input)) {
      duration = {};
      if (key) {
        duration[key] = +input;
      } else {
        duration.milliseconds = +input;
      }
    } else if (match = aspNetRegex.exec(input)) {
      sign2 = match[1] === "-" ? -1 : 1;
      duration = {
        y: 0,
        d: toInt(match[DATE]) * sign2,
        h: toInt(match[HOUR$1]) * sign2,
        m: toInt(match[MINUTE$1]) * sign2,
        s: toInt(match[SECOND$1]) * sign2,
        ms: toInt(absRound(match[MILLISECOND$1] * 1e3)) * sign2
        // the millisecond decimal point is included in the match
      };
    } else if (match = isoRegex.exec(input)) {
      sign2 = match[1] === "-" ? -1 : 1;
      duration = {
        y: parseIso(match[2], sign2),
        M: parseIso(match[3], sign2),
        w: parseIso(match[4], sign2),
        d: parseIso(match[5], sign2),
        h: parseIso(match[6], sign2),
        m: parseIso(match[7], sign2),
        s: parseIso(match[8], sign2)
      };
    } else if (duration == null) {
      duration = {};
    } else if (typeof duration === "object" && ("from" in duration || "to" in duration)) {
      diffRes = momentsDifference(
        createLocal(duration.from),
        createLocal(duration.to)
      );
      duration = {};
      duration.ms = diffRes.milliseconds;
      duration.M = diffRes.months;
    }
    ret = new Duration(duration);
    if (isDuration(input) && hasOwnProp(input, "_locale")) {
      ret._locale = input._locale;
    }
    if (isDuration(input) && hasOwnProp(input, "_isValid")) {
      ret._isValid = input._isValid;
    }
    return ret;
  }
  createDuration.fn = Duration.prototype;
  createDuration.invalid = createInvalid$1;
  function parseIso(inp, sign2) {
    var res = inp && parseFloat(inp.replace(",", "."));
    return (isNaN(res) ? 0 : res) * sign2;
  }
  function positiveMomentsDifference(base, other) {
    var res = {};
    res.months = other.month() - base.month() + (other.year() - base.year()) * 12;
    if (base.clone().add(res.months, "M").isAfter(other)) {
      --res.months;
    }
    res.milliseconds = +other - +base.clone().add(res.months, "M");
    return res;
  }
  function momentsDifference(base, other) {
    var res;
    if (!(base.isValid() && other.isValid())) {
      return { milliseconds: 0, months: 0 };
    }
    other = cloneWithOffset(other, base);
    if (base.isBefore(other)) {
      res = positiveMomentsDifference(base, other);
    } else {
      res = positiveMomentsDifference(other, base);
      res.milliseconds = -res.milliseconds;
      res.months = -res.months;
    }
    return res;
  }
  function createAdder(direction, name) {
    return function(val, period) {
      var dur, tmp;
      if (period !== null && !isNaN(+period)) {
        deprecateSimple(
          name,
          "moment()." + name + "(period, number) is deprecated. Please use moment()." + name + "(number, period). See http://momentjs.com/guides/#/warnings/add-inverted-param/ for more info."
        );
        tmp = val;
        val = period;
        period = tmp;
      }
      dur = createDuration(val, period);
      addSubtract(this, dur, direction);
      return this;
    };
  }
  function addSubtract(mom, duration, isAdding, updateOffset) {
    var milliseconds2 = duration._milliseconds, days2 = absRound(duration._days), months2 = absRound(duration._months);
    if (!mom.isValid()) {
      return;
    }
    updateOffset = updateOffset == null ? true : updateOffset;
    if (months2) {
      setMonth(mom, get(mom, "Month") + months2 * isAdding);
    }
    if (days2) {
      set$1(mom, "Date", get(mom, "Date") + days2 * isAdding);
    }
    if (milliseconds2) {
      mom._d.setTime(mom._d.valueOf() + milliseconds2 * isAdding);
    }
    if (updateOffset) {
      hooks.updateOffset(mom, days2 || months2);
    }
  }
  var add = createAdder(1, "add"), subtract = createAdder(-1, "subtract");
  function isString(input) {
    return typeof input === "string" || input instanceof String;
  }
  function isMomentInput(input) {
    return isMoment(input) || isDate(input) || isString(input) || isNumber(input) || isNumberOrStringArray(input) || isMomentInputObject(input) || input === null || input === void 0;
  }
  function isMomentInputObject(input) {
    var objectTest = isObject(input) && !isObjectEmpty(input), propertyTest = false, properties = [
      "years",
      "year",
      "y",
      "months",
      "month",
      "M",
      "days",
      "day",
      "d",
      "dates",
      "date",
      "D",
      "hours",
      "hour",
      "h",
      "minutes",
      "minute",
      "m",
      "seconds",
      "second",
      "s",
      "milliseconds",
      "millisecond",
      "ms"
    ], i, property, propertyLen = properties.length;
    for (i = 0; i < propertyLen; i += 1) {
      property = properties[i];
      propertyTest = propertyTest || hasOwnProp(input, property);
    }
    return objectTest && propertyTest;
  }
  function isNumberOrStringArray(input) {
    var arrayTest = isArray(input), dataTypeTest = false;
    if (arrayTest) {
      dataTypeTest = input.filter(function(item) {
        return !isNumber(item) && isString(input);
      }).length === 0;
    }
    return arrayTest && dataTypeTest;
  }
  function isCalendarSpec(input) {
    var objectTest = isObject(input) && !isObjectEmpty(input), propertyTest = false, properties = [
      "sameDay",
      "nextDay",
      "lastDay",
      "nextWeek",
      "lastWeek",
      "sameElse"
    ], i, property;
    for (i = 0; i < properties.length; i += 1) {
      property = properties[i];
      propertyTest = propertyTest || hasOwnProp(input, property);
    }
    return objectTest && propertyTest;
  }
  function getCalendarFormat(myMoment, now2) {
    var diff2 = myMoment.diff(now2, "days", true);
    return diff2 < -6 ? "sameElse" : diff2 < -1 ? "lastWeek" : diff2 < 0 ? "lastDay" : diff2 < 1 ? "sameDay" : diff2 < 2 ? "nextDay" : diff2 < 7 ? "nextWeek" : "sameElse";
  }
  function calendar$1(time, formats) {
    if (arguments.length === 1) {
      if (!arguments[0]) {
        time = void 0;
        formats = void 0;
      } else if (isMomentInput(arguments[0])) {
        time = arguments[0];
        formats = void 0;
      } else if (isCalendarSpec(arguments[0])) {
        formats = arguments[0];
        time = void 0;
      }
    }
    var now2 = time || createLocal(), sod = cloneWithOffset(now2, this).startOf("day"), format2 = hooks.calendarFormat(this, sod) || "sameElse", output = formats && (isFunction(formats[format2]) ? formats[format2].call(this, now2) : formats[format2]);
    return this.format(
      output || this.localeData().calendar(format2, this, createLocal(now2))
    );
  }
  function clone() {
    return new Moment(this);
  }
  function isAfter(input, units) {
    var localInput = isMoment(input) ? input : createLocal(input);
    if (!(this.isValid() && localInput.isValid())) {
      return false;
    }
    units = normalizeUnits(units) || "millisecond";
    if (units === "millisecond") {
      return this.valueOf() > localInput.valueOf();
    } else {
      return localInput.valueOf() < this.clone().startOf(units).valueOf();
    }
  }
  function isBefore(input, units) {
    var localInput = isMoment(input) ? input : createLocal(input);
    if (!(this.isValid() && localInput.isValid())) {
      return false;
    }
    units = normalizeUnits(units) || "millisecond";
    if (units === "millisecond") {
      return this.valueOf() < localInput.valueOf();
    } else {
      return this.clone().endOf(units).valueOf() < localInput.valueOf();
    }
  }
  function isBetween(from2, to2, units, inclusivity) {
    var localFrom = isMoment(from2) ? from2 : createLocal(from2), localTo = isMoment(to2) ? to2 : createLocal(to2);
    if (!(this.isValid() && localFrom.isValid() && localTo.isValid())) {
      return false;
    }
    inclusivity = inclusivity || "()";
    return (inclusivity[0] === "(" ? this.isAfter(localFrom, units) : !this.isBefore(localFrom, units)) && (inclusivity[1] === ")" ? this.isBefore(localTo, units) : !this.isAfter(localTo, units));
  }
  function isSame(input, units) {
    var localInput = isMoment(input) ? input : createLocal(input), inputMs;
    if (!(this.isValid() && localInput.isValid())) {
      return false;
    }
    units = normalizeUnits(units) || "millisecond";
    if (units === "millisecond") {
      return this.valueOf() === localInput.valueOf();
    } else {
      inputMs = localInput.valueOf();
      return this.clone().startOf(units).valueOf() <= inputMs && inputMs <= this.clone().endOf(units).valueOf();
    }
  }
  function isSameOrAfter(input, units) {
    return this.isSame(input, units) || this.isAfter(input, units);
  }
  function isSameOrBefore(input, units) {
    return this.isSame(input, units) || this.isBefore(input, units);
  }
  function diff(input, units, asFloat) {
    var that, zoneDelta, output;
    if (!this.isValid()) {
      return NaN;
    }
    that = cloneWithOffset(input, this);
    if (!that.isValid()) {
      return NaN;
    }
    zoneDelta = (that.utcOffset() - this.utcOffset()) * 6e4;
    units = normalizeUnits(units);
    switch (units) {
      case "year":
        output = monthDiff(this, that) / 12;
        break;
      case "month":
        output = monthDiff(this, that);
        break;
      case "quarter":
        output = monthDiff(this, that) / 3;
        break;
      case "second":
        output = (this - that) / 1e3;
        break;
      // 1000
      case "minute":
        output = (this - that) / 6e4;
        break;
      // 1000 * 60
      case "hour":
        output = (this - that) / 36e5;
        break;
      // 1000 * 60 * 60
      case "day":
        output = (this - that - zoneDelta) / 864e5;
        break;
      // 1000 * 60 * 60 * 24, negate dst
      case "week":
        output = (this - that - zoneDelta) / 6048e5;
        break;
      // 1000 * 60 * 60 * 24 * 7, negate dst
      default:
        output = this - that;
    }
    return asFloat ? output : absFloor(output);
  }
  function monthDiff(a, b) {
    if (a.date() < b.date()) {
      return -monthDiff(b, a);
    }
    var wholeMonthDiff = (b.year() - a.year()) * 12 + (b.month() - a.month()), anchor = a.clone().add(wholeMonthDiff, "months"), anchor2, adjust;
    if (b - anchor < 0) {
      anchor2 = a.clone().add(wholeMonthDiff - 1, "months");
      adjust = (b - anchor) / (anchor - anchor2);
    } else {
      anchor2 = a.clone().add(wholeMonthDiff + 1, "months");
      adjust = (b - anchor) / (anchor2 - anchor);
    }
    return -(wholeMonthDiff + adjust) || 0;
  }
  hooks.defaultFormat = "YYYY-MM-DDTHH:mm:ssZ";
  hooks.defaultFormatUtc = "YYYY-MM-DDTHH:mm:ss[Z]";
  function toString() {
    return this.clone().locale("en").format("ddd MMM DD YYYY HH:mm:ss [GMT]ZZ");
  }
  function toISOString(keepOffset) {
    if (!this.isValid()) {
      return null;
    }
    var utc = keepOffset !== true, m = utc ? this.clone().utc() : this;
    if (m.year() < 0 || m.year() > 9999) {
      return formatMoment(
        m,
        utc ? "YYYYYY-MM-DD[T]HH:mm:ss.SSS[Z]" : "YYYYYY-MM-DD[T]HH:mm:ss.SSSZ"
      );
    }
    if (isFunction(Date.prototype.toISOString)) {
      if (utc) {
        return this.toDate().toISOString();
      } else {
        return new Date(this.valueOf() + this.utcOffset() * 60 * 1e3).toISOString().replace("Z", formatMoment(m, "Z"));
      }
    }
    return formatMoment(
      m,
      utc ? "YYYY-MM-DD[T]HH:mm:ss.SSS[Z]" : "YYYY-MM-DD[T]HH:mm:ss.SSSZ"
    );
  }
  function inspect() {
    if (!this.isValid()) {
      return "moment.invalid(/* " + this._i + " */)";
    }
    var func = "moment", zone = "", prefix, year, datetime, suffix;
    if (!this.isLocal()) {
      func = this.utcOffset() === 0 ? "moment.utc" : "moment.parseZone";
      zone = "Z";
    }
    prefix = "[" + func + '("]';
    year = 0 <= this.year() && this.year() <= 9999 ? "YYYY" : "YYYYYY";
    datetime = "-MM-DD[T]HH:mm:ss.SSS";
    suffix = zone + '[")]';
    return this.format(prefix + year + datetime + suffix);
  }
  function format(inputString) {
    if (!inputString) {
      inputString = this.isUtc() ? hooks.defaultFormatUtc : hooks.defaultFormat;
    }
    var output = formatMoment(this, inputString);
    return this.localeData().postformat(output);
  }
  function from(time, withoutSuffix) {
    if (this.isValid() && (isMoment(time) && time.isValid() || createLocal(time).isValid())) {
      return createDuration({ to: this, from: time }).locale(this.locale()).humanize(!withoutSuffix);
    } else {
      return this.localeData().invalidDate();
    }
  }
  function fromNow(withoutSuffix) {
    return this.from(createLocal(), withoutSuffix);
  }
  function to(time, withoutSuffix) {
    if (this.isValid() && (isMoment(time) && time.isValid() || createLocal(time).isValid())) {
      return createDuration({ from: this, to: time }).locale(this.locale()).humanize(!withoutSuffix);
    } else {
      return this.localeData().invalidDate();
    }
  }
  function toNow(withoutSuffix) {
    return this.to(createLocal(), withoutSuffix);
  }
  function locale(key) {
    var newLocaleData;
    if (key === void 0) {
      return this._locale._abbr;
    } else {
      newLocaleData = getLocale(key);
      if (newLocaleData != null) {
        this._locale = newLocaleData;
      }
      return this;
    }
  }
  var lang = deprecate(
    "moment().lang() is deprecated. Instead, use moment().localeData() to get the language configuration. Use moment().locale() to change languages.",
    function(key) {
      if (key === void 0) {
        return this.localeData();
      } else {
        return this.locale(key);
      }
    }
  );
  function localeData() {
    return this._locale;
  }
  var MS_PER_SECOND = 1e3, MS_PER_MINUTE = 60 * MS_PER_SECOND, MS_PER_HOUR = 60 * MS_PER_MINUTE, MS_PER_400_YEARS = (365 * 400 + 97) * 24 * MS_PER_HOUR;
  function mod$1(dividend, divisor) {
    return (dividend % divisor + divisor) % divisor;
  }
  function localStartOfDate(y, m, d) {
    if (y < 100 && y >= 0) {
      return new Date(y + 400, m, d) - MS_PER_400_YEARS;
    } else {
      return new Date(y, m, d).valueOf();
    }
  }
  function utcStartOfDate(y, m, d) {
    if (y < 100 && y >= 0) {
      return Date.UTC(y + 400, m, d) - MS_PER_400_YEARS;
    } else {
      return Date.UTC(y, m, d);
    }
  }
  function startOf(units) {
    var time, startOfDate;
    units = normalizeUnits(units);
    if (units === void 0 || units === "millisecond" || !this.isValid()) {
      return this;
    }
    startOfDate = this._isUTC ? utcStartOfDate : localStartOfDate;
    switch (units) {
      case "year":
        time = startOfDate(this.year(), 0, 1);
        break;
      case "quarter":
        time = startOfDate(
          this.year(),
          this.month() - this.month() % 3,
          1
        );
        break;
      case "month":
        time = startOfDate(this.year(), this.month(), 1);
        break;
      case "week":
        time = startOfDate(
          this.year(),
          this.month(),
          this.date() - this.weekday()
        );
        break;
      case "isoWeek":
        time = startOfDate(
          this.year(),
          this.month(),
          this.date() - (this.isoWeekday() - 1)
        );
        break;
      case "day":
      case "date":
        time = startOfDate(this.year(), this.month(), this.date());
        break;
      case "hour":
        time = this._d.valueOf();
        time -= mod$1(
          time + (this._isUTC ? 0 : this.utcOffset() * MS_PER_MINUTE),
          MS_PER_HOUR
        );
        break;
      case "minute":
        time = this._d.valueOf();
        time -= mod$1(time, MS_PER_MINUTE);
        break;
      case "second":
        time = this._d.valueOf();
        time -= mod$1(time, MS_PER_SECOND);
        break;
    }
    this._d.setTime(time);
    hooks.updateOffset(this, true);
    return this;
  }
  function endOf(units) {
    var time, startOfDate;
    units = normalizeUnits(units);
    if (units === void 0 || units === "millisecond" || !this.isValid()) {
      return this;
    }
    startOfDate = this._isUTC ? utcStartOfDate : localStartOfDate;
    switch (units) {
      case "year":
        time = startOfDate(this.year() + 1, 0, 1) - 1;
        break;
      case "quarter":
        time = startOfDate(
          this.year(),
          this.month() - this.month() % 3 + 3,
          1
        ) - 1;
        break;
      case "month":
        time = startOfDate(this.year(), this.month() + 1, 1) - 1;
        break;
      case "week":
        time = startOfDate(
          this.year(),
          this.month(),
          this.date() - this.weekday() + 7
        ) - 1;
        break;
      case "isoWeek":
        time = startOfDate(
          this.year(),
          this.month(),
          this.date() - (this.isoWeekday() - 1) + 7
        ) - 1;
        break;
      case "day":
      case "date":
        time = startOfDate(this.year(), this.month(), this.date() + 1) - 1;
        break;
      case "hour":
        time = this._d.valueOf();
        time += MS_PER_HOUR - mod$1(
          time + (this._isUTC ? 0 : this.utcOffset() * MS_PER_MINUTE),
          MS_PER_HOUR
        ) - 1;
        break;
      case "minute":
        time = this._d.valueOf();
        time += MS_PER_MINUTE - mod$1(time, MS_PER_MINUTE) - 1;
        break;
      case "second":
        time = this._d.valueOf();
        time += MS_PER_SECOND - mod$1(time, MS_PER_SECOND) - 1;
        break;
    }
    this._d.setTime(time);
    hooks.updateOffset(this, true);
    return this;
  }
  function valueOf() {
    return this._d.valueOf() - (this._offset || 0) * 6e4;
  }
  function unix() {
    return Math.floor(this.valueOf() / 1e3);
  }
  function toDate() {
    return new Date(this.valueOf());
  }
  function toArray() {
    var m = this;
    return [
      m.year(),
      m.month(),
      m.date(),
      m.hour(),
      m.minute(),
      m.second(),
      m.millisecond()
    ];
  }
  function toObject() {
    var m = this;
    return {
      years: m.year(),
      months: m.month(),
      date: m.date(),
      hours: m.hours(),
      minutes: m.minutes(),
      seconds: m.seconds(),
      milliseconds: m.milliseconds()
    };
  }
  function toJSON() {
    return this.isValid() ? this.toISOString() : null;
  }
  function isValid$2() {
    return isValid(this);
  }
  function parsingFlags() {
    return extend({}, getParsingFlags(this));
  }
  function invalidAt() {
    return getParsingFlags(this).overflow;
  }
  function creationData() {
    return {
      input: this._i,
      format: this._f,
      locale: this._locale,
      isUTC: this._isUTC,
      strict: this._strict
    };
  }
  addFormatToken("N", 0, 0, "eraAbbr");
  addFormatToken("NN", 0, 0, "eraAbbr");
  addFormatToken("NNN", 0, 0, "eraAbbr");
  addFormatToken("NNNN", 0, 0, "eraName");
  addFormatToken("NNNNN", 0, 0, "eraNarrow");
  addFormatToken("y", ["y", 1], "yo", "eraYear");
  addFormatToken("y", ["yy", 2], 0, "eraYear");
  addFormatToken("y", ["yyy", 3], 0, "eraYear");
  addFormatToken("y", ["yyyy", 4], 0, "eraYear");
  addRegexToken("N", matchEraAbbr);
  addRegexToken("NN", matchEraAbbr);
  addRegexToken("NNN", matchEraAbbr);
  addRegexToken("NNNN", matchEraName);
  addRegexToken("NNNNN", matchEraNarrow);
  addParseToken(
    ["N", "NN", "NNN", "NNNN", "NNNNN"],
    function(input, array, config, token2) {
      var era = config._locale.erasParse(input, token2, config._strict);
      if (era) {
        getParsingFlags(config).era = era;
      } else {
        getParsingFlags(config).invalidEra = input;
      }
    }
  );
  addRegexToken("y", matchUnsigned);
  addRegexToken("yy", matchUnsigned);
  addRegexToken("yyy", matchUnsigned);
  addRegexToken("yyyy", matchUnsigned);
  addRegexToken("yo", matchEraYearOrdinal);
  addParseToken(["y", "yy", "yyy", "yyyy"], YEAR$1);
  addParseToken(["yo"], function(input, array, config, token2) {
    var match;
    if (config._locale._eraYearOrdinalRegex) {
      match = input.match(config._locale._eraYearOrdinalRegex);
    }
    if (config._locale.eraYearOrdinalParse) {
      array[YEAR$1] = config._locale.eraYearOrdinalParse(input, match);
    } else {
      array[YEAR$1] = parseInt(input, 10);
    }
  });
  function localeEras(m, format2) {
    var i, l, date, eras = this._eras || getLocale("en")._eras;
    for (i = 0, l = eras.length; i < l; ++i) {
      switch (typeof eras[i].since) {
        case "string":
          date = hooks(eras[i].since).startOf("day");
          eras[i].since = date.valueOf();
          break;
      }
      switch (typeof eras[i].until) {
        case "undefined":
          eras[i].until = Infinity;
          break;
        case "string":
          date = hooks(eras[i].until).startOf("day").valueOf();
          eras[i].until = date.valueOf();
          break;
      }
    }
    return eras;
  }
  function localeErasParse(eraName, format2, strict) {
    var i, l, eras = this.eras(), name, abbr, narrow;
    eraName = eraName.toUpperCase();
    for (i = 0, l = eras.length; i < l; ++i) {
      name = eras[i].name.toUpperCase();
      abbr = eras[i].abbr.toUpperCase();
      narrow = eras[i].narrow.toUpperCase();
      if (strict) {
        switch (format2) {
          case "N":
          case "NN":
          case "NNN":
            if (abbr === eraName) {
              return eras[i];
            }
            break;
          case "NNNN":
            if (name === eraName) {
              return eras[i];
            }
            break;
          case "NNNNN":
            if (narrow === eraName) {
              return eras[i];
            }
            break;
        }
      } else if ([name, abbr, narrow].indexOf(eraName) >= 0) {
        return eras[i];
      }
    }
  }
  function localeErasConvertYear(era, year) {
    var dir = era.since <= era.until ? 1 : -1;
    if (year === void 0) {
      return hooks(era.since).year();
    } else {
      return hooks(era.since).year() + (year - era.offset) * dir;
    }
  }
  function getEraName() {
    var i, l, val, eras = this.localeData().eras();
    for (i = 0, l = eras.length; i < l; ++i) {
      val = this.clone().startOf("day").valueOf();
      if (eras[i].since <= val && val <= eras[i].until) {
        return eras[i].name;
      }
      if (eras[i].until <= val && val <= eras[i].since) {
        return eras[i].name;
      }
    }
    return "";
  }
  function getEraNarrow() {
    var i, l, val, eras = this.localeData().eras();
    for (i = 0, l = eras.length; i < l; ++i) {
      val = this.clone().startOf("day").valueOf();
      if (eras[i].since <= val && val <= eras[i].until) {
        return eras[i].narrow;
      }
      if (eras[i].until <= val && val <= eras[i].since) {
        return eras[i].narrow;
      }
    }
    return "";
  }
  function getEraAbbr() {
    var i, l, val, eras = this.localeData().eras();
    for (i = 0, l = eras.length; i < l; ++i) {
      val = this.clone().startOf("day").valueOf();
      if (eras[i].since <= val && val <= eras[i].until) {
        return eras[i].abbr;
      }
      if (eras[i].until <= val && val <= eras[i].since) {
        return eras[i].abbr;
      }
    }
    return "";
  }
  function getEraYear() {
    var i, l, dir, val, eras = this.localeData().eras();
    for (i = 0, l = eras.length; i < l; ++i) {
      dir = eras[i].since <= eras[i].until ? 1 : -1;
      val = this.clone().startOf("day").valueOf();
      if (eras[i].since <= val && val <= eras[i].until || eras[i].until <= val && val <= eras[i].since) {
        return (this.year() - hooks(eras[i].since).year()) * dir + eras[i].offset;
      }
    }
    return this.year();
  }
  function erasNameRegex(isStrict) {
    if (!hasOwnProp(this, "_erasNameRegex")) {
      computeErasParse.call(this);
    }
    return isStrict ? this._erasNameRegex : this._erasRegex;
  }
  function erasAbbrRegex(isStrict) {
    if (!hasOwnProp(this, "_erasAbbrRegex")) {
      computeErasParse.call(this);
    }
    return isStrict ? this._erasAbbrRegex : this._erasRegex;
  }
  function erasNarrowRegex(isStrict) {
    if (!hasOwnProp(this, "_erasNarrowRegex")) {
      computeErasParse.call(this);
    }
    return isStrict ? this._erasNarrowRegex : this._erasRegex;
  }
  function matchEraAbbr(isStrict, locale2) {
    return locale2.erasAbbrRegex(isStrict);
  }
  function matchEraName(isStrict, locale2) {
    return locale2.erasNameRegex(isStrict);
  }
  function matchEraNarrow(isStrict, locale2) {
    return locale2.erasNarrowRegex(isStrict);
  }
  function matchEraYearOrdinal(isStrict, locale2) {
    return locale2._eraYearOrdinalRegex || matchUnsigned;
  }
  function computeErasParse() {
    var abbrPieces = [], namePieces = [], narrowPieces = [], mixedPieces = [], i, l, erasName, erasAbbr, erasNarrow, eras = this.eras();
    for (i = 0, l = eras.length; i < l; ++i) {
      erasName = regexEscape(eras[i].name);
      erasAbbr = regexEscape(eras[i].abbr);
      erasNarrow = regexEscape(eras[i].narrow);
      namePieces.push(erasName);
      abbrPieces.push(erasAbbr);
      narrowPieces.push(erasNarrow);
      mixedPieces.push(erasName);
      mixedPieces.push(erasAbbr);
      mixedPieces.push(erasNarrow);
    }
    this._erasRegex = new RegExp("^(" + mixedPieces.join("|") + ")", "i");
    this._erasNameRegex = new RegExp("^(" + namePieces.join("|") + ")", "i");
    this._erasAbbrRegex = new RegExp("^(" + abbrPieces.join("|") + ")", "i");
    this._erasNarrowRegex = new RegExp(
      "^(" + narrowPieces.join("|") + ")",
      "i"
    );
  }
  addFormatToken(0, ["gg", 2], 0, function() {
    return this.weekYear() % 100;
  });
  addFormatToken(0, ["GG", 2], 0, function() {
    return this.isoWeekYear() % 100;
  });
  function addWeekYearFormatToken(token2, getter) {
    addFormatToken(0, [token2, token2.length], 0, getter);
  }
  addWeekYearFormatToken("gggg", "weekYear");
  addWeekYearFormatToken("ggggg", "weekYear");
  addWeekYearFormatToken("GGGG", "isoWeekYear");
  addWeekYearFormatToken("GGGGG", "isoWeekYear");
  addRegexToken("G", matchSigned);
  addRegexToken("g", matchSigned);
  addRegexToken("GG", match1to2, match2);
  addRegexToken("gg", match1to2, match2);
  addRegexToken("GGGG", match1to4, match4);
  addRegexToken("gggg", match1to4, match4);
  addRegexToken("GGGGG", match1to6, match6);
  addRegexToken("ggggg", match1to6, match6);
  addWeekParseToken(
    ["gggg", "ggggg", "GGGG", "GGGGG"],
    function(input, week, config, token2) {
      week[token2.substr(0, 2)] = toInt(input);
    }
  );
  addWeekParseToken(["gg", "GG"], function(input, week, config, token2) {
    week[token2] = hooks.parseTwoDigitYear(input);
  });
  function getSetWeekYear(input) {
    return getSetWeekYearHelper.call(
      this,
      input,
      this.week(),
      this.weekday() + this.localeData()._week.dow,
      this.localeData()._week.dow,
      this.localeData()._week.doy
    );
  }
  function getSetISOWeekYear(input) {
    return getSetWeekYearHelper.call(
      this,
      input,
      this.isoWeek(),
      this.isoWeekday(),
      1,
      4
    );
  }
  function getISOWeeksInYear() {
    return weeksInYear(this.year(), 1, 4);
  }
  function getISOWeeksInISOWeekYear() {
    return weeksInYear(this.isoWeekYear(), 1, 4);
  }
  function getWeeksInYear() {
    var weekInfo = this.localeData()._week;
    return weeksInYear(this.year(), weekInfo.dow, weekInfo.doy);
  }
  function getWeeksInWeekYear() {
    var weekInfo = this.localeData()._week;
    return weeksInYear(this.weekYear(), weekInfo.dow, weekInfo.doy);
  }
  function getSetWeekYearHelper(input, week, weekday, dow, doy) {
    var weeksTarget;
    if (input == null) {
      return weekOfYear(this, dow, doy).year;
    } else {
      weeksTarget = weeksInYear(input, dow, doy);
      if (week > weeksTarget) {
        week = weeksTarget;
      }
      return setWeekAll.call(this, input, week, weekday, dow, doy);
    }
  }
  function setWeekAll(weekYear, week, weekday, dow, doy) {
    var dayOfYearData = dayOfYearFromWeeks(weekYear, week, weekday, dow, doy), date = createUTCDate(dayOfYearData.year, 0, dayOfYearData.dayOfYear);
    this.year(date.getUTCFullYear());
    this.month(date.getUTCMonth());
    this.date(date.getUTCDate());
    return this;
  }
  addFormatToken("Q", 0, "Qo", "quarter");
  addRegexToken("Q", match1);
  addParseToken("Q", function(input, array) {
    array[MONTH$1] = (toInt(input) - 1) * 3;
  });
  function getSetQuarter(input) {
    return input == null ? Math.ceil((this.month() + 1) / 3) : this.month((input - 1) * 3 + this.month() % 3);
  }
  addFormatToken("D", ["DD", 2], "Do", "date");
  addRegexToken("D", match1to2, match1to2NoLeadingZero);
  addRegexToken("DD", match1to2, match2);
  addRegexToken("Do", function(isStrict, locale2) {
    return isStrict ? locale2._dayOfMonthOrdinalParse || locale2._ordinalParse : locale2._dayOfMonthOrdinalParseLenient;
  });
  addParseToken(["D", "DD"], DATE);
  addParseToken("Do", function(input, array) {
    array[DATE] = toInt(input.match(match1to2)[0]);
  });
  var getSetDayOfMonth = makeGetSet("Date", true);
  addFormatToken("DDD", ["DDDD", 3], "DDDo", "dayOfYear");
  addRegexToken("DDD", match1to3);
  addRegexToken("DDDD", match3);
  addParseToken(["DDD", "DDDD"], function(input, array, config) {
    config._dayOfYear = toInt(input);
  });
  function getSetDayOfYear(input) {
    var dayOfYear = Math.round(
      (this.clone().startOf("day") - this.clone().startOf("year")) / 864e5
    ) + 1;
    return input == null ? dayOfYear : this.add(input - dayOfYear, "d");
  }
  addFormatToken("m", ["mm", 2], 0, "minute");
  addRegexToken("m", match1to2, match1to2HasZero);
  addRegexToken("mm", match1to2, match2);
  addParseToken(["m", "mm"], MINUTE$1);
  var getSetMinute = makeGetSet("Minutes", false);
  addFormatToken("s", ["ss", 2], 0, "second");
  addRegexToken("s", match1to2, match1to2HasZero);
  addRegexToken("ss", match1to2, match2);
  addParseToken(["s", "ss"], SECOND$1);
  var getSetSecond = makeGetSet("Seconds", false);
  addFormatToken("S", 0, 0, function() {
    return ~~(this.millisecond() / 100);
  });
  addFormatToken(0, ["SS", 2], 0, function() {
    return ~~(this.millisecond() / 10);
  });
  addFormatToken(0, ["SSS", 3], 0, "millisecond");
  addFormatToken(0, ["SSSS", 4], 0, function() {
    return this.millisecond() * 10;
  });
  addFormatToken(0, ["SSSSS", 5], 0, function() {
    return this.millisecond() * 100;
  });
  addFormatToken(0, ["SSSSSS", 6], 0, function() {
    return this.millisecond() * 1e3;
  });
  addFormatToken(0, ["SSSSSSS", 7], 0, function() {
    return this.millisecond() * 1e4;
  });
  addFormatToken(0, ["SSSSSSSS", 8], 0, function() {
    return this.millisecond() * 1e5;
  });
  addFormatToken(0, ["SSSSSSSSS", 9], 0, function() {
    return this.millisecond() * 1e6;
  });
  addRegexToken("S", match1to3, match1);
  addRegexToken("SS", match1to3, match2);
  addRegexToken("SSS", match1to3, match3);
  var token, getSetMillisecond;
  for (token = "SSSS"; token.length <= 9; token += "S") {
    addRegexToken(token, matchUnsigned);
  }
  function parseMs(input, array) {
    array[MILLISECOND$1] = toInt(("0." + input) * 1e3);
  }
  for (token = "S"; token.length <= 9; token += "S") {
    addParseToken(token, parseMs);
  }
  getSetMillisecond = makeGetSet("Milliseconds", false);
  addFormatToken("z", 0, 0, "zoneAbbr");
  addFormatToken("zz", 0, 0, "zoneName");
  function getZoneAbbr() {
    return this._isUTC ? "UTC" : "";
  }
  function getZoneName() {
    return this._isUTC ? "Coordinated Universal Time" : "";
  }
  var proto = Moment.prototype;
  proto.add = add;
  proto.calendar = calendar$1;
  proto.clone = clone;
  proto.diff = diff;
  proto.endOf = endOf;
  proto.format = format;
  proto.from = from;
  proto.fromNow = fromNow;
  proto.to = to;
  proto.toNow = toNow;
  proto.get = stringGet;
  proto.invalidAt = invalidAt;
  proto.isAfter = isAfter;
  proto.isBefore = isBefore;
  proto.isBetween = isBetween;
  proto.isSame = isSame;
  proto.isSameOrAfter = isSameOrAfter;
  proto.isSameOrBefore = isSameOrBefore;
  proto.isValid = isValid$2;
  proto.lang = lang;
  proto.locale = locale;
  proto.localeData = localeData;
  proto.max = prototypeMax;
  proto.min = prototypeMin;
  proto.parsingFlags = parsingFlags;
  proto.set = stringSet;
  proto.startOf = startOf;
  proto.subtract = subtract;
  proto.toArray = toArray;
  proto.toObject = toObject;
  proto.toDate = toDate;
  proto.toISOString = toISOString;
  proto.inspect = inspect;
  if (typeof Symbol !== "undefined" && Symbol.for != null) {
    proto[/* @__PURE__ */ Symbol.for("nodejs.util.inspect.custom")] = function() {
      return "Moment<" + this.format() + ">";
    };
  }
  proto.toJSON = toJSON;
  proto.toString = toString;
  proto.unix = unix;
  proto.valueOf = valueOf;
  proto.creationData = creationData;
  proto.eraName = getEraName;
  proto.eraNarrow = getEraNarrow;
  proto.eraAbbr = getEraAbbr;
  proto.eraYear = getEraYear;
  proto.year = getSetYear;
  proto.isLeapYear = getIsLeapYear;
  proto.weekYear = getSetWeekYear;
  proto.isoWeekYear = getSetISOWeekYear;
  proto.quarter = proto.quarters = getSetQuarter;
  proto.month = getSetMonth;
  proto.daysInMonth = getDaysInMonth;
  proto.week = proto.weeks = getSetWeek;
  proto.isoWeek = proto.isoWeeks = getSetISOWeek;
  proto.weeksInYear = getWeeksInYear;
  proto.weeksInWeekYear = getWeeksInWeekYear;
  proto.isoWeeksInYear = getISOWeeksInYear;
  proto.isoWeeksInISOWeekYear = getISOWeeksInISOWeekYear;
  proto.date = getSetDayOfMonth;
  proto.day = proto.days = getSetDayOfWeek;
  proto.weekday = getSetLocaleDayOfWeek;
  proto.isoWeekday = getSetISODayOfWeek;
  proto.dayOfYear = getSetDayOfYear;
  proto.hour = proto.hours = getSetHour;
  proto.minute = proto.minutes = getSetMinute;
  proto.second = proto.seconds = getSetSecond;
  proto.millisecond = proto.milliseconds = getSetMillisecond;
  proto.utcOffset = getSetOffset;
  proto.utc = setOffsetToUTC;
  proto.local = setOffsetToLocal;
  proto.parseZone = setOffsetToParsedOffset;
  proto.hasAlignedHourOffset = hasAlignedHourOffset;
  proto.isDST = isDaylightSavingTime;
  proto.isLocal = isLocal;
  proto.isUtcOffset = isUtcOffset;
  proto.isUtc = isUtc;
  proto.isUTC = isUtc;
  proto.zoneAbbr = getZoneAbbr;
  proto.zoneName = getZoneName;
  proto.dates = deprecate(
    "dates accessor is deprecated. Use date instead.",
    getSetDayOfMonth
  );
  proto.months = deprecate(
    "months accessor is deprecated. Use month instead",
    getSetMonth
  );
  proto.years = deprecate(
    "years accessor is deprecated. Use year instead",
    getSetYear
  );
  proto.zone = deprecate(
    "moment().zone is deprecated, use moment().utcOffset instead. http://momentjs.com/guides/#/warnings/zone/",
    getSetZone
  );
  proto.isDSTShifted = deprecate(
    "isDSTShifted is deprecated. See http://momentjs.com/guides/#/warnings/dst-shifted/ for more information",
    isDaylightSavingTimeShifted
  );
  function createUnix(input) {
    return createLocal(input * 1e3);
  }
  function createInZone() {
    return createLocal.apply(null, arguments).parseZone();
  }
  function preParsePostFormat(string) {
    return string;
  }
  var proto$1 = Locale.prototype;
  proto$1.calendar = calendar;
  proto$1.longDateFormat = longDateFormat;
  proto$1.invalidDate = invalidDate;
  proto$1.ordinal = ordinal;
  proto$1.preparse = preParsePostFormat;
  proto$1.postformat = preParsePostFormat;
  proto$1.relativeTime = relativeTime;
  proto$1.pastFuture = pastFuture;
  proto$1.set = set;
  proto$1.eras = localeEras;
  proto$1.erasParse = localeErasParse;
  proto$1.erasConvertYear = localeErasConvertYear;
  proto$1.erasAbbrRegex = erasAbbrRegex;
  proto$1.erasNameRegex = erasNameRegex;
  proto$1.erasNarrowRegex = erasNarrowRegex;
  proto$1.months = localeMonths;
  proto$1.monthsShort = localeMonthsShort;
  proto$1.monthsParse = localeMonthsParse;
  proto$1.monthsRegex = monthsRegex;
  proto$1.monthsShortRegex = monthsShortRegex;
  proto$1.week = localeWeek;
  proto$1.firstDayOfYear = localeFirstDayOfYear;
  proto$1.firstDayOfWeek = localeFirstDayOfWeek;
  proto$1.weekdays = localeWeekdays;
  proto$1.weekdaysMin = localeWeekdaysMin;
  proto$1.weekdaysShort = localeWeekdaysShort;
  proto$1.weekdaysParse = localeWeekdaysParse;
  proto$1.weekdaysRegex = weekdaysRegex;
  proto$1.weekdaysShortRegex = weekdaysShortRegex;
  proto$1.weekdaysMinRegex = weekdaysMinRegex;
  proto$1.isPM = localeIsPM;
  proto$1.meridiem = localeMeridiem;
  function get$1(format2, index, field, setter) {
    var locale2 = getLocale(), utc = createUTC().set(setter, index);
    return locale2[field](utc, format2);
  }
  function listMonthsImpl(format2, index, field) {
    if (isNumber(format2)) {
      index = format2;
      format2 = void 0;
    }
    format2 = format2 || "";
    if (index != null) {
      return get$1(format2, index, field, "month");
    }
    var i, out = [];
    for (i = 0; i < 12; i++) {
      out[i] = get$1(format2, i, field, "month");
    }
    return out;
  }
  function listWeekdaysImpl(localeSorted, format2, index, field) {
    if (typeof localeSorted === "boolean") {
      if (isNumber(format2)) {
        index = format2;
        format2 = void 0;
      }
      format2 = format2 || "";
    } else {
      format2 = localeSorted;
      index = format2;
      localeSorted = false;
      if (isNumber(format2)) {
        index = format2;
        format2 = void 0;
      }
      format2 = format2 || "";
    }
    var locale2 = getLocale(), shift = localeSorted ? locale2._week.dow : 0, i, out = [];
    if (index != null) {
      return get$1(format2, (index + shift) % 7, field, "day");
    }
    for (i = 0; i < 7; i++) {
      out[i] = get$1(format2, (i + shift) % 7, field, "day");
    }
    return out;
  }
  function listMonths(format2, index) {
    return listMonthsImpl(format2, index, "months");
  }
  function listMonthsShort(format2, index) {
    return listMonthsImpl(format2, index, "monthsShort");
  }
  function listWeekdays(localeSorted, format2, index) {
    return listWeekdaysImpl(localeSorted, format2, index, "weekdays");
  }
  function listWeekdaysShort(localeSorted, format2, index) {
    return listWeekdaysImpl(localeSorted, format2, index, "weekdaysShort");
  }
  function listWeekdaysMin(localeSorted, format2, index) {
    return listWeekdaysImpl(localeSorted, format2, index, "weekdaysMin");
  }
  getSetGlobalLocale("en", {
    eras: [
      {
        since: "0001-01-01",
        until: Infinity,
        offset: 1,
        name: "Anno Domini",
        narrow: "AD",
        abbr: "AD"
      },
      {
        since: "0000-12-31",
        until: -Infinity,
        offset: 1,
        name: "Before Christ",
        narrow: "BC",
        abbr: "BC"
      }
    ],
    dayOfMonthOrdinalParse: /\d{1,2}(th|st|nd|rd)/,
    ordinal: function(number) {
      var b = number % 10, output = toInt(number % 100 / 10) === 1 ? "th" : b === 1 ? "st" : b === 2 ? "nd" : b === 3 ? "rd" : "th";
      return number + output;
    }
  });
  hooks.lang = deprecate(
    "moment.lang is deprecated. Use moment.locale instead.",
    getSetGlobalLocale
  );
  hooks.langData = deprecate(
    "moment.langData is deprecated. Use moment.localeData instead.",
    getLocale
  );
  var mathAbs = Math.abs;
  function abs() {
    var data = this._data;
    this._milliseconds = mathAbs(this._milliseconds);
    this._days = mathAbs(this._days);
    this._months = mathAbs(this._months);
    data.milliseconds = mathAbs(data.milliseconds);
    data.seconds = mathAbs(data.seconds);
    data.minutes = mathAbs(data.minutes);
    data.hours = mathAbs(data.hours);
    data.months = mathAbs(data.months);
    data.years = mathAbs(data.years);
    return this;
  }
  function addSubtract$1(duration, input, value, direction) {
    var other = createDuration(input, value);
    duration._milliseconds += direction * other._milliseconds;
    duration._days += direction * other._days;
    duration._months += direction * other._months;
    return duration._bubble();
  }
  function add$1(input, value) {
    return addSubtract$1(this, input, value, 1);
  }
  function subtract$1(input, value) {
    return addSubtract$1(this, input, value, -1);
  }
  function absCeil(number) {
    if (number < 0) {
      return Math.floor(number);
    } else {
      return Math.ceil(number);
    }
  }
  function bubble() {
    var milliseconds2 = this._milliseconds, days2 = this._days, months2 = this._months, data = this._data, seconds2, minutes2, hours2, years2, monthsFromDays;
    if (!(milliseconds2 >= 0 && days2 >= 0 && months2 >= 0 || milliseconds2 <= 0 && days2 <= 0 && months2 <= 0)) {
      milliseconds2 += absCeil(monthsToDays(months2) + days2) * 864e5;
      days2 = 0;
      months2 = 0;
    }
    data.milliseconds = milliseconds2 % 1e3;
    seconds2 = absFloor(milliseconds2 / 1e3);
    data.seconds = seconds2 % 60;
    minutes2 = absFloor(seconds2 / 60);
    data.minutes = minutes2 % 60;
    hours2 = absFloor(minutes2 / 60);
    data.hours = hours2 % 24;
    days2 += absFloor(hours2 / 24);
    monthsFromDays = absFloor(daysToMonths(days2));
    months2 += monthsFromDays;
    days2 -= absCeil(monthsToDays(monthsFromDays));
    years2 = absFloor(months2 / 12);
    months2 %= 12;
    data.days = days2;
    data.months = months2;
    data.years = years2;
    return this;
  }
  function daysToMonths(days2) {
    return days2 * 4800 / 146097;
  }
  function monthsToDays(months2) {
    return months2 * 146097 / 4800;
  }
  function as(units) {
    if (!this.isValid()) {
      return NaN;
    }
    var days2, months2, milliseconds2 = this._milliseconds;
    units = normalizeUnits(units);
    if (units === "month" || units === "quarter" || units === "year") {
      days2 = this._days + milliseconds2 / 864e5;
      months2 = this._months + daysToMonths(days2);
      switch (units) {
        case "month":
          return months2;
        case "quarter":
          return months2 / 3;
        case "year":
          return months2 / 12;
      }
    } else {
      days2 = this._days + Math.round(monthsToDays(this._months));
      switch (units) {
        case "week":
          return days2 / 7 + milliseconds2 / 6048e5;
        case "day":
          return days2 + milliseconds2 / 864e5;
        case "hour":
          return days2 * 24 + milliseconds2 / 36e5;
        case "minute":
          return days2 * 1440 + milliseconds2 / 6e4;
        case "second":
          return days2 * 86400 + milliseconds2 / 1e3;
        // Math.floor prevents floating point math errors here
        case "millisecond":
          return Math.floor(days2 * 864e5) + milliseconds2;
        default:
          throw new Error("Unknown unit " + units);
      }
    }
  }
  function makeAs(alias) {
    return function() {
      return this.as(alias);
    };
  }
  var asMilliseconds = makeAs("ms"), asSeconds = makeAs("s"), asMinutes = makeAs("m"), asHours = makeAs("h"), asDays = makeAs("d"), asWeeks = makeAs("w"), asMonths = makeAs("M"), asQuarters = makeAs("Q"), asYears = makeAs("y"), valueOf$1 = asMilliseconds;
  function clone$1() {
    return createDuration(this);
  }
  function get$2(units) {
    units = normalizeUnits(units);
    return this.isValid() ? this[units + "s"]() : NaN;
  }
  function makeGetter(name) {
    return function() {
      return this.isValid() ? this._data[name] : NaN;
    };
  }
  var milliseconds = makeGetter("milliseconds"), seconds = makeGetter("seconds"), minutes = makeGetter("minutes"), hours = makeGetter("hours"), days = makeGetter("days"), months = makeGetter("months"), years = makeGetter("years");
  function weeks() {
    return absFloor(this.days() / 7);
  }
  var round = Math.round, thresholds = {
    ss: 44,
    // a few seconds to seconds
    s: 45,
    // seconds to minute
    m: 45,
    // minutes to hour
    h: 22,
    // hours to day
    d: 26,
    // days to month/week
    w: null,
    // weeks to month
    M: 11
    // months to year
  };
  function substituteTimeAgo(string, number, withoutSuffix, isFuture, locale2) {
    return locale2.relativeTime(number || 1, !!withoutSuffix, string, isFuture);
  }
  function relativeTime$1(posNegDuration, withoutSuffix, thresholds2, locale2) {
    var duration = createDuration(posNegDuration).abs(), seconds2 = round(duration.as("s")), minutes2 = round(duration.as("m")), hours2 = round(duration.as("h")), days2 = round(duration.as("d")), months2 = round(duration.as("M")), weeks2 = round(duration.as("w")), years2 = round(duration.as("y")), a = seconds2 <= thresholds2.ss && ["s", seconds2] || seconds2 < thresholds2.s && ["ss", seconds2] || minutes2 <= 1 && ["m"] || minutes2 < thresholds2.m && ["mm", minutes2] || hours2 <= 1 && ["h"] || hours2 < thresholds2.h && ["hh", hours2] || days2 <= 1 && ["d"] || days2 < thresholds2.d && ["dd", days2];
    if (thresholds2.w != null) {
      a = a || weeks2 <= 1 && ["w"] || weeks2 < thresholds2.w && ["ww", weeks2];
    }
    a = a || months2 <= 1 && ["M"] || months2 < thresholds2.M && ["MM", months2] || years2 <= 1 && ["y"] || ["yy", years2];
    a[2] = withoutSuffix;
    a[3] = +posNegDuration > 0;
    a[4] = locale2;
    return substituteTimeAgo.apply(null, a);
  }
  function getSetRelativeTimeRounding(roundingFunction) {
    if (roundingFunction === void 0) {
      return round;
    }
    if (typeof roundingFunction === "function") {
      round = roundingFunction;
      return true;
    }
    return false;
  }
  function getSetRelativeTimeThreshold(threshold, limit) {
    if (thresholds[threshold] === void 0) {
      return false;
    }
    if (limit === void 0) {
      return thresholds[threshold];
    }
    thresholds[threshold] = limit;
    if (threshold === "s") {
      thresholds.ss = limit - 1;
    }
    return true;
  }
  function humanize(argWithSuffix, argThresholds) {
    if (!this.isValid()) {
      return this.localeData().invalidDate();
    }
    var withSuffix = false, th = thresholds, locale2, output;
    if (typeof argWithSuffix === "object") {
      argThresholds = argWithSuffix;
      argWithSuffix = false;
    }
    if (typeof argWithSuffix === "boolean") {
      withSuffix = argWithSuffix;
    }
    if (typeof argThresholds === "object") {
      th = Object.assign({}, thresholds, argThresholds);
      if (argThresholds.s != null && argThresholds.ss == null) {
        th.ss = argThresholds.s - 1;
      }
    }
    locale2 = this.localeData();
    output = relativeTime$1(this, !withSuffix, th, locale2);
    if (withSuffix) {
      output = locale2.pastFuture(+this, output);
    }
    return locale2.postformat(output);
  }
  var abs$1 = Math.abs;
  function sign(x) {
    return (x > 0) - (x < 0) || +x;
  }
  function toISOString$1() {
    if (!this.isValid()) {
      return this.localeData().invalidDate();
    }
    var seconds2 = abs$1(this._milliseconds) / 1e3, days2 = abs$1(this._days), months2 = abs$1(this._months), minutes2, hours2, years2, s, total = this.asSeconds(), totalSign, ymSign, daysSign, hmsSign;
    if (!total) {
      return "P0D";
    }
    minutes2 = absFloor(seconds2 / 60);
    hours2 = absFloor(minutes2 / 60);
    seconds2 %= 60;
    minutes2 %= 60;
    years2 = absFloor(months2 / 12);
    months2 %= 12;
    s = seconds2 ? seconds2.toFixed(3).replace(/\.?0+$/, "") : "";
    totalSign = total < 0 ? "-" : "";
    ymSign = sign(this._months) !== sign(total) ? "-" : "";
    daysSign = sign(this._days) !== sign(total) ? "-" : "";
    hmsSign = sign(this._milliseconds) !== sign(total) ? "-" : "";
    return totalSign + "P" + (years2 ? ymSign + years2 + "Y" : "") + (months2 ? ymSign + months2 + "M" : "") + (days2 ? daysSign + days2 + "D" : "") + (hours2 || minutes2 || seconds2 ? "T" : "") + (hours2 ? hmsSign + hours2 + "H" : "") + (minutes2 ? hmsSign + minutes2 + "M" : "") + (seconds2 ? hmsSign + s + "S" : "");
  }
  var proto$2 = Duration.prototype;
  proto$2.isValid = isValid$1;
  proto$2.abs = abs;
  proto$2.add = add$1;
  proto$2.subtract = subtract$1;
  proto$2.as = as;
  proto$2.asMilliseconds = asMilliseconds;
  proto$2.asSeconds = asSeconds;
  proto$2.asMinutes = asMinutes;
  proto$2.asHours = asHours;
  proto$2.asDays = asDays;
  proto$2.asWeeks = asWeeks;
  proto$2.asMonths = asMonths;
  proto$2.asQuarters = asQuarters;
  proto$2.asYears = asYears;
  proto$2.valueOf = valueOf$1;
  proto$2._bubble = bubble;
  proto$2.clone = clone$1;
  proto$2.get = get$2;
  proto$2.milliseconds = milliseconds;
  proto$2.seconds = seconds;
  proto$2.minutes = minutes;
  proto$2.hours = hours;
  proto$2.days = days;
  proto$2.weeks = weeks;
  proto$2.months = months;
  proto$2.years = years;
  proto$2.humanize = humanize;
  proto$2.toISOString = toISOString$1;
  proto$2.toString = toISOString$1;
  proto$2.toJSON = toISOString$1;
  proto$2.locale = locale;
  proto$2.localeData = localeData;
  proto$2.toIsoString = deprecate(
    "toIsoString() is deprecated. Please use toISOString() instead (notice the capitals)",
    toISOString$1
  );
  proto$2.lang = lang;
  addFormatToken("X", 0, 0, "unix");
  addFormatToken("x", 0, 0, "valueOf");
  addRegexToken("x", matchSigned);
  addRegexToken("X", matchTimestamp);
  addParseToken("X", function(input, array, config) {
    config._d = new Date(parseFloat(input) * 1e3);
  });
  addParseToken("x", function(input, array, config) {
    config._d = new Date(toInt(input));
  });
  hooks.version = "2.30.1";
  setHookCallback(createLocal);
  hooks.fn = proto;
  hooks.min = min;
  hooks.max = max;
  hooks.now = now;
  hooks.utc = createUTC;
  hooks.unix = createUnix;
  hooks.months = listMonths;
  hooks.isDate = isDate;
  hooks.locale = getSetGlobalLocale;
  hooks.invalid = createInvalid;
  hooks.duration = createDuration;
  hooks.isMoment = isMoment;
  hooks.weekdays = listWeekdays;
  hooks.parseZone = createInZone;
  hooks.localeData = getLocale;
  hooks.isDuration = isDuration;
  hooks.monthsShort = listMonthsShort;
  hooks.weekdaysMin = listWeekdaysMin;
  hooks.defineLocale = defineLocale;
  hooks.updateLocale = updateLocale;
  hooks.locales = listLocales;
  hooks.weekdaysShort = listWeekdaysShort;
  hooks.normalizeUnits = normalizeUnits;
  hooks.relativeTimeRounding = getSetRelativeTimeRounding;
  hooks.relativeTimeThreshold = getSetRelativeTimeThreshold;
  hooks.calendarFormat = getCalendarFormat;
  hooks.prototype = proto;
  hooks.HTML5_FMT = {
    DATETIME_LOCAL: "YYYY-MM-DDTHH:mm",
    // <input type="datetime-local" />
    DATETIME_LOCAL_SECONDS: "YYYY-MM-DDTHH:mm:ss",
    // <input type="datetime-local" step="1" />
    DATETIME_LOCAL_MS: "YYYY-MM-DDTHH:mm:ss.SSS",
    // <input type="datetime-local" step="0.001" />
    DATE: "YYYY-MM-DD",
    // <input type="date" />
    TIME: "HH:mm",
    // <input type="time" />
    TIME_SECONDS: "HH:mm:ss",
    // <input type="time" step="1" />
    TIME_MS: "HH:mm:ss.SSS",
    // <input type="time" step="0.001" />
    WEEK: "GGGG-[W]WW",
    // <input type="week" />
    MONTH: "YYYY-MM"
    // <input type="month" />
  };
  const YEAR = "year";
  const MONTH = "month";
  const DAY = "day";
  const HOUR = "hour";
  const MINUTE = "minute";
  const SECOND = "second";
  const MILLISECOND = "millisecond";
  const date_utils = {
    // >>> SR: Configurable date formatter ------------------------------------
    _date_formatter: null,
    _date_format_default: "YYYY-MM-DD HH:mm:ss.SSS",
    /**
     * Configures the date formatter used by date_utils.format().
     * The formatter is prepared once so format() can stay cheap because it is
     * called very often while rendering headers, popups and bars.
     */
    set_date_formatter(date_formatter = null, date_format_default = "YYYY-MM-DD HH:mm:ss.SSS") {
      this._date_format_default = date_format_default || "YYYY-MM-DD HH:mm:ss.SSS";
      if (date_formatter != null && typeof date_formatter !== "function") {
        console.warn("date_formatter must be a function or null. Falling back to default_formatter().");
      }
      this._date_formatter = typeof date_formatter === "function" ? date_formatter : ((date, format_string, lang2) => this.default_formatter(date, format_string, lang2));
    },
    // <<< SR: Configurable date formatter ------------------------------------
    parse_duration(duration) {
      const regex = /([0-9]+)(y|m|d|h|min|s|ms)/gm;
      const matches = regex.exec(duration);
      if (matches !== null) {
        if (matches[2] === "y") {
          return { duration: parseInt(matches[1]), scale: `year` };
        } else if (matches[2] === "m") {
          return { duration: parseInt(matches[1]), scale: `month` };
        } else if (matches[2] === "d") {
          return { duration: parseInt(matches[1]), scale: `day` };
        } else if (matches[2] === "h") {
          return { duration: parseInt(matches[1]), scale: `hour` };
        } else if (matches[2] === "min") {
          return { duration: parseInt(matches[1]), scale: `minute` };
        } else if (matches[2] === "s") {
          return { duration: parseInt(matches[1]), scale: `second` };
        } else if (matches[2] === "ms") {
          return { duration: parseInt(matches[1]), scale: `millisecond` };
        }
      }
    },
    parse(date, date_separator = "-", time_separator = /[.:]/) {
      if (date instanceof Date) {
        return date;
      }
      if (typeof date === "string") {
        let date_parts, time_parts;
        const parts = date.split(" ");
        date_parts = parts[0].split(date_separator).map((val) => parseInt(val, 10));
        time_parts = parts[1] && parts[1].split(time_separator);
        date_parts[1] = date_parts[1] ? date_parts[1] - 1 : 0;
        let vals = date_parts;
        if (time_parts && time_parts.length) {
          if (time_parts.length === 4) {
            time_parts[3] = "0." + time_parts[3];
            time_parts[3] = parseFloat(time_parts[3]) * 1e3;
          }
          vals = vals.concat(time_parts);
        }
        return new Date(...vals);
      }
    },
    to_string(date, with_time = false) {
      if (!(date instanceof Date)) {
        throw new TypeError("Invalid argument type");
      }
      const vals = this.get_date_values(date).map((val, i) => {
        if (i === 1) {
          val = val + 1;
        }
        if (i === 6) {
          return padStart(val + "", 3, "0");
        }
        return padStart(val + "", 2, "0");
      });
      const date_string = `${vals[0]}-${vals[1]}-${vals[2]}`;
      const time_string = `${vals[3]}:${vals[4]}:${vals[5]}.${vals[6]}`;
      return date_string + (with_time ? " " + time_string : "");
    },
    // >>> SR: Bar Aggregation -------------------------------------------------
    format(date, date_format, lang2 = "en") {
      return this._date_formatter(date, date_format || this._date_format_default, lang2);
    },
    default_formatter(date, date_format = "YYYY-MM-DD HH:mm:ss.SSS", lang2 = "en") {
      const dateTimeFormat = new Intl.DateTimeFormat(lang2, {
        month: "long"
      });
      const dateTimeFormatShort = new Intl.DateTimeFormat(lang2, {
        month: "short"
      });
      const month_name = dateTimeFormat.format(date);
      const month_name_capitalized = month_name.charAt(0).toUpperCase() + month_name.slice(1);
      const values = this.get_date_values(date).map(
        (d, i) => padStart(d, i === 6 ? 3 : 2, 0)
      );
      const format_map = {
        YYYY: values[0],
        yyyy: values[0],
        yy: String(values[0]).slice(-2),
        MM: padStart(+values[1] + 1, 2, 0),
        DD: values[2],
        dd: values[2],
        d: date.getDate(),
        HH: values[3],
        mm: values[4],
        ss: values[5],
        SSS: values[6],
        D: values[2],
        MMMM: month_name_capitalized,
        MMM: dateTimeFormatShort.format(date)
      };
      let str = date_format;
      const formatted_values = [];
      Object.keys(format_map).sort((a, b) => b.length - a.length).forEach((key) => {
        if (str.includes(key)) {
          str = str.replaceAll(key, `$${formatted_values.length}`);
          formatted_values.push(format_map[key]);
        }
      });
      formatted_values.forEach((value, i) => {
        str = str.replaceAll(`$${i}`, value);
      });
      return str;
    },
    // <<< SR: Bar Aggregation -------------------------------------------------
    diff(date_a, date_b, scale = "day") {
      let milliseconds2, seconds2, hours2, minutes2, days2, months2, years2;
      milliseconds2 = date_a - date_b + (date_b.getTimezoneOffset() - date_a.getTimezoneOffset()) * 6e4;
      seconds2 = milliseconds2 / 1e3;
      minutes2 = seconds2 / 60;
      hours2 = minutes2 / 60;
      days2 = hours2 / 24;
      let yearDiff = date_a.getFullYear() - date_b.getFullYear();
      let monthDiff2 = date_a.getMonth() - date_b.getMonth();
      monthDiff2 += days2 % 30 / 30;
      months2 = yearDiff * 12 + monthDiff2;
      if (date_a.getDate() < date_b.getDate()) {
        months2--;
      }
      years2 = months2 / 12;
      if (!scale.endsWith("s")) {
        scale += "s";
      }
      return Math.round(
        {
          milliseconds: milliseconds2,
          seconds: seconds2,
          minutes: minutes2,
          hours: hours2,
          days: days2,
          months: months2,
          years: years2
        }[scale] * 100
      ) / 100;
    },
    today() {
      const vals = this.get_date_values(/* @__PURE__ */ new Date()).slice(0, 3);
      return new Date(...vals);
    },
    now() {
      return /* @__PURE__ */ new Date();
    },
    add(date, qty, scale) {
      qty = parseInt(qty, 10);
      return hooks(date).add(qty, `${scale}s`).toDate();
    },
    start_of(date, scale) {
      const scores = {
        [YEAR]: 6,
        [MONTH]: 5,
        [DAY]: 4,
        [HOUR]: 3,
        [MINUTE]: 2,
        [SECOND]: 1,
        [MILLISECOND]: 0
      };
      function should_reset(_scale) {
        const max_score = scores[scale];
        return scores[_scale] <= max_score;
      }
      if (date === void 0) {
        return /* @__PURE__ */ new Date();
      }
      const vals = [
        date.getFullYear(),
        should_reset(YEAR) ? 0 : date.getMonth(),
        should_reset(MONTH) ? 1 : date.getDate(),
        should_reset(DAY) ? 0 : date.getHours(),
        should_reset(HOUR) ? 0 : date.getMinutes(),
        should_reset(MINUTE) ? 0 : date.getSeconds(),
        should_reset(SECOND) ? 0 : date.getMilliseconds()
      ];
      return new Date(...vals);
    },
    clone(date) {
      return new Date(...this.get_date_values(date));
    },
    get_date_values(date) {
      return [
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        date.getHours(),
        date.getMinutes(),
        date.getSeconds(),
        date.getMilliseconds()
      ];
    },
    convert_scales(period, to_scale) {
      const TO_DAYS = {
        millisecond: 1 / 60 / 60 / 24 / 1e3,
        second: 1 / 60 / 60 / 24,
        minute: 1 / 60 / 24,
        hour: 1 / 24,
        day: 1,
        month: 30,
        year: 365
      };
      const { duration, scale } = this.parse_duration(period);
      let in_days = duration * TO_DAYS[scale];
      return in_days / TO_DAYS[to_scale];
    },
    get_days_in_month(date) {
      const no_of_days = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
      const month = date.getMonth();
      if (month !== 1) {
        return no_of_days[month];
      }
      const year = date.getFullYear();
      if (year % 4 === 0 && year % 100 != 0 || year % 400 === 0) {
        return 29;
      }
      return 28;
    },
    get_days_in_year(date) {
      return date.getFullYear() % 4 ? 365 : 366;
    }
  };
  date_utils.set_date_formatter(null);
  function padStart(str, targetLength, padString) {
    str = str + "";
    targetLength = targetLength >> 0;
    padString = String(typeof padString !== "undefined" ? padString : " ");
    if (str.length > targetLength) {
      return String(str);
    } else {
      targetLength = targetLength - str.length;
      if (targetLength > padString.length) {
        padString += padString.repeat(targetLength / padString.length);
      }
      return padString.slice(0, targetLength) + String(str);
    }
  }
  function $(expr, con) {
    return typeof expr === "string" ? (con || document).querySelector(expr) : expr || null;
  }
  function createSVG(tag, attrs) {
    const elem = document.createElementNS("http://www.w3.org/2000/svg", tag);
    for (let attr in attrs) {
      if (attr === "append_to") {
        const parent = attrs.append_to;
        parent.appendChild(elem);
      } else if (attr === "innerHTML") {
        elem.innerHTML = attrs.innerHTML;
      } else if (attr === "clipPath") {
        elem.setAttribute("clip-path", "url(#" + attrs[attr] + ")");
      } else {
        elem.setAttribute(attr, attrs[attr]);
      }
    }
    return elem;
  }
  function animateSVG(svgElement, attr, from2, to2) {
    const animatedSvgElement = getAnimationElement(svgElement, attr, from2, to2);
    if (animatedSvgElement === svgElement) {
      const event = document.createEvent("HTMLEvents");
      event.initEvent("click", true, true);
      event.eventName = "click";
      animatedSvgElement.dispatchEvent(event);
    }
  }
  function getAnimationElement(svgElement, attr, from2, to2, dur = "0.4s", begin = "0.1s") {
    const animEl = svgElement.querySelector("animate");
    if (animEl) {
      $.attr(animEl, {
        attributeName: attr,
        from: from2,
        to: to2,
        dur,
        begin: "click + " + begin
        // artificial click
      });
      return svgElement;
    }
    const animateElement = createSVG("animate", {
      attributeName: attr,
      from: from2,
      to: to2,
      dur,
      begin,
      calcMode: "spline",
      values: from2 + ";" + to2,
      keyTimes: "0; 1",
      keySplines: cubic_bezier("ease-out")
    });
    svgElement.appendChild(animateElement);
    return svgElement;
  }
  function cubic_bezier(name) {
    return {
      ease: ".25 .1 .25 1",
      linear: "0 0 1 1",
      "ease-in": ".42 0 1 1",
      "ease-out": "0 0 .58 1",
      "ease-in-out": ".42 0 .58 1"
    }[name];
  }
  $.on = (element, event, selector, callback) => {
    if (!callback) {
      callback = selector;
      $.bind(element, event, callback);
    } else {
      $.delegate(element, event, selector, callback);
    }
  };
  $.off = (element, event, handler) => {
    element.removeEventListener(event, handler);
  };
  $.bind = (element, event, callback) => {
    event.split(/\s+/).forEach(function(event2) {
      element.addEventListener(event2, callback);
    });
  };
  $.delegate = (element, event, selector, callback) => {
    element.addEventListener(event, function(e) {
      const delegatedTarget = e.target.closest(selector);
      if (delegatedTarget) {
        e.delegatedTarget = delegatedTarget;
        callback.call(this, e, delegatedTarget);
      }
    });
  };
  $.closest = (selector, element) => {
    if (!element) return null;
    if (element.matches(selector)) {
      return element;
    }
    return $.closest(selector, element.parentNode);
  };
  $.attr = (element, attr, value) => {
    if (!value && typeof attr === "string") {
      return element.getAttribute(attr);
    }
    if (typeof attr === "object") {
      for (let key in attr) {
        $.attr(element, key, attr[key]);
      }
      return;
    }
    element.setAttribute(attr, value);
  };
  class Arrow {
    constructor(gantt, from_task, to_task) {
      this.gantt = gantt;
      this.from_task = from_task;
      this.to_task = to_task;
      this.calculate_path();
      this.draw();
    }
    calculate_path() {
      let start_x = this.from_task.$bar.getX() + this.from_task.$bar.getWidth() / 2;
      const condition = () => this.to_task.$bar.getX() < start_x + this.gantt.options.padding && start_x > this.from_task.$bar.getX() + this.gantt.options.padding;
      while (condition()) {
        start_x -= 10;
      }
      start_x -= 10;
      const start_y = this.from_task.$bar.getY() + this.from_task.$bar.getHeight() / 2;
      const end_x = this.to_task.$bar.getX() - this.gantt.options.padding / 2;
      const end_y = this.to_task.$bar.getY() + this.to_task.$bar.getHeight() / 2;
      const from_is_below_to = this.from_task.task._index > this.to_task.task._index;
      let curve = this.gantt.options.arrow_curve;
      const clockwise = from_is_below_to ? 1 : 0;
      let curve_y = from_is_below_to ? -curve : curve;
      if (this.to_task.$bar.getX() <= this.from_task.$bar.getX() + this.gantt.options.padding) {
        let down_1 = this.gantt.options.padding / 2 - curve;
        if (down_1 < 0) {
          down_1 = 0;
          curve = this.gantt.options.padding / 2;
          curve_y = from_is_below_to ? -curve : curve;
        }
        const down_2 = this.to_task.$bar.getY() + this.to_task.$bar.getHeight() / 2 - curve_y;
        const left = this.to_task.$bar.getX() - this.gantt.options.padding;
        this.path = `
                M ${start_x} ${start_y}
                v ${down_1}
                a ${curve} ${curve} 0 0 1 ${-curve} ${curve}
                H ${left}
                a ${curve} ${curve} 0 0 ${clockwise} ${-curve} ${curve_y}
                V ${down_2}
                a ${curve} ${curve} 0 0 ${clockwise} ${curve} ${curve_y}
                L ${end_x} ${end_y}
                m -5 -5
                l 5 5
                l -5 5`;
      } else {
        if (end_x < start_x + curve) curve = end_x - start_x;
        let offset2 = from_is_below_to ? end_y + curve : end_y - curve;
        this.path = `
              M ${start_x} ${start_y}
              V ${offset2}
              a ${curve} ${curve} 0 0 ${clockwise} ${curve} ${curve}
              L ${end_x} ${end_y}
              m -5 -5
              l 5 5
              l -5 5`;
      }
    }
    draw() {
      this.element = createSVG("path", {
        d: this.path,
        "data-from": this.from_task.task.id,
        "data-to": this.to_task.task.id
      });
    }
    update() {
      this.calculate_path();
      this.element.setAttribute("d", this.path);
    }
  }
  class Bar {
    constructor(gantt, task) {
      this.set_defaults(gantt, task);
      this.prepare_wrappers();
      this.prepare_helpers();
      this.refresh();
    }
    refresh() {
      this.bar_group.innerHTML = "";
      this.handle_group.innerHTML = "";
      if (this.task.custom_class) {
        this.group.classList.add(this.task.custom_class);
      } else {
        this.group.classList = ["bar-wrapper"];
      }
      this.prepare_values();
      this.draw();
      this.bind();
    }
    set_defaults(gantt, task) {
      this.action_completed = false;
      this.gantt = gantt;
      this.task = task;
      this.name = this.name || "";
    }
    prepare_wrappers() {
      this.group = createSVG("g", {
        class: "bar-wrapper" + (this.task.custom_class ? " " + this.task.custom_class : ""),
        "data-id": this.task.id
      });
      this.bar_group = createSVG("g", {
        class: "bar-group",
        append_to: this.group
      });
      this.handle_group = createSVG("g", {
        class: "handle-group",
        append_to: this.group
      });
    }
    prepare_values() {
      this.invalid = this.task.invalid;
      this.height = this.get_bar_height_for_task(this.task);
      this.image_size = this.height - 5;
      this.task.orig_end = this.task.end ? date_utils.clone(this.task._end) : null;
      this.compute_x();
      this.compute_y();
      this.compute_duration();
      this.corner_radius = Math.min(this.gantt.options.bar_corner_radius, this.height / 2);
      this.width = this.compute_width();
      if (!this.task.progress || this.task.progress < 0)
        this.task.progress = 0;
      if (this.task.progress > 100) this.task.progress = 100;
    }
    prepare_helpers() {
      SVGElement.prototype.getX = function() {
        return +this.getAttribute("x");
      };
      SVGElement.prototype.getY = function() {
        return +this.getAttribute("y");
      };
      SVGElement.prototype.getWidth = function() {
        return +this.getAttribute("width");
      };
      SVGElement.prototype.getHeight = function() {
        return +this.getAttribute("height");
      };
      SVGElement.prototype.getEndX = function() {
        return this.getX() + this.getWidth();
      };
    }
    prepare_expected_progress_values() {
      this.compute_expected_progress();
      this.expected_progress_width = this.gantt.options.column_width * this.duration * (this.expected_progress / 100) || 0;
    }
    draw() {
      this.draw_bar();
      this.draw_progress_bar();
      if (this.gantt.options.show_expected_progress) {
        this.prepare_expected_progress_values();
        this.draw_expected_progress_bar();
      }
      this.draw_label();
      this.draw_resize_handles();
      if (this.task.thumbnail) {
        this.draw_thumbnail();
      }
    }
    draw_bar() {
      this.$bar = createSVG("rect", {
        x: this.x,
        y: this.y,
        width: this.width,
        height: this.height,
        rx: this.corner_radius,
        ry: this.corner_radius,
        class: "bar",
        append_to: this.bar_group
      });
      this.set_bar_colors();
      this.build_aggregation_bar();
      animateSVG(this.$bar, "width", 0, this.width);
      if (this.invalid) {
        this.$bar.classList.add("bar-invalid");
      }
      if (this.task.dateIncomplete) {
        this.$bar.classList.add("bar-date-incomplete");
        this.draw_invalid_overlay();
      }
    }
    draw_expected_progress_bar() {
      if (this.invalid) return;
      this.$expected_bar_progress = createSVG("rect", {
        x: this.x,
        y: this.y,
        width: this.expected_progress_width,
        height: this.height,
        rx: this.corner_radius,
        ry: this.corner_radius,
        class: "bar-expected-progress",
        append_to: this.bar_group
      });
      animateSVG(
        this.$expected_bar_progress,
        "width",
        0,
        this.expected_progress_width
      );
    }
    draw_progress_bar() {
      if (this.invalid) return;
      this.progress_width = this.calculate_progress_width();
      let r = this.corner_radius;
      if (!/^((?!chrome|android).)*safari/i.test(navigator.userAgent))
        r = this.corner_radius + 2;
      this.$bar_progress = createSVG("rect", {
        x: this.x,
        y: this.y,
        width: this.progress_width,
        height: this.height,
        rx: r,
        ry: r,
        class: "bar-progress",
        append_to: this.bar_group
      });
      if (this.task.color_progress)
        this.$bar_progress.style.fill = this.task.color_progress;
      const x = this.gantt.get_position_by_date(this.task._start);
      let $date_highlight = this.gantt.create_el({
        classes: `date-range-highlight hide highlight-${this.task.id}`,
        width: this.width,
        left: x
      });
      this.$date_highlight = $date_highlight;
      this.gantt.$lower_header.prepend(this.$date_highlight);
      animateSVG(this.$bar_progress, "width", 0, this.progress_width);
    }
    calculate_progress_width() {
      const width = this.$bar.getWidth();
      const ignored_end = this.x + width;
      const total_ignored_area = this.gantt.config.ignored_positions.reduce((acc, val) => {
        return acc + (val >= this.x && val < ignored_end);
      }, 0) * this.gantt.config.column_width;
      let progress_width = (width - total_ignored_area) * this.task.progress / 100;
      const progress_end = this.x + progress_width;
      const total_ignored_progress = this.gantt.config.ignored_positions.reduce((acc, val) => {
        return acc + (val >= this.x && val < progress_end);
      }, 0) * this.gantt.config.column_width;
      progress_width += total_ignored_progress;
      let ignored_regions = this.gantt.get_ignored_region(
        this.x + progress_width
      );
      while (ignored_regions.length) {
        progress_width += this.gantt.config.column_width;
        ignored_regions = this.gantt.get_ignored_region(
          this.x + progress_width
        );
      }
      this.progress_width = progress_width;
      return progress_width;
    }
    draw_label() {
      let x_coord = this.x + this.$bar.getWidth() / 2;
      if (this.task.thumbnail) {
        x_coord = this.x + this.image_size + 5;
      }
      const $label = createSVG("text", {
        x: x_coord,
        y: this.y + this.height / 2,
        innerHTML: this.task.name,
        class: "bar-label",
        append_to: this.bar_group
      });
      if (this.task.textColor) {
        $label.style.fill = String(this.task.textColor);
      }
      requestAnimationFrame(() => this.update_label_position());
    }
    draw_thumbnail() {
      let x_offset = 10, y_offset = 2;
      let defs, clipPath;
      defs = createSVG("defs", {
        append_to: this.bar_group
      });
      createSVG("rect", {
        id: "rect_" + this.task.id,
        x: this.x + x_offset,
        y: this.y + y_offset,
        width: this.image_size,
        height: this.image_size,
        rx: "15",
        class: "img_mask",
        append_to: defs
      });
      clipPath = createSVG("clipPath", {
        id: "clip_" + this.task.id,
        append_to: defs
      });
      createSVG("use", {
        href: "#rect_" + this.task.id,
        append_to: clipPath
      });
      createSVG("image", {
        x: this.x + x_offset,
        y: this.y + y_offset,
        width: this.image_size,
        height: this.image_size,
        class: "bar-img",
        href: this.task.thumbnail,
        clipPath: "clip_" + this.task.id,
        append_to: this.bar_group
      });
    }
    draw_resize_handles() {
      if (this.invalid || this.gantt.options.readonly) return;
      const bar = this.$bar;
      const handle_width = 3;
      this.handles = [];
      if (!this.gantt.options.readonly_dates) {
        this.handles.push(
          createSVG("rect", {
            x: bar.getEndX() - handle_width / 2,
            y: bar.getY() + this.height / 4,
            width: handle_width,
            height: this.height / 2,
            rx: 2,
            ry: 2,
            class: "handle right",
            append_to: this.handle_group
          })
        );
        this.handles.push(
          createSVG("rect", {
            x: bar.getX() - handle_width / 2,
            y: bar.getY() + this.height / 4,
            width: handle_width,
            height: this.height / 2,
            rx: 2,
            ry: 2,
            class: "handle left",
            append_to: this.handle_group
          })
        );
      }
      if (!this.gantt.options.readonly_progress) {
        const bar_progress = this.$bar_progress;
        this.$handle_progress = createSVG("circle", {
          cx: bar_progress.getEndX(),
          cy: bar_progress.getY() + bar_progress.getHeight() / 2,
          r: 4.5,
          class: "handle progress",
          append_to: this.handle_group
        });
        this.handles.push(this.$handle_progress);
      }
      for (let handle of this.handles) {
        $.on(handle, "mouseenter", () => handle.classList.add("active"));
        $.on(handle, "mouseleave", () => handle.classList.remove("active"));
      }
    }
    bind() {
      this.setup_click_event();
    }
    setup_click_event() {
      let task_id = this.task.id;
      $.on(this.group, "mouseover", (e) => {
        this.gantt.trigger_event("hover", [
          this.task,
          e.screenX,
          e.screenY,
          e
        ]);
      });
      if (this.gantt.options.popup_on === "click" || this.gantt.options.popup_on === "hover") {
        $.on(this.group, "mouseup", (e) => {
          const posX = e.offsetX || e.layerX;
          if (this.$handle_progress) {
            const cx = +this.$handle_progress.getAttribute("cx");
            if (cx > posX - 1 && cx < posX + 1) return;
            if (this.gantt.bar_being_dragged) return;
          }
          this.gantt.lock_popup_on_click();
          this.gantt.show_popup({
            x: e.offsetX || e.layerX,
            y: e.offsetY || e.layerY,
            task: this.task,
            target: this.$bar
          });
        });
      }
      let timeout;
      $.on(this.group, "mouseenter", (e) => {
        timeout = setTimeout(() => {
          if (this.gantt.options.popup_on === "hover" && !this.gantt.is_popup_locked_by_click())
            this.gantt.show_popup({
              x: e.offsetX || e.layerX,
              y: e.offsetY || e.layerY,
              task: this.task,
              target: this.$bar
            });
          if (!this.invalid) {
            this.gantt.$container.querySelector(`.highlight-${CSS.escape(task_id)}`).classList.remove("hide");
          }
        }, 200);
      });
      $.on(this.group, "mouseleave", () => {
        clearTimeout(timeout);
        if (this.gantt.options.popup_on === "hover" && !this.gantt.is_popup_locked_by_click())
          this.gantt.popup?.hide?.();
        if (!this.invalid) {
          this.gantt.$container.querySelector(`.highlight-${CSS.escape(task_id)}`).classList.add("hide");
        }
      });
      $.on(this.group, "click", () => {
        this.gantt.trigger_event("click", [this.task]);
      });
      $.on(this.group, "dblclick", (e) => {
        if (this.action_completed) {
          return;
        }
        this.group.classList.remove("active");
        if (this.gantt.popup)
          this.gantt.popup.parent.classList.remove("hide");
        this.gantt.trigger_event("double_click", [this.task]);
      });
      let tapedTwice = false;
      $.on(this.group, "touchstart", (e) => {
        if (!tapedTwice) {
          tapedTwice = true;
          setTimeout(function() {
            tapedTwice = false;
          }, 300);
          return false;
        }
        e.preventDefault();
        if (this.action_completed) {
          return;
        }
        this.group.classList.remove("active");
        if (this.gantt.popup)
          this.gantt.popup.parent.classList.remove("hide");
        this.gantt.trigger_event("double_click", [this.task]);
      });
    }
    update_bar_position({ x = null, width = null }) {
      if (this.invalid) return;
      const bar = this.$bar;
      if (x) {
        const xs = this.task.dependencies.map((dep) => {
          return this.gantt.get_bar(dep).$bar.getX();
        });
        const valid_x = xs.reduce((prev, curr) => {
          return prev && x >= curr;
        }, true);
        if (!valid_x) return;
        this.update_attr(bar, "x", x);
        this.x = x;
        this.$date_highlight.style.left = x + "px";
      }
      if (width > 0) {
        this.update_attr(bar, "width", width);
        this.$date_highlight.style.width = width + "px";
      }
      this.update_label_position();
      this.update_handle_position();
      this.date_changed();
      this.compute_duration();
      if (this.gantt.options.show_expected_progress) {
        this.update_expected_progressbar_position();
      }
      this.update_progressbar_position();
      this.update_arrow_position();
      this.update_invalid_overlay_position(x, width);
    }
    // >>> SR: Initial auto moving labels ------------------------------------------
    /**
     * Aligns an inside-bar label with the current horizontal viewport center and
     * keeps it clamped inside the task bar, so long task titles are visible even
     * before the user has scrolled back and forth.
     */
    update_label_position_for_current_viewport(sx = this.gantt.$container.scrollLeft) {
      const container = this.gantt.$container;
      const label = this.group.querySelector(".bar-label");
      const img = this.group.querySelector(".bar-img") || "";
      const img_mask = this.bar_group.querySelector(".img_mask") || "";
      if (!container || !label || label.classList.contains("big")) return;
      const padding = 5;
      const trailingPadding = 7;
      const barStartX = this.$bar.getX();
      const barEndX = this.$bar.getEndX();
      const barWidth = this.$bar.getWidth();
      const labelWidth = label.getBBox().width;
      const imgWidth = img && img.getBBox().width + trailingPadding || 0;
      if (labelWidth > barWidth) return;
      const viewportStart = sx;
      const viewportEnd = sx + container.clientWidth;
      const currentLabelX = label.getX();
      const currentLabelEndX = currentLabelX + labelWidth + trailingPadding;
      const labelIsFullyVisible = currentLabelX >= viewportStart && currentLabelEndX <= viewportEnd;
      if (barWidth <= container.clientWidth && labelIsFullyVisible) return;
      const minLabelX = barStartX + (img ? imgWidth : padding);
      const maxLabelX = barEndX - labelWidth - trailingPadding;
      if (maxLabelX < minLabelX) return;
      const viewportCentral = sx + container.clientWidth / 2;
      const centeredLabelX = viewportCentral - labelWidth - trailingPadding;
      const nextLabelX = Math.min(
        Math.max(centeredLabelX, minLabelX),
        maxLabelX
      );
      if (Math.abs(currentLabelX - nextLabelX) < 0.1) return;
      label.setAttribute("x", nextLabelX);
      if (img) {
        const nextImgX = Math.max(barStartX + padding, nextLabelX - imgWidth);
        img.setAttribute("x", nextImgX);
        img_mask.setAttribute("x", nextImgX);
      }
    }
    // >>> SR: Continuous auto moving labels --------------------------------------
    /**
     * Moves inside-bar labels continuously with the horizontal scroll delta once
     * the viewport center reaches the label, preserving the original scrolling
     * behavior while initial rendering can still pre-align long task labels.
     */
    update_label_position_on_horizontal_scroll({ x, sx }) {
      const container = this.gantt.$container;
      const label = this.group.querySelector(".bar-label");
      const img = this.group.querySelector(".bar-img") || "";
      const img_mask = this.bar_group.querySelector(".img_mask") || "";
      if (!container || !label || label.classList.contains("big")) return;
      const padding = 5;
      const trailingPadding = 7;
      const barStartX = this.$bar.getX();
      const barEndX = this.$bar.getEndX();
      const labelWidth = label.getBBox().width;
      const imgWidth = img && img.getBBox().width + trailingPadding || trailingPadding;
      const minLabelX = barStartX + (img ? imgWidth : padding);
      const currentLabelX = label.getX();
      const currentImgX = img && img.getX() || 0;
      const viewportCentral = sx + container.clientWidth / 2;
      const scrollDelta = x;
      if (!scrollDelta) return;
      const nextLabelX = currentLabelX + scrollDelta;
      const nextImgX = currentImgX + scrollDelta;
      const nextLabelEndX = nextLabelX + labelWidth + trailingPadding;
      if (scrollDelta > 0 && nextLabelEndX <= viewportCentral && nextLabelEndX < barEndX) {
        label.setAttribute("x", nextLabelX);
        if (img) {
          img.setAttribute("x", nextImgX);
          img_mask.setAttribute("x", nextImgX);
        }
      } else if (scrollDelta < 0 && nextLabelEndX >= viewportCentral && nextLabelX >= minLabelX) {
        label.setAttribute("x", nextLabelX);
        if (img) {
          img.setAttribute("x", nextImgX);
          img_mask.setAttribute("x", nextImgX);
        }
      }
    }
    // <<< SR: Continuous auto moving labels --------------------------------------
    // <<< SR: Initial auto moving labels ------------------------------------------
    date_changed() {
      let changed = false;
      const { new_start_date, new_end_date } = this.compute_start_end_date();
      if (Number(this.task._start) !== Number(new_start_date)) {
        changed = true;
        this.task._start = new_start_date;
      }
      const current_end_date = this.task.orig_end ?? this.task._end;
      if (Number(current_end_date) !== Number(new_end_date)) {
        changed = true;
        this.task._end = new_end_date;
        this.task.orig_end = new_end_date;
      }
      if (!changed) return;
      this.sync_task_date_values(new_start_date, new_end_date);
      this.gantt.trigger_event("date_change", [
        this.task,
        new_start_date,
        date_utils.add(new_end_date, -1, "second")
      ]);
    }
    progress_changed() {
      this.task.progress = this.compute_progress();
      this.gantt.trigger_event("progress_change", [
        this.task,
        this.task.progress
      ]);
    }
    set_action_completed() {
      this.action_completed = true;
      setTimeout(() => this.action_completed = false, 1e3);
    }
    compute_start_end_date() {
      const bar = this.$bar;
      let new_start_date = this.gantt.get_date_by_position(bar.getX());
      const width_changed = bar.owidth != null && Math.abs(bar.getWidth() - bar.owidth) > 1e-3;
      let new_end_date;
      if (!width_changed) {
        const current_end_date = this.task.orig_end ?? this.task._end;
        const duration = current_end_date - this.task._start;
        new_end_date = new Date(new_start_date.getTime() + duration);
      } else {
        new_end_date = this.gantt.get_date_by_position(bar.getEndX());
      }
      return { new_start_date, new_end_date };
    }
    compute_progress() {
      if (this.invalid) return;
      this.progress_width = this.$bar_progress.getWidth();
      this.x = this.$bar_progress.getBBox().x;
      const progress_area = this.x + this.progress_width;
      const progress = this.progress_width - this.gantt.config.ignored_positions.reduce((acc, val) => {
        return acc + (val >= this.x && val <= progress_area);
      }, 0) * this.gantt.config.column_width;
      if (progress < 0) return 0;
      const total = this.$bar.getWidth() - this.ignored_duration_raw * this.gantt.config.column_width;
      return parseInt(progress / total * 100, 10);
    }
    compute_expected_progress() {
      this.expected_progress = date_utils.diff(date_utils.today(), this.task._start, "hour") / this.gantt.config.step;
      this.expected_progress = (this.expected_progress < this.duration ? this.expected_progress : this.duration) * 100 / this.duration;
    }
    compute_x() {
      this.x = this.gantt.get_position_by_date(this.task._start);
    }
    compute_y() {
      const rowIndex = this.task._rowIndex != null ? this.task._rowIndex : this.task._index;
      const lane = this.task._lane != null ? this.task._lane : 0;
      const baseY = this.gantt.config.header_height + //TODO SR: The padding already malfunctioned in the old adapted version and needs to be reworked.
      //this.gantt.options.padding + //TODO SR: Put the padding back as soon as the problem has been fixed!
      this.rowTop(rowIndex);
      const innerTop = (this.gantt.options.bar_inner_padding || 0) / 2;
      let y = baseY + innerTop + lane * (this.height + this.gantt.options.lane_padding);
      this.y = y;
    }
    compute_duration() {
      let actual_duration_in_days = 0, duration_in_days = 0;
      let endDate = this.task.orig_end ?? this.task._end;
      for (
        let d = new Date(this.task._start);
        // >>> SR: Bar Aggregation -----------------------------------------
        //d < this.task._end;
        d < endDate;
        // <<< SR: Bar Aggregation -----------------------------------------
        d.setDate(d.getDate() + 1)
      ) {
        duration_in_days++;
        if (!this.gantt.config.ignored_dates.find(
          (k) => k.getTime() === d.getTime()
        ) && (!this.gantt.config.ignored_function || !this.gantt.config.ignored_function(d))) {
          actual_duration_in_days++;
        }
      }
      this.task.actual_duration = actual_duration_in_days;
      this.task.ignored_duration = duration_in_days - actual_duration_in_days;
      this.duration = date_utils.convert_scales(
        duration_in_days + "d",
        this.gantt.config.unit
      ) / this.gantt.config.step;
      this.actual_duration_raw = date_utils.convert_scales(
        actual_duration_in_days + "d",
        this.gantt.config.unit
      ) / this.gantt.config.step;
      this.ignored_duration_raw = this.duration - this.actual_duration_raw;
    }
    update_attr(element, attr, value) {
      value = +value;
      if (!isNaN(value)) {
        element.setAttribute(attr, value);
      }
      return element;
    }
    update_expected_progressbar_position() {
      if (this.invalid) return;
      this.$expected_bar_progress.setAttribute("x", this.$bar.getX());
      this.compute_expected_progress();
      this.$expected_bar_progress.setAttribute(
        "width",
        this.gantt.config.column_width * this.actual_duration_raw * (this.expected_progress / 100) || 0
      );
    }
    update_progressbar_position() {
      if (this.invalid || this.gantt.options.readonly) return;
      this.$bar_progress.setAttribute("x", this.$bar.getX());
      this.$bar_progress.setAttribute(
        "width",
        this.calculate_progress_width()
      );
    }
    update_label_position() {
      const img_mask = this.bar_group.querySelector(".img_mask") || "";
      const bar = this.$bar, label = this.group.querySelector(".bar-label"), img = this.group.querySelector(".bar-img");
      let padding = 5;
      let x_offset_label_img = this.image_size + 10;
      const labelWidth = label.getBBox().width;
      const barWidth = bar.getWidth();
      const overflow = this.gantt.options.label_overflow || "outside";
      const isStacked = (this.task._clusterLanes || 1) > 1;
      const isLowHeight = this.height <= 14;
      label.classList.remove("big");
      label.classList.remove("clip-left");
      label.classList.remove("small");
      if (isStacked || isLowHeight) {
        label.classList.add("small");
      }
      const labelMidStartX = bar.getX() + barWidth / 2 - labelWidth / 2;
      const imgEndX = bar.getX() + x_offset_label_img;
      const imgLabelCollision = img && imgEndX >= labelMidStartX;
      if (!imgLabelCollision && labelWidth <= barWidth) {
        label.classList.remove("big");
        if (img) {
          img.setAttribute("x", bar.getX() + padding);
          img_mask.setAttribute("x", bar.getX() + padding);
        }
        label.setAttribute(
          //TODO SR: New temp fix for image + label collision
          "x",
          labelMidStartX
        );
        label.removeAttribute("clip-path");
        label.style.fill = this.task.textColor;
        if (this.gantt.options.auto_move_label) {
          this.update_label_position_for_current_viewport();
        }
        return;
      }
      if (overflow === "outside") {
        label.classList.add("big");
        if (img) {
          img.setAttribute("x", bar.getEndX() + padding);
          img_mask.setAttribute("x", bar.getEndX() + padding);
          label.setAttribute("x", bar.getEndX() + x_offset_label_img);
        } else {
          label.setAttribute("x", bar.getEndX() + padding);
        }
        label.removeAttribute("clip-path");
        label.style.fill = String(this.gantt.options.label_outside_color);
      } else if (overflow === "clip") {
        label.classList.remove("big");
        const insetX = 2;
        const insetY = 1;
        if (img) {
          img.setAttribute("x", bar.getX() + padding);
          img_mask.setAttribute("x", bar.getX() + padding);
        }
        label.classList.add("clip-left");
        label.setAttribute("x", bar.getX() + insetX + (img ? x_offset_label_img : 0));
        label.setAttribute("y", bar.getY() + bar.getHeight() / 2);
        const clipId = `clip-label-${String(this.task.id).replace(/[^a-zA-Z0-9_-]/g, "")}`;
        let defs = this.gantt.$svg.querySelector("defs");
        if (!defs) defs = createSVG("defs", { append_to: this.gantt.$svg });
        const old = this.gantt.$svg.querySelector(`#${clipId}`);
        if (old) old.remove();
        const cp = createSVG("clipPath", { id: clipId, append_to: defs });
        createSVG("rect", {
          x: bar.getX() + insetX + (img ? x_offset_label_img : 0),
          y: bar.getY() + insetY,
          width: Math.max(0, bar.getWidth() - (img ? x_offset_label_img : 0) - insetX * 2),
          height: Math.max(0, bar.getHeight() - insetY * 2),
          rx: Math.max(0, this.corner_radius - insetX),
          ry: Math.max(0, this.corner_radius - insetY),
          append_to: cp
        });
        label.setAttribute("clip-path", `url(#${clipId})`);
      }
    }
    update_handle_position() {
      if (this.invalid || this.gantt.options.readonly) return;
      const bar = this.$bar;
      this.handle_group.querySelector(".handle.left").setAttribute("x", bar.getX());
      this.handle_group.querySelector(".handle.right").setAttribute("x", bar.getEndX());
      const handle = this.group.querySelector(".handle.progress");
      handle && handle.setAttribute("cx", this.$bar_progress.getEndX());
    }
    update_arrow_position() {
      this.arrows = this.arrows || [];
      for (let arrow of this.arrows) {
        arrow.update();
      }
    }
    // >>> SR: Bar Aggregation -------------------------------------------------
    // >>> SR: Date calculation after change fix ---------------------------------
    sync_task_date_values(new_start_date, new_end_date) {
      if (this.task.start) {
        this.task.start = this.format_task_date_like_original(
          new_start_date,
          this.task.start
        );
      }
      if (this.task.end) {
        this.task.end = this.format_task_date_like_original(
          date_utils.add(new_end_date, -1, "second"),
          this.task.end
        );
      }
    }
    format_task_date_like_original(date, original_value) {
      if (original_value instanceof Date) {
        return date_utils.clone(date);
      }
      if (typeof original_value === "string") {
        const has_time = original_value.trim().includes(" ");
        return date_utils.format(
          date,
          has_time ? this.gantt.options.date_format : "YYYY-MM-dd",
          this.gantt.options.language
        );
      }
      return date;
    }
    // <<< SR: Date calculation after change fix ---------------------------------
    // >>> SR: Date calculation Fix --------------------------------------------
    compute_width() {
      const endDate = this.task.orig_end ?? this.task._end;
      return Math.max(0, this.gantt.get_position_by_date(endDate) - this.x);
    }
    // <<< SR: Date calculation Fix --------------------------------------------
    /**
     * Aggregation bar buildup
     *
     * here, the Aggregation look is made.
     * It contains all the bars that overlaps more than 2 times with another bars.
     */
    build_aggregation_bar() {
      let defs = this.gantt.$svg.querySelector("defs");
      if (!defs) defs = createSVG("defs", { append_to: this.gantt.$svg });
      const inset = 1.5;
      const clipId = `clip-legend-${String(this.task.id).replace(/[^a-zA-Z0-9_-]/g, "")}`;
      const oldClip = this.gantt.$svg.querySelector(`#${clipId}`);
      if (oldClip) oldClip.remove();
      const $cp = createSVG("clipPath", { id: clipId, append_to: defs });
      createSVG("rect", {
        x: this.x + inset,
        y: this.y + inset,
        width: Math.max(0, this.width - inset * 2),
        height: Math.max(0, this.height - inset * 2),
        rx: Math.max(0, this.corner_radius - inset),
        ry: Math.max(0, this.corner_radius - inset),
        append_to: $cp
      });
      if (this.task._isAggregate && Array.isArray(this.task._members)) {
        const colorSwatches = this.task._members.map((m) => m && m.color).filter(Boolean);
        if (colorSwatches.length) {
          const swatchW = 8;
          const gapX = 1;
          const h = Math.max(0, this.height - inset * 2);
          let xSwatch = this.x + inset;
          const swatchesGroup = createSVG("g", {
            append_to: this.bar_group
          });
          swatchesGroup.setAttribute("clip-path", `url(#${clipId})`);
          colorSwatches.forEach((c) => {
            const r = createSVG("rect", {
              x: xSwatch,
              y: this.y + inset,
              width: swatchW,
              height: h,
              class: "agg-swatch-v",
              append_to: swatchesGroup
            });
            r.setAttribute("fill", c);
            r.setAttribute("pointer-events", "none");
            xSwatch += swatchW + gapX;
            if (xSwatch > this.x + this.width - inset) return;
          });
        }
      }
    }
    /**
     * It sets the bar colors from task properties.
     */
    set_bar_colors() {
      if (this.task.color) {
        this.$bar.style.setProperty("--bar-fill", String(this.task.color));
      }
      if (this.task.colorHover) {
        this.$bar.style.setProperty("--bar-fill-hover", String(this.task.colorHover));
      }
    }
    /**
     * Calculates the bar height for a task, considering cluster lanes and paddings.
     * @param task
     * @returns {number}
     */
    get_bar_height_for_task(task) {
      const lanes = Math.max(1, task._clusterLanes || 1);
      const inner = Math.max(0, this.gantt.options.bar_inner_padding || 0);
      const laneGaps = (lanes - 1) * this.gantt.options.lane_padding;
      const available = this.gantt.options.row_height - inner - laneGaps;
      const h = available / lanes;
      return Math.max(6, h);
    }
    rowTop(rowIndex) {
      return this.gantt._rowMeta[rowIndex]?.top || 0;
    }
    /**
     * Defines an SVG pattern for hatching, which is used to indicate invalid bars.
     * The pattern consists of diagonal lines and is added to the SVG defs. It is only defined once, even if multiple bars use it.
     * The pattern can then be applied as a fill to an overlay rectangle on top of the bar to visually indicate invalidity.
     */
    define_svg_hatch_pattern() {
      const svg = this.gantt.$svg;
      if (!svg) return;
      let defs = svg.querySelector("defs");
      if (!defs) defs = createSVG("defs", { append_to: svg });
      if (svg.querySelector("#hatchPattern")) return;
      const pattern = createSVG("pattern", {
        id: "hatchPattern",
        patternUnits: "userSpaceOnUse",
        width: 12,
        height: 12,
        append_to: defs
      });
      pattern.setAttribute("patternTransform", "rotate(45 4 4)");
      const line = createSVG("line", {
        x1: 0,
        y1: 0,
        x2: 0,
        y2: 12,
        append_to: pattern
      });
      line.setAttribute("stroke", "#8D99A6");
      line.setAttribute("stroke-width", "3");
      line.setAttribute("opacity", "0.75");
    }
    /**
     * draws a diagonal hatch overlay on top of the bar to indicate that it is invalid. 
     * It uses the defined "hatchPattern" SVG pattern as a fill for a rectangle that covers the entire bar area. 
     * The overlay is non-interactive, allowing clicks and drags to pass through to the bar below.
     */
    draw_invalid_overlay() {
      this.define_svg_hatch_pattern();
      if (this.$bar_invalid_overlay) {
        this.$bar_invalid_overlay.remove();
        this.$bar_invalid_overlay = null;
      }
      this.$bar_invalid_overlay = createSVG("rect", {
        x: this.x,
        y: this.y,
        width: this.width,
        height: this.height,
        rx: this.corner_radius,
        ry: this.corner_radius,
        class: "bar-invalid-overlay",
        append_to: this.bar_group
      });
      this.$bar_invalid_overlay.setAttribute("fill", "url(#hatchPattern)");
      this.$bar_invalid_overlay.setAttribute("pointer-events", "none");
    }
    /**
     * updates the position and size of the invalid overlay to match the bar's current position and size.
     * 
     * @param x
     * @param width
     */
    update_invalid_overlay_position(x, width) {
      if (!this.$bar_invalid_overlay) return;
      if (x) this.update_attr(this.$bar_invalid_overlay, "x", x);
      if (width > 0) this.update_attr(this.$bar_invalid_overlay, "width", width);
    }
    // <<< SR: Bar Aggregation -------------------------------------------------
  }
  class Popup {
    constructor(parent, popup_func, gantt) {
      this.parent = parent;
      this.popup_func = popup_func;
      this.gantt = gantt;
      this.make();
    }
    make() {
      this.parent.innerHTML = `
            <div class="title"></div>
            <div class="subtitle"></div>
            <div class="details"></div>
            <div class="actions"></div>
        `;
      this.hide();
      this.title = this.parent.querySelector(".title");
      this.subtitle = this.parent.querySelector(".subtitle");
      this.details = this.parent.querySelector(".details");
      this.actions = this.parent.querySelector(".actions");
    }
    show({ x, y, task, target }) {
      this.parent.style.pointerEvents = this.gantt.options.popup_on === "hover" && !this.gantt.is_popup_locked_by_click() ? "none" : "";
      this.actions.innerHTML = "";
      let html = this.popup_func({
        task,
        chart: this.gantt,
        get_title: () => this.title,
        set_title: (title) => this.title.innerHTML = title,
        get_subtitle: () => this.subtitle,
        set_subtitle: (subtitle) => this.subtitle.innerHTML = subtitle,
        get_details: () => this.details,
        set_details: (details) => this.details.innerHTML = details,
        add_action: (html2, func) => {
          let action = this.gantt.create_el({
            classes: "action-btn",
            type: "button",
            append_to: this.actions
          });
          if (typeof html2 === "function") html2 = html2(task);
          action.innerHTML = html2;
          action.onclick = (e) => func(task, this.gantt, e);
        }
      });
      if (html === false) return;
      if (html) this.parent.innerHTML = html;
      if (this.actions.innerHTML === "") this.actions.remove();
      else this.parent.appendChild(this.actions);
      this.clear_aggregation_list();
      const members = task._isAggregate ? task._members || [] : task._aggMembers || [];
      if (members?.length) {
        this.parent.querySelector(".details").innerHTML = "";
        let appendTarget = this.parent;
        let popupGanttTarget = null;
        let popupGanttListContent = null;
        const append = (element) => appendTarget.appendChild(element);
        let upperRowTasks;
        if (this.gantt.options.popup_aggregate_include_upper_row_tasks === true && task._isAggregate) {
          upperRowTasks = this.get_overlapping_upper_row_tasks(task);
        }
        const aggregationTasks = upperRowTasks?.length ? upperRowTasks.concat(members) : members;
        if (this.gantt.options.popup_aggregate_expand_tasks === true) {
          const layout = this.build_aggregation_popup_layout();
          this.move_popup_content_to_aggregation_layout(layout.listHeader);
          appendTarget = layout.listContent;
          popupGanttTarget = layout.ganttPane;
          popupGanttListContent = layout.listContent;
          this.parent.appendChild(layout.wrapper);
        }
        if (upperRowTasks?.length) {
          if (this.gantt.options.popup_aggregate_style === "table") {
            append(this.build_aggregation_table(
              upperRowTasks.concat(members),
              upperRowTasks.length
            ));
          } else {
            append(this.build_aggregation_part(upperRowTasks));
            append(this.build_aggregation_part(members));
          }
        } else {
          append(this.build_aggregation_part(members));
        }
        if (popupGanttTarget) {
          this.render_aggregation_popup_gantt(
            popupGanttTarget,
            aggregationTasks
          );
          this.align_aggregation_popup_rows(popupGanttListContent);
        }
      }
      this.position_inside_visible_container(x, y);
      this.parent.classList.remove("hide");
    }
    // <<< SR: Popup outside container fix -------------------------------------
    position_inside_visible_container(x, y) {
      const container = this.gantt.$container;
      const margin = 8;
      this.parent.style.visibility = "hidden";
      this.parent.style.left = "0px";
      this.parent.style.top = "0px";
      this.parent.style.maxWidth = Math.max(160, container.clientWidth - margin * 2) + "px";
      this.parent.classList.remove("hide");
      const popupWidth = this.parent.offsetWidth;
      const popupHeight = this.parent.offsetHeight;
      const minLeft = container.scrollLeft + margin;
      const maxLeft = container.scrollLeft + container.clientWidth - popupWidth - margin;
      const minTop = container.scrollTop + margin;
      const maxTop = container.scrollTop + container.clientHeight - popupHeight - margin;
      const desiredLeft = x + 10;
      const desiredTop = y - 10;
      this.parent.style.left = Math.max(minLeft, Math.min(desiredLeft, Math.max(minLeft, maxLeft))) + "px";
      this.parent.style.top = Math.max(minTop, Math.min(desiredTop, Math.max(minTop, maxTop))) + "px";
      this.parent.style.visibility = "";
    }
    // >>> SR: Popup outside container fix ---------------------------------------------
    hide() {
      this.destroy_popup_gantt?.();
      this.parent.classList.add("hide");
    }
    build_aggregation_part(members, sectionStartIndex = null) {
      switch (this.gantt.options.popup_aggregate_style) {
        case "list":
          return this.build_aggregation_list(members);
        case "table":
          return this.build_aggregation_table(members, sectionStartIndex);
        default:
          console.warn(`Unknown aggregation style: ${this.gantt.options.popup_aggregate_style}. Falling back to 'list'.`);
          return this.build_aggregation_list(members);
      }
    }
    // >>> SR: Aggregation popup Gantt ----------------------------------------
    /**
     * Builds the two-column popup body used when the aggregation popup also
     * shows a small Gantt next to the task list.
     * @returns {{wrapper: HTMLDivElement, listPane: HTMLDivElement, listHeader: HTMLDivElement, listContent: HTMLDivElement, ganttPane: HTMLDivElement}}
     */
    build_aggregation_popup_layout() {
      const wrapper = document.createElement("div");
      wrapper.className = "agg-popup-expanded";
      wrapper.style.display = "inline-flex";
      wrapper.style.flexDirection = "row";
      wrapper.style.flexWrap = "nowrap";
      wrapper.style.alignItems = "flex-start";
      const listPane = document.createElement("div");
      listPane.className = "agg-popup-list-pane";
      listPane.style.flex = "0 0 auto";
      wrapper.appendChild(listPane);
      const listHeader = document.createElement("div");
      listHeader.className = "agg-popup-list-header";
      listPane.appendChild(listHeader);
      const listContent = document.createElement("div");
      listContent.className = "agg-popup-list-content";
      listPane.appendChild(listContent);
      const ganttPane = document.createElement("div");
      ganttPane.className = "agg-popup-gantt-pane";
      const width = this.get_popup_gantt_width();
      ganttPane.style.width = `${width}px`;
      ganttPane.style.flexBasis = `${width}px`;
      ganttPane.style.flexGrow = "0";
      ganttPane.style.flexShrink = "0";
      wrapper.appendChild(ganttPane);
      return { wrapper, listPane, listHeader, listContent, ganttPane };
    }
    /**
     * Moves the standard popup title/subtitle/details/actions into the left
     * pane of the expanded aggregation popup. This lets the popup Gantt on the
     * right start at the very top instead of below the popup title.
     * @param listHeader
     */
    move_popup_content_to_aggregation_layout(listHeader) {
      [this.title, this.subtitle, this.details, this.actions].forEach((node) => {
        if (node?.parentElement) {
          listHeader.appendChild(node);
        }
      });
    }
    /**
     * Creates the small Gantt instance displayed inside the aggregation popup.
     * Every popup task gets its own lineIndex so the right-side Gantt mirrors
     * the left-side task list one entry per row.
     * @param target
     * @param tasks
     */
    render_aggregation_popup_gantt(target, tasks) {
      if (!target || !tasks?.length) return;
      this.destroy_popup_gantt();
      const popupTasks = tasks.map((task, index) => this.create_popup_gantt_task(task, index)).filter(Boolean);
      if (!popupTasks.length) return;
      const PopupGantt = this.gantt.constructor;
      this.popup_gantt = new PopupGantt(
        target,
        popupTasks,
        this.get_popup_gantt_options(popupTasks)
      );
      if (this.gantt.config?.view_mode?.name) {
        this.popup_gantt.change_view_mode(this.gantt.config.view_mode.name);
      }
    }
    /**
     * Returns a copied task object that is safe to pass to a nested Gantt.
     * @param task
     * @param index
     * @returns {object|null}
     */
    create_popup_gantt_task(task, index) {
      const originalTask = this.gantt.get_task ? this.gantt.get_task(task.id) : null;
      const taskEnd = this.get_task_end(task);
      if (!task?._start || !taskEnd) return null;
      const start = originalTask?.start || this.format_popup_gantt_date(task._start);
      const end = originalTask?.end || this.format_popup_gantt_date(
        date_utils.add(taskEnd, -1, "second")
      );
      if (!start || !end) return null;
      return {
        id: `popup_${index}_${task.id}`,
        name: task.name,
        start,
        end,
        progress: originalTask?.progress ?? task.progress ?? 0,
        dependencies: [],
        lineIndex: index,
        readonly: true,
        color: originalTask?.color ?? task.color,
        colorHover: originalTask?.colorHover ?? task.colorHover,
        progressColor: originalTask?.progressColor ?? task.progressColor,
        textColor: originalTask?.textColor ?? task.textColor,
        custom_class: originalTask?.custom_class ?? task.custom_class
      };
    }
    /**
     * Formats Date objects for popup Gantt input without losing time-of-day.
     * @param date
     * @returns {string|null}
     */
    format_popup_gantt_date(date) {
      if (!date) return null;
      return date_utils.to_string(date, true);
    }
    /**
     * Creates safe options for the nested popup Gantt and prevents recursive
     * aggregation popups inside that nested chart.
     * @param popupTasks
     * @returns {object}
     */
    get_popup_gantt_options(popupTasks) {
      return {
        ...this.gantt.options,
        view_modes: this.gantt.options.view_modes,
        view_mode: this.gantt.config?.view_mode?.name || this.gantt.options.view_mode,
        row_keys: popupTasks.map((_, index) => index),
        row_height: 30,
        upper_header_height: 30,
        lower_header_height: 25,
        container_height: "auto",
        infinite_padding: false,
        scroll_to: "start",
        view_mode_select: this.gantt.options.view_mode_select,
        today_button: this.gantt.options.today_button,
        readonly: true,
        readonly_dates: true,
        readonly_progress: true,
        move_dependencies: false,
        popup: false,
        stripe_rows: true,
        holidays: null,
        //popup_on: 'click', //TODO SR: currently dont work.
        popup_aggregate_expand_tasks: false,
        popup_aggregate_include_upper_row_tasks: false
      };
    }
    /**
     * Aligns the first left list/table row with the first task row of the
     * nested popup Gantt and applies the popup Gantt row height to list rows.
     * @param listContent
     */
    align_aggregation_popup_rows(listContent) {
      if (!listContent || !this.popup_gantt) return;
      const listHeader = listContent.parentElement?.querySelector(
        ".agg-popup-list-header"
      );
      const popupHeaderHeight = this.popup_gantt.config?.header_height || 0;
      const leftHeaderHeight = listHeader?.offsetHeight || 0;
      const rowHeight = this.popup_gantt.options?.row_height || 0;
      listContent.style.marginTop = `${Math.max(
        0,
        popupHeaderHeight - leftHeaderHeight - 15
      )}px`;
      if (!rowHeight) return;
      listContent.querySelectorAll(".agg-table .agg-list-row, .agg-list li").forEach((row) => {
        row.style.height = `${rowHeight}px`;
        row.style.minHeight = `${rowHeight}px`;
      });
    }
    /**
     * Returns the configured popup Gantt width in px.
     * @returns {number}
     */
    get_popup_gantt_width() {
      return Math.max(
        120,
        Number(this.gantt.options.popup_aggregate_gantt_width) || 360
      );
    }
    /**
     * Destroys the previous nested popup Gantt before a new popup body is built.
     */
    destroy_popup_gantt() {
      if (this.popup_gantt?.destroy) {
        this.popup_gantt.destroy();
      }
      this.popup_gantt = null;
    }
    // <<< SR: Aggregation popup Gantt ----------------------------------------
    // >>> SR: Bar Aggregation ---------------------------------------------------
    /**
     * Builds the aggregation table for given aggregation members.
     * 
     * @param members
     * @param sectionStartIndex index where the member section starts after upper-row tasks
     * @returns {HTMLTableElement}
     */
    build_aggregation_table(members, sectionStartIndex = null) {
      const table = document.createElement("table");
      table.className = "agg-table";
      const tbody = document.createElement("tbody");
      table.appendChild(tbody);
      members.forEach((m, index) => {
        const tr = document.createElement("tr");
        tr.className = "agg-list-row";
        if (sectionStartIndex != null && index === sectionStartIndex) {
          tr.classList.add("agg-section-start");
        }
        const colorCell = document.createElement("td");
        colorCell.className = "agg-color-cell";
        const swatch = document.createElement("span");
        swatch.className = "agg-color-swatch";
        if (m.color) {
          swatch.style.backgroundColor = String(m.color);
        }
        colorCell.appendChild(swatch);
        tr.appendChild(colorCell);
        const originalTask = this.gantt.get_task ? this.gantt.get_task(m.id) : null;
        const hasRealStart = !!(originalTask && originalTask.start);
        const hasRealEnd = !!(originalTask && originalTask.end);
        let ogTask = this.gantt.get_task ? this.gantt.get_task(m.id) : null;
        this.compute_duration(ogTask);
        let labelText = m.name;
        let durationText = "";
        const start_date = date_utils.format(
          m._start,
          "dd.MM.yy",
          this.gantt.options.language
        );
        let org_end = m.orig_end ?? m._end;
        const end_date = date_utils.format(
          //date_utils.add(m._end, -1, 'second'),
          date_utils.add(org_end, -1, "second"),
          //TODO SR: Date without hours fix. Test it.
          "dd.MM.yy",
          this.gantt.options.language
        );
        let startText = hasRealStart ? start_date : "...";
        let endText = hasRealEnd ? end_date : "...";
        if (hasRealStart || hasRealEnd) {
          if (hasRealStart && hasRealEnd) {
            durationText = `${ogTask.actual_duration} Days${ogTask.ignored_duration ? " + " + ogTask.ignored_duration + " Excluded" : ""}`;
          }
        }
        const startCell = document.createElement("td");
        startCell.className = "agg-start-date";
        startCell.textContent = startText;
        tr.appendChild(startCell);
        const separatorCell = document.createElement("td");
        separatorCell.className = "agg-interval-separator";
        separatorCell.textContent = "-";
        tr.appendChild(separatorCell);
        const endCell = document.createElement("td");
        endCell.className = "agg-end-date";
        endCell.textContent = endText;
        tr.appendChild(endCell);
        const titleCell = document.createElement("td");
        titleCell.className = "agg-title";
        titleCell.textContent = labelText;
        tr.appendChild(titleCell);
        const durationCell = document.createElement("td");
        durationCell.className = "agg-duration";
        durationCell.textContent = durationText;
        tr.appendChild(durationCell);
        tbody.appendChild(tr);
      });
      return table;
    }
    /**
     * This is the list overlapping popup version
     * This one may be removed in the future.
     * 
     * @param members
     * @returns {HTMLUListElement}
     */
    build_aggregation_list(members) {
      const ul = document.createElement("ul");
      ul.className = "agg-list";
      members.forEach((m) => {
        const li = document.createElement("li");
        const swatch = document.createElement("span");
        swatch.className = "agg-color-swatch";
        if (m.color) {
          swatch.style.backgroundColor = String(m.color);
        }
        li.appendChild(swatch);
        const originalTask = this.gantt.get_task ? this.gantt.get_task(m.id) : null;
        const hasRealStart = !!(originalTask && originalTask.start);
        const hasRealEnd = !!(originalTask && originalTask.end);
        let ogTask = this.gantt.get_task ? this.gantt.get_task(m.id) : null;
        this.compute_duration(ogTask);
        let labelText = m.name;
        let rangeText = "";
        const start_date = date_utils.format(
          m._start,
          "dd.MM.yy",
          this.gantt.options.language
        );
        let org_end = m.orig_end ?? m._end;
        const end_date = date_utils.format(
          //date_utils.add(m._end, -1, 'second'),
          date_utils.add(org_end, -1, "second"),
          //TODO SR: Date without hours fix. Test it.
          "dd.MM.yy",
          this.gantt.options.language
        );
        if (hasRealStart || hasRealEnd) {
          if (hasRealStart && hasRealEnd) {
            rangeText = ` (${start_date} - ${end_date}) (${ogTask.actual_duration} Days${ogTask.ignored_duration ? " + " + ogTask.ignored_duration + " Excluded" : ""})`;
          } else if (hasRealStart && !hasRealEnd) {
            rangeText = ` (${start_date} - ... )`;
          } else if (hasRealEnd && !hasRealStart) {
            rangeText = ` (... - ${end_date})`;
          }
        }
        const textSpan = document.createElement("span");
        textSpan.textContent = labelText + rangeText;
        li.appendChild(textSpan);
        ul.appendChild(li);
      });
      return ul;
    }
    /**
     * Removes existing old aggregation list.
     */
    clear_aggregation_list() {
      this.destroy_popup_gantt();
      this.restore_popup_content_from_aggregation_layout();
      this.parent.querySelectorAll(".agg-popup-expanded, .agg-list, .agg-table").forEach((list) => list.remove());
    }
    /**
     * Moves title/subtitle/details/actions back to the popup root before an old
     * expanded aggregation layout is removed. This keeps normal popups working
     * after an expanded popup was shown once.
     */
    restore_popup_content_from_aggregation_layout() {
      [this.title, this.subtitle, this.details, this.actions].forEach((node) => {
        if (node?.closest?.(".agg-popup-expanded")) {
          this.parent.appendChild(node);
        }
      });
    }
    // >>> SR: upperRowTasks ---------------------------------------------------
    /**
     * Returns the tasks from the same row that are overlapping with the aggregate task and are not members of the aggregate task. 
     * This is needed to show all relevant tasks in the popup of an aggregate task,
     * even those that are not part of the aggregation but are visually overlapping with it in the same row.
     * @param aggregateTask
     * @returns {T[]|*[]}
     */
    get_overlapping_upper_row_tasks(aggregateTask) {
      const aggregateStart = aggregateTask?._start;
      const aggregateEnd = this.get_task_end(aggregateTask);
      const aggregationLane = this.gantt.get_aggregation_lane_index ? this.gantt.get_aggregation_lane_index() : 1;
      if (!aggregateStart || !aggregateEnd) return [];
      const memberIds = new Set(
        (aggregateTask._members || []).map((member) => String(member.id))
      );
      return (this.gantt.tasks || []).filter((task) => task && !task._hidden && !task._isAggregate).filter((task) => task._rowIndex === aggregateTask._rowIndex).filter((task) => (task._lane ?? 0) < aggregationLane).filter((task) => !memberIds.has(String(task.id))).filter((task) => this.tasks_overlap(task, aggregateTask)).sort((a, b) => {
        if (+a._start !== +b._start) return +a._start - +b._start;
        const aId = Number.isFinite(+a.id) ? +a.id : String(a.id);
        const bId = Number.isFinite(+b.id) ? +b.id : String(b.id);
        return aId > bId ? 1 : aId < bId ? -1 : 0;
      });
    }
    /**
     * Checks if two tasks overlap in time. Used to find upper row tasks that are overlapping with the aggregate task.
     * 
     * @param a
     * @param b
     * @returns {boolean}
     */
    tasks_overlap(a, b) {
      const aEnd = this.get_task_end(a);
      const bEnd = this.get_task_end(b);
      if (!a?._start || !b?._start || !aEnd || !bEnd) return false;
      return a._start < bEnd && b._start < aEnd;
    }
    get_task_end(task) {
      return task?.orig_end ?? task?._end ?? null;
    }
    // <<< SR: upperRowTasks ---------------------------------------------------
    compute_duration(task) {
      if (task == null) return;
      task.orig_end = task.orig_end ?? date_utils.clone(task._end);
      let actual_duration_in_days = 0, duration_in_days = 0;
      for (
        let d = new Date(task._start);
        //d < task._end;
        d < task.orig_end;
        //TODO SR: Date without hours fix. Test it.
        d.setDate(d.getDate() + 1)
      ) {
        duration_in_days++;
        if (!this.gantt.config.ignored_dates.find(
          (k) => k.getTime() === d.getTime()
        ) && (!this.gantt.config.ignored_function || !this.gantt.config.ignored_function(d))) {
          actual_duration_in_days++;
        }
      }
      task.actual_duration = actual_duration_in_days;
      task.ignored_duration = duration_in_days - actual_duration_in_days;
    }
    // <<< SR: Bar Aggregation
  }
  function getDecade(d) {
    const year = d.getFullYear();
    return String(year - year % 10);
  }
  function formatWeek(d, ld, lang2) {
    let endOfWeek = date_utils.add(d, 6, "day");
    let endFormat = endOfWeek.getMonth() !== d.getMonth() ? "dd MMM" : "dd";
    let beginFormat = !ld || d.getMonth() !== ld.getMonth() ? "dd MMM" : "dd";
    return `${date_utils.format(d, beginFormat, lang2)} - ${date_utils.format(endOfWeek, endFormat, lang2)}`;
  }
  function isHeaderBorder(d, ld, interval) {
    if (!ld) return true;
    switch (String(interval || "").toLowerCase()) {
      case "date":
      case "day":
        return d.getDate() !== ld.getDate();
      case "month":
        return d.getMonth() !== ld.getMonth();
      case "year":
        return d.getFullYear() !== ld.getFullYear();
      case "decade":
        return getDecade(d) !== getDecade(ld);
      default:
        return true;
    }
  }
  function getQuarterStartInInterval(d, step, unit) {
    const intervalStart = date_utils.start_of(d, "day");
    const intervalEnd = date_utils.add(intervalStart, step, unit);
    const year = intervalStart.getFullYear();
    for (const month of [0, 3, 6, 9]) {
      const quarterStart = new Date(year, month, 1);
      if (quarterStart >= intervalStart && quarterStart < intervalEnd) {
        return quarterStart;
      }
    }
    const nextYearStart = new Date(year + 1, 0, 1);
    return nextYearStart >= intervalStart && nextYearStart < intervalEnd ? nextYearStart : false;
  }
  function getHeaderDefinition(header, level) {
    if (!header) return null;
    if (!Array.isArray(header)) return header[level] || null;
    return header.find((entry) => {
      if (!entry || typeof entry !== "object") return false;
      return entry.level === level || entry.name === level || entry.type === level || entry.position === level || entry.header === level;
    }) || null;
  }
  function createHeaderFormatter(def) {
    if (!def) return void 0;
    const { date_format = "", date_format_at_border = "", interval = null } = def;
    if (date_format === "~weekRange") return formatWeek;
    if (!interval) {
      return date_format || "";
    }
    const formatValue = (d, fmt, lang2) => {
      if (!fmt) return "";
      if (fmt === "~decade") return getDecade(d);
      return date_utils.format(d, fmt, lang2);
    };
    const borderFmt = date_format_at_border ?? date_format ?? "";
    const normalFmt = date_format ?? "";
    return (d, ld, lang2) => {
      const border = isHeaderBorder(d, ld, interval);
      if (!normalFmt) {
        return border ? formatValue(d, borderFmt, lang2) : "";
      }
      return border ? formatValue(d, borderFmt, lang2) : formatValue(d, normalFmt, lang2);
    };
  }
  function createThickLineFormatter(thickLine) {
    if (!thickLine || typeof thickLine === "function") return thickLine;
    return (d, ctx = {}) => {
      if (thickLine.interval === "week") {
        return d.getDay() === thickLine.value;
      }
      if (thickLine.interval === "month_range_in_days") {
        return d.getDate() >= thickLine.from && d.getDate() <= thickLine.to;
      }
      if (thickLine.interval === "year_quarter") {
        return getQuarterStartInInterval(
          d,
          ctx.step ?? 1,
          ctx.unit ?? "day"
        );
      }
      return false;
    };
  }
  function normalizeViewMode(mode, name) {
    if (!mode || typeof mode !== "object") return mode;
    const upperDef = getHeaderDefinition(mode.header, "upper");
    const lowerDef = getHeaderDefinition(mode.header, "lower");
    const normalized = {
      ...mode,
      name: mode.name ?? name
    };
    if (normalized.upper_text === void 0 && upperDef) {
      normalized.upper_text = createHeaderFormatter(upperDef);
    }
    if (normalized.lower_text === void 0 && lowerDef) {
      normalized.lower_text = createHeaderFormatter(lowerDef);
    }
    if (mode.thick_line && typeof mode.thick_line !== "function") {
      normalized.thick_line = createThickLineFormatter(mode.thick_line);
    }
    return normalized;
  }
  function normalizeViewModes(viewModes) {
    if (Array.isArray(viewModes)) {
      return viewModes.map((mode) => {
        if (typeof mode === "string") {
          const predefined_mode = DEFAULT_VIEW_MODES.find(
            (d) => d.name === mode
          );
          if (!predefined_mode) {
            console.error(
              `The view mode "${mode}" is not predefined in Riel Gantt. Please define the view mode object instead.`
            );
          }
          return predefined_mode;
        }
        return normalizeViewMode(mode);
      });
    }
    if (!viewModes || typeof viewModes !== "object") return [];
    return Object.entries(viewModes).map(
      ([name, mode]) => normalizeViewMode(mode, name)
    );
  }
  const DEFAULT_VIEW_MODES = [
    // >>> SR: Bar Aggregation TEST 2-------------------------------------------------
    // It currently doesn't work properly with PowerUI
    /*    {
            name: 'Hour',
            padding: '7d',
            step: '1h',
            date_format: 'YYYY-MM-dd HH:',
            lower_text: 'HH',
            upper_text: (d, ld, lang) =>
                !ld || d.getDate() !== ld.getDate()
                    ? date_utils.format(d, 'dd MMMM', lang)
                    : '',
            upper_text_frequency: 24,
        },
        {
            name: 'Quarter Day',
            padding: '7d',
            step: '6h',
            date_format: 'YYYY-MM-dd HH:',
            lower_text: 'HH',
            upper_text: (d, ld, lang) =>
                !ld || d.getDate() !== ld.getDate()
                    ? date_utils.format(d, 'dd MMM', lang)
                    : '',
            upper_text_frequency: 4,
        },
        {
            name: 'Half Day',
            padding: '14d',
            step: '12h',
            date_format: 'YYYY-MM-dd HH:',
            lower_text: 'HH',
            upper_text: (d, ld, lang) =>
                !ld || d.getDate() !== ld.getDate()
                    ? d.getMonth() !== d.getMonth()
                        ? date_utils.format(d, 'dd MMM', lang)
                        : date_utils.format(d, 'dd', lang)
                    : '',
            upper_text_frequency: 2,
        },*/
    // <<< SR: Bar Aggregation -------------------------------------------------
    {
      name: "Day",
      padding: "7d",
      // >>> SR: Today button left scroll padding --------------------------
      today_button_left_scroll_padding: null,
      // <<< SR: Today button left scroll padding --------------------------
      date_format: "YYYY-MM-dd",
      step: "1d",
      lower_text: (d, ld, lang2) => !ld || d.getDate() !== ld.getDate() ? date_utils.format(d, "dd", lang2) : "",
      upper_text: (d, ld, lang2) => !ld || d.getMonth() !== ld.getMonth() ? date_utils.format(d, "MMMM", lang2) : "",
      thick_line: (d) => d.getDay() === 1
    },
    {
      name: "Week",
      padding: "1m",
      // >>> SR: Today button left scroll padding --------------------------
      today_button_left_scroll_padding: null,
      // <<< SR: Today button left scroll padding --------------------------
      step: "7d",
      date_format: "YYYY-MM-dd",
      column_width: 140,
      lower_text: formatWeek,
      upper_text: (d, ld, lang2) => !ld || d.getMonth() !== ld.getMonth() ? date_utils.format(d, "MMMM", lang2) : "",
      thick_line: (d) => d.getDate() >= 1 && d.getDate() <= 7,
      upper_text_frequency: 4
    },
    {
      name: "Month",
      padding: "2m",
      // >>> SR: Today button left scroll padding --------------------------
      today_button_left_scroll_padding: null,
      // <<< SR: Today button left scroll padding --------------------------
      step: "1m",
      column_width: 120,
      date_format: "YYYY-MM",
      lower_text: "MMMM",
      upper_text: (d, ld, lang2) => !ld || d.getFullYear() !== ld.getFullYear() ? date_utils.format(d, "YYYY", lang2) : "",
      thick_line: (d) => d.getMonth() % 3 === 0,
      snap_at: "7d"
    },
    {
      name: "Year",
      padding: "2y",
      // >>> SR: Today button left scroll padding --------------------------
      today_button_left_scroll_padding: null,
      // <<< SR: Today button left scroll padding --------------------------
      step: "1y",
      column_width: 120,
      date_format: "YYYY",
      upper_text: (d, ld, lang2) => !ld || getDecade(d) !== getDecade(ld) ? getDecade(d) : "",
      lower_text: "YYYY",
      snap_at: "30d"
    }
  ];
  const DEFAULT_OPTIONS = {
    arrow_curve: 5,
    auto_move_label: false,
    bar_corner_radius: 3,
    // The height of the individual bars:
    bar_height: 30,
    container_height: "auto",
    column_width: null,
    date_format: "YYYY-MM-dd HH:mm",
    //There is no longer a ‘header_height’. Now it is "upper + lower + 10px"
    upper_header_height: 45,
    lower_header_height: 30,
    snap_at: null,
    // At Wheel scroll it automatically expands the Gantt borders, regards of if we scroll in the middle or at the border.
    // @not-stable
    infinite_padding: false,
    holidays: { "var(--g-weekend-highlight-color)": "weekend" },
    ignore: [],
    language: "en",
    lines: "both",
    move_dependencies: true,
    //TODO SR INFO: The padding here is the padding from the bar to the top and bottom edges of the line. 
    // With the new overlap logic, the padding no longer works. The logic from "Changed" version is still faulty and needs to be revised.
    padding: 18,
    popup: (ctx) => {
      ctx.set_title(ctx.task.name);
      if (ctx.task.description) ctx.set_subtitle(ctx.task.description);
      else ctx.set_subtitle("");
      const start_date = date_utils.format(
        ctx.task._start,
        "MMM dd",
        ctx.chart.options.language
      );
      const end_date = date_utils.format(
        //date_utils.add(ctx.task._end, -1, 'second'),
        date_utils.add(ctx.task.orig_end, -1, "second"),
        "MMM dd",
        ctx.chart.options.language
      );
      const hasRealStart = !!ctx.task.start;
      const hasRealEnd = !!ctx.task.end || ctx.task.duration !== void 0;
      if (hasRealStart || hasRealEnd) {
        if (hasRealStart && hasRealEnd) {
          ctx.set_details(
            `${start_date} - ${end_date} (${ctx.task.actual_duration} days${ctx.task.ignored_duration ? " + " + ctx.task.ignored_duration + " excluded" : ""})<br/>Progress: ${Math.floor(ctx.task.progress * 100) / 100}%`
          );
        } else if (hasRealStart && !hasRealEnd) {
          ctx.set_details(
            `${start_date} - ... <br/>Progress: ${Math.floor(ctx.task.progress * 100) / 100}%`
          );
        } else if (hasRealEnd && !hasRealStart) {
          ctx.set_details(
            `... - ${end_date} <br/>Progress: ${Math.floor(ctx.task.progress * 100) / 100}%`
          );
        }
      }
    },
    // >>> SR: Hover click popup -----------------------------------------------
    // Values: 'click' | 'hover'
    popup_on: "click",
    // <<< SR: Hover click popup -----------------------------------------------
    readonly_progress: false,
    readonly_dates: false,
    readonly: false,
    scroll_to: "today",
    show_expected_progress: false,
    today_button: true,
    // Today missing callback.
    // function(today, gantt_start, gantt_end)
    on_today_missing: null,
    view_mode: "Day",
    view_mode_select: false,
    view_modes: DEFAULT_VIEW_MODES,
    is_weekend: (d) => d.getDay() === 0 || d.getDay() === 6,
    // >>> SR: Bar Aggregation -------------------------------------------------
    // Values: 'outside' | 'clip' //TODO SR: The “hide” option has been removed for now.
    label_overflow: "outside",
    label_outside_color: "#555",
    // vertical distance between lanes in the same row
    lane_padding: 4,
    //is calculated automatically, if set to null.
    row_height: null,
    // Total vertical padding within the row for each task
    bar_inner_padding: 6,
    // Defines the number of visible lines regardless if they have task-bars or not.
    row_keys: null,
    // Default duration in days for tasks without start / end date and duration
    default_duration: 2,
    // Defines the start of the week. The 'sunday' option is currently @not-stable. Use only 'monday' or fix it!
    // Values: 'monday' | 'sunday' (@not-stable)
    start_of_week: "monday",
    // Set to true to extend the padded date range until today is included.
    // @experimental
    include_today_in_padding: false,
    // >>> SR: Global minimum view interval ------------------------------------
    // Minimum date that should be included before view padding is applied.
    global_min_view_start: null,
    // Maximum date that should be included before view padding is applied.
    global_min_view_end: null,
    // <<< SR: Global minimum view interval ------------------------------------
    // Set to true to enable classic alternating row background colors.
    stripe_rows: false,
    // Defines the look of the aggregate popup.
    // 'table' is @experimental
    // Values: 'list' | 'table'
    popup_aggregate_style: "list",
    // Includes tasks that are in the top lane of the row in the aggregate popup. 
    // Set false to only include tasks inside the aggregation block.
    // @experimental
    popup_aggregate_include_upper_row_tasks: true,
    // Values: null | function(date, format_string, lang)
    date_formatter: null,
    // fallback format for date_utils.format(date)
    date_format_default: "YYYY-MM-DD HH:mm:ss.SSS",
    // Number of vertical lanes per row. The lowest lane is used for single lower tasks or aggregate bars.
    row_lanes: 2,
    // >>> SR: Aggregation popup Gantt ----------------------------------------
    // Shows a compact Gantt next to the aggregation popup task list.
    // @experimental
    popup_aggregate_expand_tasks: false,
    // Width in px for the Gantt shown inside aggregation popups.
    // Works only with popup_aggregate_expand_tasks set to TRUE.
    popup_aggregate_gantt_width: 360
    // <<< SR: Aggregation popup Gantt ----------------------------------------
    // <<< SR: Bar Aggregation -------------------------------------------------
  };
  class Gantt {
    constructor(wrapper, tasks, options) {
      this.setup_wrapper(wrapper);
      this.setup_options(options);
      this.setup_tasks(tasks);
      this.change_view_mode();
      this.bind_events();
      this.date_utils = date_utils;
    }
    setup_wrapper(element) {
      let svg_element, wrapper_element;
      if (typeof element === "string") {
        let el = document.querySelector(element);
        if (!el) {
          throw new ReferenceError(
            `CSS selector "${element}" could not be found in DOM`
          );
        }
        element = el;
      }
      if (element instanceof HTMLElement) {
        wrapper_element = element;
        svg_element = element.querySelector("svg");
      } else if (element instanceof SVGElement) {
        svg_element = element;
      } else {
        throw new TypeError(
          "Riel Gantt only supports usage of a string CSS selector, HTML DOM element or SVG DOM element for the 'element' parameter"
        );
      }
      if (!svg_element) {
        this.$svg = createSVG("svg", {
          append_to: wrapper_element,
          class: "gantt"
        });
      } else {
        this.$svg = svg_element;
        this.$svg.classList.add("gantt");
      }
      this.$container = this.create_el({
        classes: "gantt-container",
        append_to: this.$svg.parentElement
      });
      this.$container.appendChild(this.$svg);
      this.$popup_wrapper = this.create_el({
        classes: "popup-wrapper",
        append_to: this.$container
      });
      this._popup_locked_by_click = false;
      this._suppress_scroll_strategy = false;
      this._extending_infinite_padding = false;
    }
    setup_options(options) {
      this.original_options = options;
      if (options?.view_modes) {
        const requested_view_mode = options.view_mode;
        options.view_modes = normalizeViewModes(options.view_modes);
        const resolved_view_mode = typeof requested_view_mode === "string" ? options.view_modes.find(
          (mode) => mode?.name === requested_view_mode
        ) : requested_view_mode;
        options.view_mode = resolved_view_mode || options.view_modes[0];
      }
      this.options = { ...DEFAULT_OPTIONS, ...options };
      date_utils.set_date_formatter(
        this.options.date_formatter,
        this.options.date_format_default
      );
      if (this.options.row_height == null) {
        this.options.row_height = this.options.bar_height + this.options.padding;
      }
      if (this.options.bar_inner_padding == null) {
        this.options.bar_inner_padding = 6;
      }
      this.options.row_lanes = Math.max(
        2,
        Math.floor(Number(this.options.row_lanes) || 2)
      );
      const CSS_VARIABLES = {
        "grid-height": "container_height",
        "bar-height": "bar_height",
        "lower-header-height": "lower_header_height",
        "upper-header-height": "upper_header_height"
      };
      for (let name in CSS_VARIABLES) {
        let setting = this.options[CSS_VARIABLES[name]];
        if (setting !== "auto")
          this.$container.style.setProperty(
            "--gv-" + name,
            setting + "px"
          );
      }
      this.config = {
        ignored_dates: [],
        ignored_positions: [],
        extend_by_units: 10
      };
      if (typeof this.options.ignore !== "function") {
        if (typeof this.options.ignore === "string")
          this.options.ignore = [this.options.ignore];
        for (let option of this.options.ignore) {
          if (typeof option === "function") {
            this.config.ignored_function = option;
            continue;
          }
          if (typeof option === "string") {
            if (option === "weekend")
              this.config.ignored_function = (d) => d.getDay() == 6 || d.getDay() == 0;
            else this.config.ignored_dates.push(/* @__PURE__ */ new Date(option + " "));
          }
        }
      } else {
        this.config.ignored_function = this.options.ignore;
      }
    }
    update_options(options) {
      this.setup_options({ ...this.original_options, ...options });
      this.change_view_mode(void 0, true);
    }
    setup_tasks(tasks) {
      this.tasks = tasks.map((task, i) => {
        if (task.start !== void 0) {
          task._start = date_utils.parse(task.start);
          if (task.end === void 0 && task.duration !== void 0) {
            task.end = task._start;
            let durations = task.duration.split(" ");
            durations.forEach((tmpDuration) => {
              let { duration, scale } = date_utils.parse_duration(tmpDuration);
              task.end = date_utils.add(task.end, duration, scale);
            });
            if (!task.end) {
              console.error(`task "${task.id}" doesn't have an end date`);
              return false;
            }
            task._end = date_utils.parse(task.end);
          }
        }
        if (task.start && task.end) {
          task._start = date_utils.parse(task.start);
          task._end = date_utils.parse(task.end);
        }
        if (!task.start && !task.end) {
          const today = date_utils.today();
          task._start = today;
          task._end = date_utils.add(today, this.options.default_duration - 1, "day");
        }
        if (!task.start && task.end) {
          task._end = date_utils.parse(task.end);
          task._start = date_utils.add(task._end, -(this.options.default_duration - 1), "day");
        }
        if (task.start && !task.end && task.duration === void 0) {
          task._start = date_utils.parse(task.start);
          task._end = date_utils.add(task._start, this.options.default_duration - 1, "day");
        }
        if (!task.start || !task.end) {
          task.dateIncomplete = true;
        }
        let diff2 = date_utils.diff(task._end, task._start, "year");
        if (diff2 < 0) {
          console.error(
            `start of task can't be after end of task: in task "${task.id}"`
          );
          return false;
        }
        if (date_utils.diff(task._end, task._start, "year") > 10) {
          console.error(
            `the duration of task "${task.id}" is too long (above ten years)`
          );
          return false;
        }
        task._index = i;
        const task_end_values = date_utils.get_date_values(task._end);
        if (task_end_values.slice(3).every((d) => d === 0)) {
          task._end = date_utils.add(task._end, 24, "hour");
        }
        if (typeof task.dependencies === "string" || !task.dependencies) {
          let deps = [];
          if (task.dependencies) {
            deps = task.dependencies.split(",").map((d) => d.trim().replaceAll(" ", "_")).filter((d) => d);
          }
          task.dependencies = deps;
        }
        if (!task.id) {
          task.id = generate_id(task);
        } else if (typeof task.id === "string") {
          task.id = task.id.replaceAll(" ", "_");
        } else {
          task.id = `${task.id}`;
        }
        return task;
      }).filter((t) => t);
      this.setup_dependencies();
      this.compute_rows_and_lanes();
      this.compute_overlap_aggregates();
      this.relayout_visible_rows();
    }
    setup_dependencies() {
      this.dependency_map = {};
      for (let t of this.tasks) {
        for (let d of t.dependencies) {
          this.dependency_map[d] = this.dependency_map[d] || [];
          this.dependency_map[d].push(t.id);
        }
      }
    }
    // >>> SR: Refresh scroll control -----------------------------------------
    /**
     * Refreshes the Gantt tasks. By default, the current horizontal scroll
     * position is preserved so repeated data refreshes do not jump back to
     * `scroll_to` (for example `today`).
     *
     * @param tasks
     * @param scroll_after_refresh false keeps the exact current pixel position;
     * true applies options.scroll_to; a string or Date is used as explicit
     * scroll target.
     */
    refresh(tasks, scroll_after_refresh = false) {
      this.setup_tasks(tasks);
      if (scroll_after_refresh === false || scroll_after_refresh == null) {
        this.change_view_mode(void 0, true, true);
        return;
      }
      const original_scroll_to = this.options.scroll_to;
      if (scroll_after_refresh !== true) {
        this.options.scroll_to = scroll_after_refresh;
      }
      this.change_view_mode(void 0, false);
      this.options.scroll_to = original_scroll_to;
    }
    // <<< SR: Refresh scroll control -----------------------------------------
    // >>> SR: Date calculation after change fix -------------------------------
    refresh_overlap_aggregates_after_drop() {
      const scroll_left = this.$container.scrollLeft;
      const scroll_top = this.$container.scrollTop;
      this.compute_rows_and_lanes();
      this.compute_overlap_aggregates();
      this.relayout_visible_rows();
      this.render();
      this.$container.scrollLeft = scroll_left;
      this.$container.scrollTop = scroll_top;
    }
    // <<< SR: Date calculation after change fix -------------------------------
    update_task(id, new_details) {
      let task = this.tasks.find((t) => t.id === id);
      let bar = this.bars[task._index];
      Object.assign(task, new_details);
      bar.refresh();
    }
    change_view_mode(mode = this.options.view_mode, maintain_pos = false, maintain_exact_scroll_left = false) {
      if (typeof mode === "string") {
        mode = this.options.view_modes.find((d) => d.name === mode);
      }
      let old_pos, old_scroll_op, anchor_date;
      if (maintain_pos) {
        old_pos = this.$container.scrollLeft;
        old_scroll_op = this.options.scroll_to;
        this.options.scroll_to = null;
        if (!maintain_exact_scroll_left) {
          anchor_date = this.get_date_by_position ? this.get_date_by_position(old_pos) : date_utils.add(
            this.gantt_start,
            old_pos / this.config.column_width * this.config.step,
            this.config.unit
          );
        }
      }
      this.options.view_mode = mode.name;
      this.config.view_mode = mode;
      this.update_view_scale(mode);
      this.setup_dates(false);
      this._suppress_scroll_strategy = maintain_pos;
      try {
        this.render();
      } finally {
        this._suppress_scroll_strategy = false;
      }
      if (maintain_pos) {
        if (maintain_exact_scroll_left) {
          this.$container.scrollLeft = old_pos;
        } else if (anchor_date) {
          this.set_scroll_position(anchor_date, false);
        } else {
          this.$container.scrollLeft = old_pos;
        }
        this.options.scroll_to = old_scroll_op;
      }
      this.trigger_event("view_change", [mode]);
    }
    update_view_scale(mode) {
      let { duration, scale } = date_utils.parse_duration(mode.step);
      this.config.step = duration;
      this.config.unit = scale;
      this.config.column_width = this.options.column_width || mode.column_width || 45;
      this.$container.style.setProperty(
        "--gv-column-width",
        this.config.column_width + "px"
      );
      this.config.header_height = this.options.lower_header_height + this.options.upper_header_height + 10;
    }
    setup_dates(refresh = false) {
      this.setup_gantt_dates(refresh);
      this.setup_date_values();
    }
    setup_gantt_dates(refresh) {
      let gantt_start, gantt_end;
      if (!this.tasks.length) {
        gantt_start = /* @__PURE__ */ new Date();
        gantt_end = /* @__PURE__ */ new Date();
      }
      for (let task of this.tasks) {
        if (!gantt_start || task._start < gantt_start) {
          gantt_start = task._start;
        }
        if (!gantt_end || task._end > gantt_end) {
          gantt_end = task._end;
        }
      }
      ({ gantt_start, gantt_end } = this.apply_global_min_view_interval(
        gantt_start,
        gantt_end
      ));
      gantt_start = date_utils.start_of(gantt_start, this.config.unit);
      gantt_end = date_utils.start_of(gantt_end, this.config.unit);
      if (!refresh) {
        const view_padding = Array.isArray(this.config.view_mode.padding) ? this.config.view_mode.padding : [
          this.config.view_mode.padding,
          this.config.view_mode.padding
        ];
        const [padding_start, padding_end] = view_padding.map(
          date_utils.parse_duration
        );
        this.gantt_start = date_utils.add(
          gantt_start,
          -padding_start.duration,
          padding_start.scale
        );
        this.gantt_end = date_utils.add(
          gantt_end,
          padding_end.duration,
          padding_end.scale
        );
        this.extend_gantt_range_to_include_today();
        if (this.should_align_to_week_start()) {
          this.gantt_start = this.align_to_week_start(this.gantt_start);
        }
      }
      this.config.date_format = this.config.view_mode.date_format || this.options.date_format;
      this.gantt_start.setHours(0, 0, 0, 0);
    }
    // >>> SR: Global minimum view interval -----------------------------------
    /**
     * Extends the task-derived base date range with configured global minimum
     * view boundaries before the active view padding is applied.
     * @param gantt_start
     * @param gantt_end
     * @returns {{gantt_start: Date, gantt_end: Date}}
     */
    apply_global_min_view_interval(gantt_start, gantt_end) {
      const global_start = this.get_global_min_view_date("global_min_view_start");
      const global_end = this.get_global_min_view_date("global_min_view_end");
      if (global_start && (!gantt_start || gantt_start > global_start)) {
        gantt_start = global_start;
      }
      if (global_end && (!gantt_end || gantt_end < global_end)) {
        gantt_end = global_end;
      }
      return { gantt_start, gantt_end };
    }
    /**
     * Parses one configured global minimum view boundary. The option accepts
     * the same values as task start/end, for example '2027-07-01'.
     * @param option_name
     * @returns {Date|null}
     */
    get_global_min_view_date(option_name) {
      const value = this.options?.[option_name];
      if (!value) return null;
      const date = date_utils.parse(value);
      if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
        console.warn(`${option_name} must be a valid date value. Ignoring it.`);
        return null;
      }
      return date;
    }
    // <<< SR: Global minimum view interval -----------------------------------
    setup_date_values() {
      let cur_date = this.gantt_start;
      this.dates = [cur_date];
      while (cur_date < this.gantt_end) {
        cur_date = date_utils.add(
          cur_date,
          this.config.step,
          this.config.unit
        );
        this.dates.push(cur_date);
      }
    }
    bind_events() {
      this.bind_grid_click();
      this.bind_holiday_labels();
      this.bind_bar_events();
      this.bind_outside_click();
    }
    render() {
      this.clear();
      this.setup_layers();
      this.make_grid();
      this.make_dates();
      this.make_grid_extras();
      this.make_bars();
      this.make_arrows();
      this.map_arrows_on_bars();
      this.set_dimensions();
      if (!this._suppress_scroll_strategy) {
        this.set_scroll_position(this.options.scroll_to);
      }
    }
    setup_layers() {
      this.layers = {};
      const layers = ["grid", "arrow", "progress", "bar"];
      for (let layer of layers) {
        this.layers[layer] = createSVG("g", {
          class: layer,
          append_to: this.$svg
        });
      }
      this.$extras = this.create_el({
        classes: "extras",
        append_to: this.$container
      });
      this.$adjust = this.create_el({
        classes: "adjust hide",
        append_to: this.$extras,
        type: "button"
      });
      this.$adjust.innerHTML = "&larr;";
    }
    make_grid() {
      this.make_grid_background();
      this.make_grid_rows();
      this.make_grid_header();
      this.make_side_header();
    }
    make_grid_extras() {
      this.make_grid_highlights();
      this.make_grid_ticks();
    }
    make_grid_background() {
      const grid_width = this.dates.length * this.config.column_width;
      const grid_height = Math.max(
        this.config.header_height + this.options.padding + this.get_content_height(),
        this.options.container_height !== "auto" ? this.options.container_height : 0
      );
      createSVG("rect", {
        x: 0,
        y: 0,
        width: grid_width,
        height: grid_height,
        class: "grid-background",
        append_to: this.$svg
      });
      $.attr(this.$svg, {
        height: grid_height,
        width: "100%"
      });
      this.grid_height = grid_height;
      if (this.options.container_height === "auto")
        this.$container.style.height = grid_height + "px";
    }
    make_grid_rows() {
      const rows_layer = createSVG("g", { append_to: this.layers.grid });
      const row_width = this.dates.length * this.config.column_width;
      const rows = this._rowMeta?.length ? this._rowMeta : Array.from({ length: this.tasks.length }, (_, index) => ({
        index,
        top: index * this.options.row_height,
        height: this.options.row_height
      }));
      rows.forEach((row) => {
        const row_class = "grid-row" + (this.options.stripe_rows && row.index % 2 === 1 ? " grid-row-striped" : "");
        createSVG("rect", {
          x: 0,
          y: this.config.header_height + row.top,
          width: row_width,
          height: row.height,
          class: row_class,
          append_to: rows_layer
        });
      });
    }
    make_grid_header() {
      this.$header = this.create_el({
        width: this.dates.length * this.config.column_width,
        classes: "grid-header",
        append_to: this.$container
      });
      this.$upper_header = this.create_el({
        classes: "upper-header",
        append_to: this.$header
      });
      this.$lower_header = this.create_el({
        classes: "lower-header",
        append_to: this.$header
      });
    }
    make_side_header() {
      this.$side_header = this.create_el({ classes: "side-header" });
      this.$upper_header.prepend(this.$side_header);
      if (this.options.view_mode_select) {
        const $select = document.createElement("select");
        $select.classList.add("viewmode-select");
        const $el = document.createElement("option");
        $el.selected = true;
        $el.disabled = true;
        $el.textContent = "Mode";
        $select.appendChild($el);
        for (const mode of this.options.view_modes) {
          const $option = document.createElement("option");
          $option.value = mode.name;
          $option.textContent = mode.name;
          if (mode.name === this.config.view_mode.name)
            $option.selected = true;
          $select.appendChild($option);
        }
        $select.addEventListener(
          "change",
          (function() {
            this.change_view_mode($select.value, true);
          }).bind(this)
        );
        this.$side_header.appendChild($select);
      }
      if (this.options.today_button) {
        let $today_button = document.createElement("button");
        $today_button.classList.add("today-button");
        $today_button.textContent = "Today";
        $today_button.onclick = this.scroll_current.bind(this, true, true);
        this.$side_header.prepend($today_button);
        this.$today_button = $today_button;
      }
    }
    make_grid_ticks() {
      if (this.options.lines === "none") return;
      let tick_x = 0;
      let tick_y = this.config.header_height;
      let tick_height = this.grid_height - this.config.header_height;
      let $lines_layer = createSVG("g", {
        class: "lines_layer",
        append_to: this.layers.grid
      });
      let row_y = this.config.header_height;
      const row_width = this.dates.length * this.config.column_width;
      if (this.options.lines !== "vertical") {
        const rows = this._rowMeta?.length ? this._rowMeta : Array.from({ length: this.tasks.length }, (_, index) => ({
          top: index * this.options.row_height,
          height: this.options.row_height
        }));
        rows.forEach((row) => {
          row_y = this.config.header_height + row.top;
          createSVG("line", {
            x1: 0,
            y1: row_y + row.height,
            x2: row_width,
            y2: row_y + row.height,
            class: "row-line",
            append_to: $lines_layer
          });
        });
      }
      if (this.options.lines === "horizontal") return;
      for (let date of this.dates) {
        tick_x = this.get_position_by_date(date);
        let tick_class = "tick";
        const thickLineResult = this.config.view_mode.thick_line && this.config.view_mode.thick_line(date, {
          gantt: this,
          step: this.config.step,
          unit: this.config.unit
        });
        const isThick = !!thickLineResult;
        const thickLineDate = thickLineResult instanceof Date ? thickLineResult : date;
        const line_x = isThick ? this.get_position_by_date(thickLineDate) : tick_x;
        if (isThick) {
          tick_class += " thick";
        }
        const attrs = {
          d: `M ${line_x} ${tick_y} v ${tick_height}`,
          class: tick_class,
          append_to: this.layers.grid
        };
        if (isThick && this.config.view_mode.thick_line_color) {
          attrs.style = `stroke: ${this.config.view_mode.thick_line_color};`;
        }
        createSVG("path", attrs);
      }
    }
    highlight_holidays() {
      let labels = {};
      if (!this.options.holidays) return;
      for (let color in this.options.holidays) {
        let check_highlight = this.options.holidays[color];
        if (check_highlight === "weekend")
          check_highlight = this.options.is_weekend;
        let extra_func;
        if (typeof check_highlight === "object") {
          let f = check_highlight.find((k) => typeof k === "function");
          if (f) {
            extra_func = f;
          }
          if (this.options.holidays.name) {
            let dateObj = /* @__PURE__ */ new Date(check_highlight.date + " ");
            check_highlight = (d) => dateObj.getTime() === d.getTime();
            labels[dateObj] = check_highlight.name;
          } else {
            check_highlight = (d) => this.options.holidays[color].filter((k) => typeof k !== "function").map((k) => {
              if (k.name) {
                let dateObj = /* @__PURE__ */ new Date(k.date + " ");
                labels[dateObj] = k.name;
                return dateObj.getTime();
              }
              return (/* @__PURE__ */ new Date(k + " ")).getTime();
            }).includes(d.getTime());
          }
        }
        for (let d = new Date(this.gantt_start); d <= this.gantt_end; d.setDate(d.getDate() + 1)) {
          if (this.config.ignored_dates.find(
            (k) => k.getTime() == d.getTime()
          ) || this.config.ignored_function && this.config.ignored_function(d))
            continue;
          if (check_highlight(d) || extra_func && extra_func(d)) {
            const x = this.get_position_by_date(d);
            const height = this.grid_height - this.config.header_height;
            const d_formatted = date_utils.format(d, "YYYY-MM-dd", this.options.language).replace(" ", "_");
            if (labels[d]) {
              let label = this.create_el({
                classes: "holiday-label label_" + d_formatted,
                append_to: this.$extras
              });
              label.textContent = labels[d];
            }
            createSVG("rect", {
              x: Math.round(x),
              y: this.config.header_height,
              width: this.config.column_width / date_utils.convert_scales(
                this.config.view_mode.step,
                "day"
              ),
              height,
              class: "holiday-highlight " + d_formatted,
              style: `fill: ${color};`,
              append_to: this.layers.grid
            });
          }
        }
      }
    }
    /**
     * Compute the horizontal x-axis distance and associated date for the current date and view.
     *
     * @returns Object containing the x-axis distance and date of the current date, or null if the current date is out of the gantt range.
     */
    highlight_current() {
      const res = this.get_closest_date();
      if (!res) return;
      const [_, el] = res;
      el.classList.add("current-date-highlight");
      const left = this.get_position_by_date(/* @__PURE__ */ new Date());
      this.$current_highlight = this.create_el({
        top: this.config.header_height,
        left,
        height: this.grid_height - this.config.header_height,
        classes: "current-highlight",
        append_to: this.$container
      });
      this.$current_ball_highlight = this.create_el({
        top: this.config.header_height - 6,
        left: left - 2.5,
        width: 6,
        height: 6,
        classes: "current-ball-highlight",
        append_to: this.$header
      });
    }
    make_grid_highlights() {
      this.highlight_holidays();
      this.config.ignored_positions = [];
      const height = this.get_content_height();
      this.layers.grid.innerHTML += `<pattern id="diagonalHatch" patternUnits="userSpaceOnUse" width="4" height="4">
          <path d="M-1,1 l2,-2
                   M0,4 l4,-4
                   M3,5 l2,-2"
                style="stroke:grey; stroke-width:0.3" />
        </pattern>`;
      for (let d = new Date(this.gantt_start); d <= this.gantt_end; d.setDate(d.getDate() + 1)) {
        if (!this.config.ignored_dates.find(
          (k) => k.getTime() == d.getTime()
        ) && (!this.config.ignored_function || !this.config.ignored_function(d)))
          continue;
        const x = this.get_position_by_date(d);
        this.config.ignored_positions.push(x);
        createSVG("rect", {
          x,
          y: this.config.header_height,
          width: this.config.column_width,
          height,
          class: "ignored-bar",
          style: "fill: url(#diagonalHatch);",
          append_to: this.$svg
        });
      }
      const highlightDimensions = this.highlight_current(
        this.config.view_mode
      );
      if (!highlightDimensions) return;
    }
    create_el({ left, top, width, height, id, classes, append_to, type }) {
      let $el = document.createElement(type || "div");
      for (let cls of classes.split(" ")) $el.classList.add(cls);
      $el.style.top = top + "px";
      $el.style.left = left + "px";
      if (id) $el.id = id;
      if (width) $el.style.width = width + "px";
      if (height) $el.style.height = height + "px";
      if (append_to) append_to.appendChild($el);
      return $el;
    }
    make_dates() {
      this.get_dates_to_draw().forEach((date, i) => {
        if (date.lower_text) {
          let $lower_text = this.create_el({
            left: date.x,
            top: date.lower_y,
            classes: "lower-text date_" + sanitize(date.formatted_date),
            append_to: this.$lower_header
          });
          $lower_text.innerText = date.lower_text;
        }
        if (date.upper_text) {
          let $upper_text = this.create_el({
            left: date.x,
            top: date.upper_y,
            classes: "upper-text",
            append_to: this.$upper_header
          });
          $upper_text.innerText = date.upper_text;
        }
      });
      this.upperTexts = Array.from(
        this.$container.querySelectorAll(".upper-text")
      );
    }
    get_dates_to_draw() {
      let last_date_info = null;
      const dates = this.dates.map((date, i) => {
        const d = this.get_date_info(date, last_date_info, i);
        last_date_info = d;
        return d;
      });
      return dates;
    }
    get_date_info(date, last_date_info) {
      let last_date = last_date_info ? last_date_info.date : null;
      this.config.column_width;
      const x = last_date_info ? last_date_info.x + last_date_info.column_width : 0;
      let upper_text = this.config.view_mode.upper_text;
      let lower_text = this.config.view_mode.lower_text;
      if (!upper_text) {
        this.config.view_mode.upper_text = () => "";
      } else if (typeof upper_text === "string") {
        this.config.view_mode.upper_text = (date2) => date_utils.format(date2, upper_text, this.options.language);
      }
      if (!lower_text) {
        this.config.view_mode.lower_text = () => "";
      } else if (typeof lower_text === "string") {
        this.config.view_mode.lower_text = (date2) => date_utils.format(date2, lower_text, this.options.language);
      }
      return {
        date,
        formatted_date: sanitize(
          date_utils.format(
            date,
            this.config.date_format,
            this.options.language
          )
        ),
        column_width: this.config.column_width,
        x,
        upper_text: this.config.view_mode.upper_text(
          date,
          last_date,
          this.options.language
        ),
        lower_text: this.config.view_mode.lower_text(
          date,
          last_date,
          this.options.language
        ),
        upper_y: 17,
        lower_y: this.options.upper_header_height + 5
      };
    }
    make_bars() {
      const renderTasks = this.tasks.filter((t) => !t._hidden).concat(this._aggregateBars || []);
      renderTasks.sort((a, b) => {
        const ra = (a._rowIndex ?? a._index) - (b._rowIndex ?? b._index);
        if (ra !== 0) return ra;
        const la = a._lane ?? 0, lb = b._lane ?? 0;
        if (la !== lb) return lb - la;
        if (+a._start !== +b._start) return +a._start - +b._start;
        const ia = isFinite(+a.id) ? +a.id : String(a.id);
        const ib = isFinite(+b.id) ? +b.id : String(b.id);
        return ia > ib ? 1 : ia < ib ? -1 : 0;
      });
      this.bars = renderTasks.map((task) => {
        const bar = new Bar(this, task);
        this.layers.bar.appendChild(bar.group);
        return bar;
      });
    }
    make_arrows() {
      this.arrows = [];
      if (!this.bars || !this.bars.length) return;
      const barById = /* @__PURE__ */ new Map();
      for (const bar of this.bars) {
        if (bar && bar.task && bar.task.id != null) {
          barById.set(bar.task.id, bar);
        }
      }
      for (const task of this.tasks) {
        if (!task || !Array.isArray(task.dependencies) || !task.dependencies.length) continue;
        const toBar = barById.get(task.id);
        if (!toBar) continue;
        for (const depId of task.dependencies) {
          const depTask = this.get_task(depId);
          if (!depTask) continue;
          const fromBar = barById.get(depTask.id);
          if (!fromBar) continue;
          const arrow = new Arrow(this, fromBar, toBar);
          this.layers.arrow.appendChild(arrow.element);
          this.arrows.push(arrow);
        }
      }
    }
    map_arrows_on_bars() {
      for (let bar of this.bars) {
        bar.arrows = this.arrows.filter((arrow) => {
          return arrow.from_task.task.id === bar.task.id || arrow.to_task.task.id === bar.task.id;
        });
      }
    }
    set_dimensions() {
      const { width: cur_width } = this.$svg.getBoundingClientRect();
      const actual_width = this.$svg.querySelector(".grid .grid-row") ? this.$svg.querySelector(".grid .grid-row").getAttribute("width") : 0;
      if (cur_width < actual_width) {
        this.$svg.setAttribute("width", actual_width);
      }
    }
    // >>> SR: Refresh without scroll animation ---------------------------------
    /**
     * Scrolls the Gantt horizontally to a date or keyword.
     * @param date Date, string keyword, or parsable date string.
     * @param animate true keeps the existing smooth scroll behavior; false sets
     * the final scroll position immediately, used by refresh position restore.
     */
    set_scroll_position(date, animate = true) {
      if (this.options.infinite_padding && (!date || date === "start")) {
        let [min_start, ..._] = this.get_start_end_positions();
        this.$container.scrollLeft = min_start;
        return;
      }
      if (!date || date === "start") {
        date = this.gantt_start;
      } else if (date === "end") {
        date = this.gantt_end;
      } else if (date === "today") {
        return this.scroll_current(animate);
      } else if (typeof date === "string") {
        date = date_utils.parse(date);
      }
      const scroll_pos = this.get_position_by_date(date);
      const scroll_left = scroll_pos - this.config.column_width / 6;
      if (animate) {
        this.$container.scrollTo({
          left: scroll_left,
          behavior: "smooth"
        });
      } else {
        this.$container.scrollLeft = scroll_left;
      }
      if (this.$current) {
        this.$current.classList.remove("current-upper");
      }
      this.current_date = date_utils.add(
        this.gantt_start,
        this.$container.scrollLeft / this.config.column_width,
        this.config.unit
      );
      let current_upper = this.config.view_mode.upper_text(
        this.current_date,
        null,
        this.options.language
      );
      let $el = this.upperTexts.find(
        (el) => el.textContent === current_upper
      );
      this.current_date = date_utils.add(
        this.gantt_start,
        (this.$container.scrollLeft + $el.clientWidth) / this.config.column_width,
        this.config.unit
      );
      current_upper = this.config.view_mode.upper_text(
        this.current_date,
        null,
        this.options.language
      );
      $el = this.upperTexts.find((el) => el.textContent === current_upper);
      $el.classList.add("current-upper");
      this.$current = $el;
    }
    // >>> SR: Refresh without scroll animation ---------------------------------
    /**
     * Scrolls to the current day. The optional animate flag allows refresh()
     * position restoration to reuse the same date logic without smooth scrolling.
     * @param animate true keeps the existing smooth scroll behavior.
     * @param trigger_today_missing true calls on_today_missing when today is outside the Gantt interval.
     */
    scroll_current(animate = true, trigger_today_missing = false) {
      let res = this.get_closest_date();
      if (res) {
        this.set_scroll_position(this.get_today_scroll_target_date(), animate);
        return;
      }
      const today = /* @__PURE__ */ new Date();
      if (trigger_today_missing && (today < this.gantt_start || today > this.gantt_end)) {
        this.trigger_event("today_missing", [
          today,
          this.gantt_start,
          this.gantt_end
        ]);
      }
    }
    // >>> SR: Today button left scroll padding -------------------------------
    /**
     * Returns the date that should be placed at the left side of the viewport
     * when the Today button is used. The current date stays highlighted at its
     * real position, while this optional padding moves it further to the right.
     * @returns {Date}
     */
    get_today_scroll_target_date() {
      const today = /* @__PURE__ */ new Date();
      const padding = this.get_today_button_left_scroll_padding();
      if (!padding) return today;
      const target = date_utils.add(today, -padding.duration, padding.scale);
      return target < this.gantt_start ? this.gantt_start : target;
    }
    /**
     * Reads and parses the current view mode's today-button left scroll padding.
     * The value uses the same format as view mode padding. If an array is given,
     * the left-side value is used.
     * @returns {{duration: number, scale: string}|null}
     */
    get_today_button_left_scroll_padding() {
      const padding_config = this.config.view_mode?.today_button_left_scroll_padding;
      const left_padding = Array.isArray(padding_config) ? padding_config[0] : padding_config;
      if (!left_padding) return null;
      const parsed = date_utils.parse_duration(left_padding);
      if (!parsed?.duration || !parsed?.scale) return null;
      return parsed;
    }
    // <<< SR: Today button left scroll padding -------------------------------
    get_closest_date() {
      let now2 = /* @__PURE__ */ new Date();
      if (now2 < this.gantt_start || now2 > this.gantt_end) return null;
      const current = this.get_date_tick_for_date(now2);
      const el = current ? this.$container.querySelector(
        ".date_" + sanitize(
          date_utils.format(
            current,
            this.config.date_format,
            this.options.language
          )
        )
      ) : null;
      if (!el) return null;
      return [
        date_utils.parse(
          date_utils.format(
            current,
            this.config.date_format,
            this.options.language
          )
        ),
        el
      ];
    }
    bind_grid_click() {
      $.on(
        this.$container,
        "click",
        ".grid-row, .grid-header, .ignored-bar, .holiday-highlight",
        (e) => {
          if (this.$popup_wrapper?.contains(e.target)) return;
          this.unselect_all();
          this.hide_popup();
        }
      );
    }
    bind_holiday_labels() {
      const $highlights = this.$container.querySelectorAll(".holiday-highlight");
      for (let h of $highlights) {
        const label = this.$container.querySelector(
          ".label_" + h.classList[1]
        );
        if (!label) continue;
        let timeout;
        h.onmouseenter = (e) => {
          timeout = setTimeout(() => {
            label.classList.add("show");
            label.style.left = (e.offsetX || e.layerX) + "px";
            label.style.top = (e.offsetY || e.layerY) + "px";
          }, 300);
        };
        h.onmouseleave = (e) => {
          clearTimeout(timeout);
          label.classList.remove("show");
        };
      }
    }
    get_start_end_positions() {
      if (!this.bars.length) return [0, 0, 0];
      let { x, width } = this.bars[0].group.getBBox();
      let min_start = x;
      let max_start = x;
      let max_end = x + width;
      Array.prototype.forEach.call(this.bars, function({ group }, i) {
        let { x: x2, width: width2 } = group.getBBox();
        if (x2 < min_start) min_start = x2;
        if (x2 > max_start) max_start = x2;
        if (x2 + width2 > max_end) max_end = x2 + width2;
      });
      return [min_start, max_start, max_end];
    }
    bind_bar_events() {
      let is_dragging = false;
      let x_on_start = 0;
      let x_on_scroll_start = this.$container.scrollLeft;
      let is_resizing_left = false;
      let is_resizing_right = false;
      let parent_bar_id = null;
      let bars = [];
      let bar_action_started = false;
      this.bar_being_dragged = null;
      const action_in_progress = () => is_dragging || is_resizing_left || is_resizing_right;
      const reset_bar_action_state = () => {
        bars.forEach((bar) => {
          if (bar?.$bar) bar.$bar.finaldx = 0;
        });
        bars = [];
        bar_action_started = false;
      };
      const finish_bar_action = () => {
        this.bar_being_dragged = null;
        if (!bar_action_started) return;
        let should_refresh_overlap_aggregates = false;
        bars.forEach((bar) => {
          const $bar = bar?.$bar;
          if (!$bar?.finaldx) return;
          bar.date_changed();
          bar.compute_progress();
          bar.set_action_completed();
          should_refresh_overlap_aggregates = true;
        });
        reset_bar_action_state();
        if (should_refresh_overlap_aggregates) {
          this.refresh_overlap_aggregates_after_drop();
        }
      };
      this.$svg.onclick = (e) => {
        if (e.target.classList.contains("grid-row")) this.unselect_all();
      };
      let pos = 0;
      $.on(this.$svg, "mousemove", ".bar-wrapper, .handle", (e) => {
        if (this.bar_being_dragged === false && Math.abs((e.offsetX || e.layerX) - pos) > 10)
          this.bar_being_dragged = true;
      });
      $.on(this.$svg, "mousedown", ".bar-wrapper, .handle", (e, element) => {
        const bar_wrapper = $.closest(".bar-wrapper", element);
        if (element.classList.contains("left")) {
          is_resizing_left = true;
          element.classList.add("visible");
        } else if (element.classList.contains("right")) {
          is_resizing_right = true;
          element.classList.add("visible");
        } else if (element.classList.contains("bar-wrapper")) {
          is_dragging = true;
        }
        this.unlock_popup_on_click();
        if (this.popup) this.popup.hide();
        x_on_start = e.offsetX || e.layerX;
        parent_bar_id = bar_wrapper.getAttribute("data-id");
        bar_action_started = true;
        let ids;
        if (this.options.move_dependencies) {
          ids = [
            parent_bar_id,
            ...this.get_all_dependent_tasks(parent_bar_id)
          ];
        } else {
          ids = [parent_bar_id];
        }
        bars = ids.map((id) => this.get_bar(id));
        this.bar_being_dragged = false;
        pos = x_on_start;
        bars.forEach((bar) => {
          const $bar = bar?.$bar;
          if ($bar) {
            $bar.ox = $bar.getX();
            $bar.oy = $bar.getY();
            $bar.owidth = $bar.getWidth();
            $bar.finaldx = 0;
          }
        });
      });
      if (this.options.infinite_padding) {
        this.$container.addEventListener("wheel", (e) => {
          const abs_delta_x = Math.abs(e.deltaX || 0);
          const abs_delta_y = Math.abs(e.deltaY || 0);
          const horizontal_intent = abs_delta_x > 0 && abs_delta_x >= abs_delta_y;
          const shift_horizontal = e.shiftKey && abs_delta_y > 0;
          if (!horizontal_intent && !shift_horizontal) return;
          this.maybe_extend_infinite_padding(e.currentTarget);
        });
      }
      $.on(this.$container, "scroll", (e) => {
        let localBars = [];
        const ids = this.bars.map(
          ({ group }) => group.getAttribute("data-id")
        );
        const current_scroll_left = e.currentTarget.scrollLeft;
        const horizontal_scroll_changed = current_scroll_left !== x_on_scroll_start;
        let dx;
        if (horizontal_scroll_changed) {
          dx = current_scroll_left - x_on_scroll_start;
        }
        this.current_date = date_utils.add(
          this.gantt_start,
          // >>> SR: Date calculation Fix -----------------------------------
          current_scroll_left / this.config.column_width * // >>> SR: Date calculation Fix -----------------------------------
          this.config.step,
          this.config.unit
        );
        let current_upper = this.config.view_mode.upper_text(
          this.current_date,
          null,
          this.options.language
        );
        let $el = this.upperTexts.find(
          (el) => el.textContent === current_upper
        );
        this.current_date = date_utils.add(
          this.gantt_start,
          // >>> SR: Date calculation Fix -------------------------------------
          (current_scroll_left + $el.clientWidth) / // <<< SR: Date calculation Fix ---------------------------------
          this.config.column_width * this.config.step,
          this.config.unit
        );
        current_upper = this.config.view_mode.upper_text(
          this.current_date,
          null,
          this.options.language
        );
        $el = this.upperTexts.find(
          (el) => el.textContent === current_upper
        );
        if ($el !== this.$current) {
          if (this.$current)
            this.$current.classList.remove("current-upper");
          $el.classList.add("current-upper");
          this.$current = $el;
        }
        x_on_scroll_start = current_scroll_left;
        let [min_start, max_start, max_end] = this.get_start_end_positions();
        if (x_on_scroll_start > max_end + 100) {
          this.$adjust.innerHTML = "&larr;";
          this.$adjust.classList.remove("hide");
          this.$adjust.onclick = () => {
            this.$container.scrollTo({
              left: max_start,
              behavior: "smooth"
            });
          };
        } else if (x_on_scroll_start + e.currentTarget.offsetWidth < min_start - 100) {
          this.$adjust.innerHTML = "&rarr;";
          this.$adjust.classList.remove("hide");
          this.$adjust.onclick = () => {
            this.$container.scrollTo({
              left: min_start,
              behavior: "smooth"
            });
          };
        } else {
          this.$adjust.classList.add("hide");
        }
        if (dx) {
          localBars = ids.map((id) => this.get_bar(id));
          if (this.options.auto_move_label) {
            localBars.forEach((bar) => {
              bar.update_label_position_on_horizontal_scroll({
                x: dx,
                sx: e.currentTarget.scrollLeft
              });
            });
          }
        }
      });
      $.on(this.$svg, "mousemove", (e) => {
        if (!action_in_progress()) return;
        const dx = (e.offsetX || e.layerX) - x_on_start;
        let bDraggable = true;
        bars.forEach((bar) => {
          if (bar?.task?.draggable === false) {
            bDraggable = false;
          }
        });
        if (bDraggable === false) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
        bars.forEach((bar) => {
          const $bar = bar?.$bar;
          if (!$bar) return;
          $bar.finaldx = this.get_snap_position(dx, $bar.ox);
          this.hide_popup();
          if (is_resizing_left) {
            if (parent_bar_id === bar.task.id) {
              bar.update_bar_position({
                x: $bar.ox + $bar.finaldx,
                width: $bar.owidth - $bar.finaldx
              });
            } else {
              bar.update_bar_position({
                x: $bar.ox + $bar.finaldx
              });
            }
          } else if (is_resizing_right) {
            if (parent_bar_id === bar.task.id) {
              bar.update_bar_position({
                width: $bar.owidth + $bar.finaldx
              });
            }
          } else if (is_dragging && !this.options.readonly && !this.options.readonly_dates) {
            bar.update_bar_position({ x: $bar.ox + $bar.finaldx });
          }
        });
      });
      this._onDocumentMouseup = () => {
        is_dragging = false;
        is_resizing_left = false;
        is_resizing_right = false;
        this.$container.querySelector(".visible")?.classList?.remove?.("visible");
        finish_bar_action();
      };
      document.addEventListener("mouseup", this._onDocumentMouseup);
      $.on(this.$svg, "mouseup", () => {
        finish_bar_action();
      });
      this.bind_bar_progress();
    }
    bind_bar_progress() {
      let x_on_start = 0;
      let is_resizing = null;
      let bar = null;
      let $bar_progress = null;
      let $bar = null;
      $.on(this.$svg, "mousedown", ".handle.progress", (e, handle) => {
        is_resizing = true;
        x_on_start = e.offsetX || e.layerX;
        const $bar_wrapper = $.closest(".bar-wrapper", handle);
        const id = $bar_wrapper.getAttribute("data-id");
        bar = this.get_bar(id);
        $bar_progress = bar.$bar_progress;
        $bar = bar.$bar;
        $bar_progress.finaldx = 0;
        $bar_progress.owidth = $bar_progress.getWidth();
        $bar_progress.min_dx = -$bar_progress.owidth;
        $bar_progress.max_dx = $bar.getWidth() - $bar_progress.getWidth();
      });
      const range_positions = this.config.ignored_positions.map((d) => [
        d,
        d + this.config.column_width
      ]);
      $.on(this.$svg, "mousemove", (e) => {
        if (!is_resizing) return;
        let now_x = e.offsetX || e.layerX;
        let moving_right = now_x > x_on_start;
        if (moving_right) {
          let k = range_positions.find(
            ([begin, end]) => now_x >= begin && now_x < end
          );
          while (k) {
            now_x = k[1];
            k = range_positions.find(
              ([begin, end]) => now_x >= begin && now_x < end
            );
          }
        } else {
          let k = range_positions.find(
            ([begin, end]) => now_x > begin && now_x <= end
          );
          while (k) {
            now_x = k[0];
            k = range_positions.find(
              ([begin, end]) => now_x > begin && now_x <= end
            );
          }
        }
        let dx = now_x - x_on_start;
        if (dx > $bar_progress.max_dx) {
          dx = $bar_progress.max_dx;
        }
        if (dx < $bar_progress.min_dx) {
          dx = $bar_progress.min_dx;
        }
        $bar_progress.setAttribute("width", $bar_progress.owidth + dx);
        $.attr(bar.$handle_progress, "cx", $bar_progress.getEndX());
        $bar_progress.finaldx = dx;
      });
      $.on(this.$svg, "mouseup", () => {
        is_resizing = false;
        if (!($bar_progress && $bar_progress.finaldx)) return;
        $bar_progress.finaldx = 0;
        bar.progress_changed();
        bar.set_action_completed();
        bar = null;
        $bar_progress = null;
        $bar = null;
      });
    }
    get_all_dependent_tasks(task_id) {
      let out = [];
      let to_process = [task_id];
      while (to_process.length) {
        const deps = to_process.reduce((acc, curr) => {
          acc = acc.concat(this.dependency_map[curr]);
          return acc;
        }, []);
        out = out.concat(deps);
        to_process = deps.filter((d) => !to_process.includes(d));
      }
      return out.filter(Boolean);
    }
    get_snap_position(dx, ox) {
      let unit_length = 1;
      const default_snap = this.options.snap_at || this.config.view_mode.snap_at || "1d";
      if (default_snap !== "unit") {
        const { duration, scale } = date_utils.parse_duration(default_snap);
        unit_length = date_utils.convert_scales(this.config.view_mode.step, scale) / duration;
      }
      const rem = dx % (this.config.column_width / unit_length);
      let final_dx = dx - rem + (rem < this.config.column_width / unit_length * 2 ? 0 : this.config.column_width / unit_length);
      let final_pos = ox + final_dx;
      const drn = final_dx > 0 ? 1 : -1;
      let ignored_regions = this.get_ignored_region(final_pos, drn);
      while (ignored_regions.length) {
        final_pos += this.config.column_width * drn;
        ignored_regions = this.get_ignored_region(final_pos, drn);
        if (!ignored_regions.length)
          final_pos -= this.config.column_width * drn;
      }
      return final_pos - ox;
    }
    get_ignored_region(pos, drn = 1) {
      if (drn === 1) {
        return this.config.ignored_positions.filter((val) => {
          return pos > val && pos <= val + this.config.column_width;
        });
      } else {
        return this.config.ignored_positions.filter(
          (val) => pos >= val && pos < val + this.config.column_width
        );
      }
    }
    unselect_all() {
      if (this.popup) this.popup.parent.classList.add("hide");
      this.$container.querySelectorAll(".date-range-highlight").forEach((k) => k.classList.add("hide"));
    }
    view_is(modes) {
      if (typeof modes === "string") {
        return this.config.view_mode.name === modes;
      }
      if (Array.isArray(modes)) {
        return modes.some(view_is);
      }
      return this.config.view_mode.name === modes.name;
    }
    get_task(id) {
      return this.tasks.find((task) => {
        return task.id === id;
      });
    }
    get_bar(id) {
      return this.bars.find((bar) => {
        return bar.task.id === id;
      });
    }
    // >>> SR: Hover click popup -----------------------------------------------
    /**
     * Checks whether hover popups should support click pinning.
     */
    is_hover_popup_enabled() {
      return this.options.popup_on === "hover";
    }
    /**
     * Checks whether a hover popup is currently pinned by a bar click.
     */
    is_popup_locked_by_click() {
      return this.is_hover_popup_enabled() && this._popup_locked_by_click;
    }
    /**
     * Pins the current popup so hover leave events do not close it.
     */
    lock_popup_on_click() {
      if (this.is_hover_popup_enabled()) {
        this._popup_locked_by_click = true;
      }
    }
    /**
     * Restores hover behavior after a pinned hover popup.
     */
    unlock_popup_on_click() {
      this._popup_locked_by_click = false;
    }
    /**
     * Checks whether a document click target belongs to a task bar or its handle.
     */
    is_bar_popup_target(target) {
      return !!target?.closest?.(".bar-wrapper, .handle");
    }
    // <<< SR: Hover click popup -----------------------------------------------
    show_popup(opts) {
      if (this.options.popup === false) return;
      if (!this.popup) {
        this.popup = new Popup(
          this.$popup_wrapper,
          this.options.popup,
          this
        );
      }
      this.popup.show(opts);
    }
    hide_popup() {
      this.popup && this.popup.hide();
    }
    trigger_event(event, args) {
      if (this.options["on_" + event]) {
        this.options["on_" + event].apply(this, args);
      }
    }
    /**
     * Gets the oldest starting date from the list of tasks
     *
     * @returns Date
     * @memberof Gantt
     */
    get_oldest_starting_date() {
      if (!this.tasks.length) return /* @__PURE__ */ new Date();
      return this.tasks.map((task) => task._start).reduce(
        (prev_date, cur_date) => cur_date <= prev_date ? cur_date : prev_date
      );
    }
    /**
     * Clear all elements from the parent svg element
     *
     * @memberof Gantt
     */
    clear() {
      this.$svg.innerHTML = "";
      this.$header?.remove?.();
      this.$side_header?.remove?.();
      this.$current_highlight?.remove?.();
      this.$extras?.remove?.();
      this.popup?.hide?.();
    }
    // >>> SR: Aggregation popup Gantt ----------------------------------------
    /**
     * Removes global listeners and DOM nodes created by this Gantt instance.
     * This is mainly used for nested Gantt charts rendered inside aggregation
     * popups, which are recreated whenever the popup content changes.
     */
    destroy() {
      if (this._onDocumentMouseup) {
        document.removeEventListener("mouseup", this._onDocumentMouseup);
        this._onDocumentMouseup = null;
      }
      if (this._onDocClick) {
        document.removeEventListener("mousedown", this._onDocClick, true);
        this._onDocClick = null;
      }
      this.$container?.remove?.();
    }
    // <<< SR: Aggregation popup Gantt ----------------------------------------
    // >>> SR: Bar Aggregation ---------------------------------------------------
    // >>> SR: Date calculation Fix ----------------------------------------------
    get_infinite_padding_extend_units() {
      const extend_units = Math.max(1, this.config.extend_by_units || 1);
      const step_units = Math.max(1, this.config.step || 1);
      if (this.config.unit === "day" && step_units > 1) {
        return Math.ceil(extend_units / step_units) * step_units;
      }
      return extend_units;
    }
    get_infinite_padding_extend_width(extend_units) {
      return extend_units / this.config.step * this.config.column_width;
    }
    maybe_extend_infinite_padding(container = this.$container) {
      if (!this.options.infinite_padding || this._extending_infinite_padding) {
        return false;
      }
      const trigger = container.scrollWidth / 2;
      const extend_units = this.get_infinite_padding_extend_units();
      if (container.scrollLeft <= trigger) {
        const old_scroll_left = container.scrollLeft;
        this._extending_infinite_padding = true;
        this.gantt_start = date_utils.add(
          this.gantt_start,
          -extend_units,
          this.config.unit
        );
        this.setup_date_values();
        this.render();
        container.scrollLeft = old_scroll_left + this.get_infinite_padding_extend_width(extend_units);
        setTimeout(() => this._extending_infinite_padding = false, 300);
        return true;
      }
      if (container.scrollWidth - (container.scrollLeft + container.clientWidth) <= trigger) {
        const old_scroll_left = container.scrollLeft;
        this._extending_infinite_padding = true;
        this.gantt_end = date_utils.add(
          this.gantt_end,
          extend_units,
          this.config.unit
        );
        this.setup_date_values();
        this.render();
        container.scrollLeft = old_scroll_left;
        setTimeout(() => this._extending_infinite_padding = false, 300);
        return true;
      }
      return false;
    }
    should_align_to_week_start() {
      return this.config.unit === "day" && this.config.step % 7 === 0;
    }
    get_week_start_day() {
      const start_of_week = String(this.options.start_of_week || "monday").trim().toLowerCase();
      if (start_of_week === "sunday" || start_of_week === "sonntag") {
        return 0;
      }
      return 1;
    }
    align_to_week_start(date) {
      const aligned = date_utils.clone(date);
      const start_day = this.get_week_start_day();
      const days_since_week_start = (aligned.getDay() - start_day + 7) % 7;
      return date_utils.add(aligned, -days_since_week_start, "day");
    }
    // >>> SR: include_today_in_padding ------------------------------------------
    should_include_today_in_padding() {
      return Boolean(this.options.include_today_in_padding);
    }
    extend_gantt_range_to_include_today() {
      if (!this.should_include_today_in_padding()) return;
      const today_start = date_utils.today();
      const today_end = date_utils.add(today_start, 1, "day");
      const today_scroll_start = this.get_today_scroll_padding_start_date(today_start);
      if (today_scroll_start < this.gantt_start) {
        this.gantt_start = date_utils.start_of(today_scroll_start, this.config.unit);
      }
      if (today_end > this.gantt_end) {
        this.gantt_end = today_end;
      }
    }
    // >>> SR: Today button left scroll padding ---------------------------------
    /**
     * Returns the earliest date that must be included when today is added to the
     * rendered Gantt range. This keeps enough left-side room for the Today button
     * scroll padding if today was outside the original task interval.
     * @param today_start
     * @returns {Date}
     */
    get_today_scroll_padding_start_date(today_start) {
      const padding = this.get_today_button_left_scroll_padding?.();
      if (!padding) return today_start;
      return date_utils.add(today_start, -padding.duration, padding.scale);
    }
    // <<< SR: Today button left scroll padding ---------------------------------
    get_date_tick_for_date(date) {
      if (!this.dates?.length) return null;
      for (let i = this.dates.length - 1; i >= 0; i--) {
        if (this.dates[i] <= date) {
          return this.dates[i];
        }
      }
      return this.dates[0];
    }
    // <<< SR: include_today_in_padding ------------------------------------------
    get_position_by_date(date) {
      if (!date) return 0;
      if (this.config.unit === "month") {
        const gantt_month_start = date_utils.start_of(this.gantt_start, "month");
        const date_month_start = date_utils.start_of(date, "month");
        const month_diff = (date_month_start.getFullYear() - gantt_month_start.getFullYear()) * 12 + (date_month_start.getMonth() - gantt_month_start.getMonth());
        const day_offset = date.getDate() - 1 + date.getHours() / 24 + date.getMinutes() / 1440 + date.getSeconds() / 86400 + date.getMilliseconds() / 864e5;
        return (month_diff + day_offset / date_utils.get_days_in_month(date)) * this.config.column_width;
      }
      if (this.config.unit === "year") {
        const gantt_year_start = date_utils.start_of(this.gantt_start, "year");
        const date_year_start = date_utils.start_of(date, "year");
        const year_diff = date_year_start.getFullYear() - gantt_year_start.getFullYear();
        const day_offset = date_utils.diff(date, date_year_start, "day") + date.getHours() / 24 + date.getMinutes() / 1440 + date.getSeconds() / 86400 + date.getMilliseconds() / 864e5;
        return (year_diff + day_offset / date_utils.get_days_in_year(date)) * this.config.column_width;
      }
      const diff_in_units = date_utils.diff(date, this.gantt_start, this.config.unit);
      return diff_in_units / this.config.step * this.config.column_width;
    }
    // >>> SR: Date calculation after change fix ---------------------------------
    get_date_by_position(x) {
      if (!x) return date_utils.clone(this.gantt_start);
      const units = x / this.config.column_width * this.config.step;
      if (this.config.unit === "month") {
        return this.get_date_by_month_position(units);
      }
      if (this.config.unit === "year") {
        return this.get_date_by_year_position(units);
      }
      return this.add_precise_units(this.gantt_start, units, this.config.unit);
    }
    get_date_by_month_position(month_units) {
      const gantt_month_start = date_utils.start_of(this.gantt_start, "month");
      const whole_months = Math.floor(month_units);
      const month_fraction = month_units - whole_months;
      const month_start = date_utils.add(gantt_month_start, whole_months, "month");
      const day_offset = month_fraction * date_utils.get_days_in_month(month_start);
      return this.add_precise_units(month_start, day_offset, "day");
    }
    get_date_by_year_position(year_units) {
      const gantt_year_start = date_utils.start_of(this.gantt_start, "year");
      const whole_years = Math.floor(year_units);
      const year_fraction = year_units - whole_years;
      const year_start = date_utils.add(gantt_year_start, whole_years, "year");
      const day_offset = year_fraction * date_utils.get_days_in_year(year_start);
      return this.add_precise_units(year_start, day_offset, "day");
    }
    add_precise_units(date, qty, unit) {
      const MS_PER_UNIT = {
        millisecond: 1,
        second: 1e3,
        minute: 60 * 1e3,
        hour: 60 * 60 * 1e3,
        day: 24 * 60 * 60 * 1e3
      };
      const ms_per_unit = MS_PER_UNIT[unit];
      if (ms_per_unit) {
        return new Date(date.getTime() + qty * ms_per_unit);
      }
      return date_utils.add(date, qty, unit);
    }
    // <<< SR: Date calculation after change fix ---------------------------------
    // <<< SR: Date calculation Fix ----------------------------------------------
    /**
     * It computes the row and lane allocation for all tasks.
     */
    compute_rows_and_lanes() {
      this.tasks.forEach((t) => {
        t._rowKey = t.lineIndex !== void 0 ? t.lineIndex : t._index;
      });
      const rowMap = /* @__PURE__ */ new Map();
      this.tasks.forEach((t) => {
        if (!rowMap.has(t._rowKey)) rowMap.set(t._rowKey, []);
        rowMap.get(t._rowKey).push(t);
      });
      let rows;
      if (Array.isArray(this.options.row_keys) && this.options.row_keys.length) {
        rows = this.options.row_keys.slice();
      } else {
        rows = Array.from(rowMap.keys()).sort(
          (a, b) => a > b ? 1 : a < b ? -1 : 0
        );
      }
      const rowMeta = [];
      rows.forEach((rowKey, rowIndex) => {
        const list = (rowMap.get(rowKey) || []).slice().sort((a, b) => +a._start - +b._start);
        const laneEnds = [];
        list.forEach((task) => {
          let lane = 0;
          while (lane < laneEnds.length && !(laneEnds[lane] <= task._start)) lane++;
          task._lane = lane;
          task._rowIndex = rowIndex;
          laneEnds[lane] = task._end;
        });
        list.forEach((task) => {
          const overlapping = list.filter(
            (t) => (
              // classical interval overlap: [start_a, end_a) ∩ [start_b, end_b) ≠ ∅
              t !== task && t._start < task._end && task._start < t._end
            )
          );
          const lanesSet = /* @__PURE__ */ new Set([task._lane, ...overlapping.map((t) => t._lane)]);
          task._clusterLanes = Math.max(1, lanesSet.size);
        });
        rowMeta.push({
          key: rowKey,
          index: rowIndex,
          lanes: Math.max(1, laneEnds.length),
          height: this.options.row_height
        });
      });
      let cum = 0;
      rowMeta.forEach((r) => {
        r.top = cum;
        cum += r.height;
      });
      this._rows = rows;
      this._rowMeta = rowMeta;
    }
    /**
     * It aggregates overlapping tasks into one special aggregation bar.
     */
    compute_overlap_aggregates() {
      this.tasks.forEach((t) => {
        t._hidden = false;
        t._isAggregate = false;
        t._aggMembers = void 0;
        t._aggregatedBy = void 0;
      });
      this._aggregateBars = [];
      const byEndStartId = (a, b) => {
        if (+a._end !== +b._end) return +a._end - +b._end;
        if (+a._start !== +b._start) return +a._start - +b._start;
        const ia = isFinite(+a.id) ? +a.id : String(a.id);
        const ib = isFinite(+b.id) ? +b.id : String(b.id);
        return ia > ib ? 1 : ia < ib ? -1 : 0;
      };
      const hasPriority = (task) => Number.isFinite(Number(task?.priority));
      const overlaps = (a, b) => a._start < b._end && b._start < a._end;
      const byPriorityThenEndStartId = (a, b) => {
        const aHasPriority = hasPriority(a);
        const bHasPriority = hasPriority(b);
        if (aHasPriority || bHasPriority) {
          if (aHasPriority && bHasPriority) {
            const priorityDiff = Number(b.priority) - Number(a.priority);
            if (priorityDiff !== 0) return priorityDiff;
          } else {
            return aHasPriority ? -1 : 1;
          }
        }
        return byEndStartId(a, b);
      };
      const selectUpperLanes = (listRaw, upperLaneCount) => {
        const rowHasPriority = listRaw.some(hasPriority);
        const candidates = listRaw.slice().sort(
          rowHasPriority ? byPriorityThenEndStartId : byEndStartId
        );
        const lanes = Array.from({ length: upperLaneCount }, () => []);
        if (rowHasPriority) {
          for (const t of candidates) {
            const targetLaneIndex = lanes.findIndex(
              (lane) => !lane.some((selected) => overlaps(selected, t))
            );
            if (targetLaneIndex !== -1) {
              lanes[targetLaneIndex].push(t);
              t._lane = targetLaneIndex;
            }
          }
        } else {
          const remaining = new Set(candidates);
          lanes.forEach((lane, laneIndex) => {
            let lastEnd = null;
            for (const t of candidates) {
              if (!remaining.has(t)) continue;
              if (lastEnd == null || t._start >= lastEnd) {
                lane.push(t);
                t._lane = laneIndex;
                lastEnd = t._end;
                remaining.delete(t);
              }
            }
          });
        }
        return lanes.flat().sort(byStartThenId);
      };
      const byStartThenId = (a, b) => {
        if (+a._start !== +b._start) return +a._start - +b._start;
        const ia = isFinite(+a.id) ? +a.id : String(a.id);
        const ib = isFinite(+b.id) ? +b.id : String(b.id);
        return ia > ib ? 1 : ia < ib ? -1 : 0;
      };
      const fmt = this.options.date_format || "YYYY-MM-dd";
      const rows = /* @__PURE__ */ new Map();
      this.tasks.forEach((t) => {
        const key = t._rowIndex != null ? t._rowIndex : t._index;
        if (!rows.has(key)) rows.set(key, []);
        rows.get(key).push(t);
      });
      for (const [rowIndex, listRaw] of rows.entries()) {
        if (!listRaw.length) continue;
        const bottomLane = this.get_aggregation_lane_index();
        const topLane = selectUpperLanes(listRaw, bottomLane);
        const topSet = new Set(topLane);
        const hidden = listRaw.filter((t) => !topSet.has(t));
        topLane.forEach((t) => {
          t._rowIndex = rowIndex;
        });
        const rowHasAggregates = hidden.length > 0;
        if (!rowHasAggregates) {
          topLane.forEach((t) => {
            t._clusterLanes = 1;
          });
          continue;
        }
        hidden.sort(byStartThenId);
        const aggs = [];
        let curStart = null, curEnd = null;
        let curMembers = /* @__PURE__ */ new Set();
        const flush = () => {
          if (!curStart) return;
          const membersArr = Array.from(curMembers);
          if (membersArr.length >= 2) {
            let minStart = membersArr[0]._start, maxEnd = membersArr[0]._end;
            for (const m of membersArr) {
              const orig_end = m._end;
              if (m._start < minStart) minStart = m._start;
              if (orig_end > maxEnd) maxEnd = orig_end;
            }
            const agg = {
              id: `agg_${rowIndex}_${this._aggregateBars.length + aggs.length}`,
              name: `+${membersArr.length}`,
              start: date_utils.format(minStart, fmt),
              //TODO SR: Check if it is needed for the time formating
              end: date_utils.format(maxEnd, fmt),
              /*              end: this.options.step >= 24 && (this.options.step % 24) === 0
                                ? date_utils.format(date_utils.add(maxEnd, -24, 'hour'), fmt)
                                : date_utils.format(date_utils.add(maxEnd, -1, 'second'), fmt),*/
              _start: minStart,
              _end: maxEnd,
              _rowIndex: rowIndex,
              // >>> SR: Configurable row lanes -------------------------------
              _lane: bottomLane,
              // always at the configured bottom lane
              _clusterLanes: this.options.row_lanes,
              // (Relayout sets real value later)
              // <<< SR: Configurable row lanes -------------------------------
              lineIndex: membersArr[0].lineIndex,
              draggable: false,
              progress: 0,
              // standard colors for aggregates
              color: "#d2d2ef",
              colorHover: "#c1c1dd",
              progressColor: "#a3a3ff",
              textColor: "#fff",
              custom_class: "aggregate",
              _isAggregate: true,
              _members: membersArr.map((m) => ({
                id: m.id,
                name: m.name,
                _start: m._start,
                _end: m._end,
                end: m.end,
                //TODO SR: Date without hours fix. Test it.
                color: m.color,
                // >>> SR: Priority aggregation top lane ----------------------
                priority: m.priority,
                // <<< SR: Priority aggregation top lane ----------------------
                actual_duration: m.actual_duration,
                //TODO SR: It is undefined here because it is only set under "bar.compute_duration()".
                ignored_duration: m.ignored_duration
                //TODO SR: It is undefined here because it is only set under "bar.compute_duration()".
              })),
              _memberNames: membersArr.map((m) => m.name)
            };
            membersArr.forEach((m) => {
              m._hidden = true;
              m._aggregatedBy = agg.id;
            });
            aggs.push(agg);
          } else if (membersArr.length === 1) {
            const single = membersArr[0];
            single._hidden = false;
            single._aggregatedBy = void 0;
            single._lane = bottomLane;
            single._rowIndex = rowIndex;
          }
          curStart = curEnd = null;
          curMembers.clear();
        };
        for (const t of hidden) {
          if (curStart == null) {
            curStart = t._start;
            curEnd = t._end;
            curMembers.add(t);
          } else if (t._start < curEnd) {
            if (t._end > curEnd) curEnd = t._end;
            curMembers.add(t);
          } else {
            flush();
            curStart = t._start;
            curEnd = t._end;
            curMembers.add(t);
          }
        }
        flush();
        this._aggregateBars.push(...aggs);
      }
    }
    /**
     * It re-calculates the visible rows, lanes and cluster sizes after aggregation.
     */
    relayout_visible_rows() {
      const visible = this.tasks.filter((t) => !t._hidden).concat(this._aggregateBars || []);
      const rowMap = /* @__PURE__ */ new Map();
      visible.forEach((t) => {
        const key = t._rowIndex != null ? t._rowIndex : t._index;
        if (!rowMap.has(key)) rowMap.set(key, []);
        rowMap.get(key).push(t);
      });
      const idKey = (t) => Number.isFinite(+t.id) ? +t.id : String(t.id);
      const byStartThenId = (a, b) => {
        const da = +a._start, db = +b._start;
        if (da !== db) return da - db;
        const ia = idKey(a), ib = idKey(b);
        return ia > ib ? 1 : ia < ib ? -1 : 0;
      };
      rowMap.forEach((list, rowIndex) => {
        list.forEach((t) => {
          t._rowIndex = rowIndex;
          t._lane = Number.isInteger(t._lane) ? t._lane : void 0;
          t._clusterLanes = 1;
        });
        const overlaps = (a, b) => a._start < b._end && b._start < a._end;
        const aggs = list.filter((t) => t._isAggregate === true);
        const topsAll = list.filter((t) => !t._isAggregate).sort(byStartThenId);
        const bottomLane = this.get_aggregation_lane_index();
        const upperLaneCount = bottomLane;
        aggs.forEach((a) => {
          a._lane = bottomLane;
          a._clusterLanes = this.options.row_lanes;
        });
        const hitAgg = [];
        const noAgg = [];
        topsAll.forEach((t) => (aggs.some((a) => overlaps(t, a)) ? hitAgg : noAgg).push(t));
        const laneTasks = /* @__PURE__ */ new Map();
        const assignToLane = (task, lane) => {
          task._lane = lane;
          if (!laneTasks.has(lane)) laneTasks.set(lane, []);
          laneTasks.get(lane).push(task);
        };
        aggs.forEach((a) => assignToLane(a, bottomLane));
        hitAgg.forEach((t) => {
          const lane = Number.isInteger(t._lane) && t._lane < upperLaneCount ? t._lane : 0;
          assignToLane(t, lane);
        });
        const placeInFirstFreeLane = (t) => {
          let lane = 0;
          while (lane < this.options.row_lanes) {
            const arr = laneTasks.get(lane) || [];
            const collides = arr.some((x) => overlaps(t, x));
            if (!collides) {
              assignToLane(t, lane);
              break;
            }
            lane++;
          }
          if (t._lane == null) {
            assignToLane(t, bottomLane);
          }
        };
        const unassignedNoAgg = [];
        const noAggWithLane = noAgg.filter(
          (t) => Number.isInteger(t._lane) && t._lane < this.options.row_lanes
        );
        const noAggWithoutLane = noAgg.filter((t) => !noAggWithLane.includes(t));
        noAggWithLane.sort((a, b) => a._lane - b._lane || byStartThenId(a, b)).forEach((t) => {
          const arr = laneTasks.get(t._lane) || [];
          if (!arr.some((x) => overlaps(t, x))) {
            assignToLane(t, t._lane);
          } else {
            t._lane = void 0;
            unassignedNoAgg.push(t);
          }
        });
        noAggWithoutLane.concat(unassignedNoAgg).sort(byStartThenId).forEach(placeInFirstFreeLane);
        const visible2 = list;
        visible2.forEach((t) => {
          const sameRow = visible2.filter((o) => o !== t && overlaps(o, t));
          const overlappingLanes = [t._lane, ...sameRow.map((o) => o._lane)].filter((lane) => Number.isInteger(lane));
          t._clusterLanes = Math.max(0, ...overlappingLanes) + 1;
        });
      });
    }
    // >>> SR: Configurable row lanes -----------------------------------------
    /**
     * Returns the lane index reserved for single lower-row tasks or aggregate
     * bars. The value depends on the configured row_lanes option.
     */
    get_aggregation_lane_index() {
      return Math.max(1, this.options.row_lanes - 1);
    }
    // <<< SR: Configurable row lanes -----------------------------------------
    /**
     * Gets the total content height based on the number of rows and row height
     * @returns {number}
     */
    get_content_height() {
      return (this._rows?.length || 0) * this.options.row_height;
    }
    /**
     * Binds the outside click to hide popups and unselect tasks.
     */
    bind_outside_click() {
      this._onDocClick = (e) => {
        if (this.bar_being_dragged) return;
        const container = this.$container;
        const target = e.target;
        if (this.is_hover_popup_enabled() && !this.is_bar_popup_target(target) && !this.$popup_wrapper?.contains(target)) {
          this.unlock_popup_on_click();
          this.hide_popup();
        }
        if (container && container.contains(target) || this.$popup_wrapper?.contains(target)) return;
        this.hide_popup();
        this.unselect_all();
      };
      document.addEventListener("mousedown", this._onDocClick, true);
    }
    // <<< SR: Bar Aggregation ---------------------------------------------------
  }
  Gantt.VIEW_MODE = {
    // >>> SR: Bar Aggregation ---------------------------------------------------
    // It currently doesn't work properly with PowerUI
    /*    HOUR: DEFAULT_VIEW_MODES[0],
        QUARTER_DAY: DEFAULT_VIEW_MODES[1],
        HALF_DAY: DEFAULT_VIEW_MODES[2],*/
    // <<< SR: Bar Aggregation ---------------------------------------------------
    DAY: DEFAULT_VIEW_MODES[0],
    WEEK: DEFAULT_VIEW_MODES[1],
    MONTH: DEFAULT_VIEW_MODES[2],
    YEAR: DEFAULT_VIEW_MODES[3]
  };
  function generate_id(task) {
    return task.name + "_" + Math.random().toString(36).slice(2, 12);
  }
  function sanitize(s) {
    return s.replaceAll(" ", "_").replaceAll(":", "_").replaceAll(".", "_");
  }
  return Gantt;
}));
//# sourceMappingURL=riel-gantt.umd.js.map
