// Class Notes checker: rule-based flags for the Peddie Chronicle Class Notes style guide.
// Every rule returns candidate issues; the editor makes the final call on each one.
//
// Issue shape: { rule, start, end, text, fix, note }
//   fix  — suggested replacement for text (omitted when the rule can only flag)
//   note — optional extra context shown with the flag

(function (root) {
  "use strict";

  const MONTHS = "January|February|March|April|May|June|July|August|September|October|November|December";

  // AP abbreviations, keyed by postal code and full name. null = never abbreviated.
  const STATES = [
    ["AL", "Alabama", "Ala."], ["AK", "Alaska", null], ["AZ", "Arizona", "Ariz."],
    ["AR", "Arkansas", "Ark."], ["CA", "California", "Calif."], ["CO", "Colorado", "Colo."],
    ["CT", "Connecticut", "Conn."], ["DE", "Delaware", "Del."], ["FL", "Florida", "Fla."],
    ["GA", "Georgia", "Ga."], ["HI", "Hawaii", null], ["ID", "Idaho", null],
    ["IL", "Illinois", "Ill."], ["IN", "Indiana", "Ind."], ["IA", "Iowa", null],
    ["KS", "Kansas", "Kan."], ["KY", "Kentucky", "Ky."], ["LA", "Louisiana", "La."],
    ["ME", "Maine", null], ["MD", "Maryland", "Md."], ["MA", "Massachusetts", "Mass."],
    ["MI", "Michigan", "Mich."], ["MN", "Minnesota", "Minn."], ["MS", "Mississippi", "Miss."],
    ["MO", "Missouri", "Mo."], ["MT", "Montana", "Mont."], ["NE", "Nebraska", "Neb."],
    ["NV", "Nevada", "Nev."], ["NH", "New Hampshire", "N.H."], ["NJ", "New Jersey", "N.J."],
    ["NM", "New Mexico", "N.M."], ["NY", "New York", "N.Y."], ["NC", "North Carolina", "N.C."],
    ["ND", "North Dakota", "N.D."], ["OH", "Ohio", null], ["OK", "Oklahoma", "Okla."],
    ["OR", "Oregon", "Ore."], ["PA", "Pennsylvania", "Pa."], ["RI", "Rhode Island", "R.I."],
    ["SC", "South Carolina", "S.C."], ["SD", "South Dakota", "S.D."], ["TN", "Tennessee", "Tenn."],
    ["TX", "Texas", null], ["UT", "Utah", null], ["VT", "Vermont", "Vt."],
    ["VA", "Virginia", "Va."], ["WA", "Washington", "Wash."], ["WV", "West Virginia", "W.Va."],
    ["WI", "Wisconsin", "Wis."], ["WY", "Wyoming", "Wyo."],
  ];
  const BY_POSTAL = Object.fromEntries(STATES.map(([p, n, ap]) => [p, { name: n, ap }]));
  const BY_NAME = Object.fromEntries(STATES.map(([p, n, ap]) => [n, { name: n, ap }]));

  const SMALL = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
  const BIG_WORDS = {
    ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16,
    seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50,
    sixty: 60, seventy: 70, eighty: 80, ninety: 90,
  };
  const UNITS = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9 };

  // Words after a single digit that mean the digit should stay a digit (AP exceptions).
  const DIGIT_OK_AFTER = new RegExp(
    "^(?:percent|p\\.m\\.|a\\.m\\.|pm|am|o'clock|mph|feet|foot|ft|inches|inch|miles?|km|" +
    "kilometers?|meters?|pounds?|lbs?|ounces?|degrees?|million|billion|trillion|" +
    "points?|goals?|runs?|strokes?|wins?|losses?|seed|under|over|to|-|–|x)(?![a-z])", "i"
  );
  // Words before a single digit that keep it a digit (No. 3, Room 4, page 7, scores...).
  const DIGIT_OK_BEFORE = /(?:No\.|Room|room|page|Page|Chapter|chapter|Grade|grade|Apt\.|Suite|Route|Rte\.|Highway|Exit|exit|Section|section|Volume|Vol\.|Act|Psalm|Class|class|Level|level|Track|Gate|Pier|Platform|Ward|Unit|unit|Floor|floor|Hole|hole|Game|game|Week|week|Day|day|Phase|phase|Step|step|age|ages|aged|\$|#|£|€|[\d.,:/–-])\s?$/;

  // Plural nouns that show a 1000–2100 number is a count, not a year: "1000 miles".
  const COUNT_NOUN = /^ (?:miles|people|feet|students|alumni|members|acres|dollars|copies|runners|participants|guests|books|words|pages|hours|meters|kilometers|yards|calories|points|followers|subscribers|employees|families|children|donors|units|homes|trees|years|days|square|attendees|athletes|volunteers|patients|kids|hits|views|votes|signatures|steps|seats|rooms|cases|items|pieces)\b/;

  const QUOTED_PERIODICALS = [
    "The New York Times", "New York Times", "The Wall Street Journal", "Wall Street Journal",
    "The Washington Post", "Washington Post", "The New Yorker", "Time", "Newsweek",
    "The Atlantic", "Forbes", "Fortune", "The Boston Globe", "Boston Globe",
    "Los Angeles Times", "USA Today", "The Economist", "Sports Illustrated",
    "The Star-Ledger", "Star-Ledger", "Trenton Times", "The Trenton Times",
    "Chicago Tribune", "Philadelphia Inquirer", "The Philadelphia Inquirer",
    "Peddie Chronicle", "The Peddie Chronicle", "Chronicle", "People", "Vogue", "Bloomberg",
  ];

  // Countries and states that close an appositive ("Valencia, Spain, and…").
  const PLACES = new RegExp("^(?:" + [
    "Spain", "France", "Italy", "Germany", "England", "Scotland", "Ireland", "Wales", "Canada", "Mexico",
    "Japan", "China", "India", "Israel", "Greece", "Portugal", "Switzerland", "Austria", "Australia",
    "Brazil", "Argentina", "Chile", "Peru", "Colombia", "Korea", "South Korea", "Vietnam", "Thailand",
    "Netherlands", "Belgium", "Denmark", "Sweden", "Norway", "Finland", "Poland", "Kenya", "Nigeria",
    "Egypt", "Morocco", "Turkey", "Singapore", "Taiwan", "Hong Kong", "Philippines", "Indonesia",
    "New Zealand", "Costa Rica", "Puerto Rico", "the Netherlands", "Ontario", "Quebec", "British Columbia",
    "Alberta", "D.C.", "Alaska", "Hawaii", "Idaho", "Iowa", "Maine", "Ohio", "Texas", "Utah",
  ].join("|") + ")$");

  const MAJORS = [
    "History", "Biology", "Chemistry", "Physics", "Economics", "Mathematics", "Math",
    "Psychology", "Sociology", "Philosophy", "Political Science", "Engineering", "Art History",
    "Computer Science", "Anthropology", "Geology", "Music", "Theater", "Theatre", "Finance",
    "Accounting", "Marketing", "Nursing", "Neuroscience", "Classics", "Government",
    "Environmental Science", "Architecture", "Journalism", "Communications", "Art",
  ];
  const PROPER_MAJORS = ["english", "french", "spanish", "german", "italian", "chinese",
    "japanese", "russian", "latin", "greek", "arabic", "hebrew", "portuguese", "korean",
    "american studies", "african american studies", "east asian studies", "latin american studies"];

  // ---------- helpers ----------

  function* matches(rx, text) {
    rx.lastIndex = 0;
    let m;
    while ((m = rx.exec(text))) {
      yield m;
      if (m[0] === "") rx.lastIndex++;
    }
  }

  function issue(rule, start, text, fix, note) {
    const o = { rule, start, end: start + text.length, text };
    if (fix !== undefined && fix !== null && fix !== text) o.fix = fix;
    if (note) o.note = note;
    return o;
  }

  // Start of a sentence: beginning of text/paragraph, or after . ! ? (optionally closing quote).
  function atSentenceStart(text, i) {
    const before = text.slice(Math.max(0, i - 4), i);
    return i === 0 || /(?:^|\n)\s*$/.test(text.slice(Math.max(0, i - 3), i)) ||
      /[.!?]["”’)]?\s+$/.test(before) && !/\b(?:Mr|Mrs|Ms|Dr|St|No|Jr|Sr)\.\s+$/.test(text.slice(Math.max(0, i - 6), i));
  }

  // Replacing a state with an abbreviation (or an abbreviation with a full name) changes how
  // the period and a following comma work. Work out the exact span and replacement.
  //   "Newark, NJ with"  → "N.J., with"     "Austin, TX."   → "Texas."
  //   "Princeton, New Jersey." → "N.J."    "Austin, Tex. in" → "Texas, in"
  function stateFix(t, start, end, replacement) {
    let text = t.slice(start, end);
    const after = t.slice(end);
    const endsSentence = /^\.(?=\s+["“]?[A-Z]|\s*$|["”’)])/.test(after) || (text.endsWith(".") && /^(?:\s+["“]?[A-Z]|\s*$|["”’)])/.test(after));
    const continues = /^\.?\s+(?!and\b|or\b)[a-z]/.test(after) || (!text.endsWith(".") && /^\s+(?!and\b|or\b)[a-z]/.test(after));
    if (after.startsWith(".") && !text.endsWith(".")) {
      text += "."; // absorb the sentence period so we don't produce "N.J.."
      return { text, fix: replacement.endsWith(".") ? replacement : replacement + "." };
    }
    if (endsSentence && text.endsWith(".") && !replacement.endsWith(".")) return { text, fix: replacement + "." };
    if (continues && !/^,/.test(after)) return { text, fix: replacement + "," };
    return { text, fix: replacement };
  }

  // ---------- rules ----------

  const RULES = [];
  function rule(def) { RULES.push(def); }

  rule({
    id: "double-space",
    name: "One space after periods",
    group: "Mechanical",
    explain: "Use a single space between sentences.",
    find(t) {
      const out = [];
      // Pasted text often carries non-breaking spaces (\u00a0), so count those as spaces too.
      for (const m of matches(/([.!?:;,]["”’)]?)([ \u00a0]{2,})(?=\S)/g, t)) {
        out.push(issue(this.id, m.index + m[1].length, m[2], " "));
      }
      return out;
    },
  });

  rule({
    id: "extra-space",
    name: "Extra spaces",
    group: "Mechanical",
    explain: "Use one space between words, including around a dash.",
    find(t) {
      const out = [];
      for (const m of matches(/(?<=\S)[ \u00a0]{2,}(?=\S)/g, t)) {
        if (/[.!?:;,]["”’)]?$/.test(t.slice(0, m.index))) continue; // the one-space-after-periods rule
        const dash = /[—–]$/.test(t.slice(0, m.index)) || /^[—–]/.test(t.slice(m.index + m[0].length));
        out.push(issue(this.id, m.index, m[0], " ", dash ? "Extra space next to a dash." : null));
      }
      return out;
    },
  });

  rule({
    id: "class-year-apostrophe",
    name: "Apostrophe before class years",
    group: "Mechanical",
    explain: "Use a true apostrophe (’), not an opening single quote (‘) or a straight quote (').",
    find(t) {
      const out = [];
      for (const m of matches(/[‘'`´](\d{2})(?![\d’'])(?!\s*%)/g, t)) {
        // A straight quote directly after a letter is a contraction/possessive, not a class year.
        if (/[A-Za-z]$/.test(t.slice(0, m.index))) continue;
        out.push(issue(this.id, m.index, m[0], "’" + m[1]));
      }
      return out;
    },
  });

  rule({
    id: "date-ordinal",
    name: "No th/st/nd/rd on dates",
    group: "Mechanical",
    explain: "Use cardinal numbers in dates: May 15, not May 15th.",
    find(t) {
      const out = [];
      const rx = new RegExp(`\\b(${MONTHS}|Jan\\.|Feb\\.|Aug\\.|Sept\\.|Oct\\.|Nov\\.|Dec\\.) (\\d{1,2})(st|nd|rd|th)\\b`, "g");
      for (const m of matches(rx, t)) out.push(issue(this.id, m.index, m[0], `${m[1]} ${m[2]}`));
      const rx2 = new RegExp(`\\b(?:the )?(\\d{1,2})(st|nd|rd|th) of (${MONTHS})\\b`, "g");
      for (const m of matches(rx2, t)) out.push(issue(this.id, m.index, m[0], `${m[3]} ${m[1]}`));
      return out;
    },
  });

  rule({
    id: "date-comma",
    name: "Date and year commas",
    group: "Mechanical",
    explain: "Put a comma between the date and the year; if the sentence continues, also put one after the year.",
    find(t) {
      const out = [];
      const months = `(?:${MONTHS}|Jan\\.|Feb\\.|Aug\\.|Sept\\.|Oct\\.|Nov\\.|Dec\\.)`;
      for (const m of matches(new RegExp(`\\b(${months} \\d{1,2}) (\\d{4})\\b`, "g"), t)) {
        const continues = /^ (?!and\b|or\b|to\b|through\b)[a-z]/.test(t.slice(m.index + m[0].length));
        out.push(issue(this.id, m.index, m[0], `${m[1]}, ${m[2]}${continues ? "," : ""}`,
          continues ? "Missing commas: one between the date and the year, and one after the year because the sentence continues." : "Missing comma between date and year."));
      }
      for (const m of matches(new RegExp(`\\b${months} \\d{1,2}, \\d{4}(?= (?!and\\b|or\\b|to\\b|through\\b)[a-z])`, "g"), t)) {
        // Only when the date sits inside a clause the sentence keeps going after.
        out.push(issue(this.id, m.index, m[0], m[0] + ",", "The sentence continues, so the year needs a comma after it too."));
      }
      return out;
    },
  });

  rule({
    id: "numbers",
    name: "Numbers",
    group: "Mechanical",
    explain: "Spell out one through nine; use digits for 10 and above; commas in numbers of four digits or more; spell out a number that starts a sentence (except years).",
    find(t) {
      const out = [];
      // Single digits that should be spelled out.
      for (const m of matches(/(?<![\w.,:/$#£€’'‘-])([1-9])(?![\w.,:/%°’'-]|\s*[–-]\s*\d)(\s+)([a-z]+)/g, t)) {
        const before = t.slice(Math.max(0, m.index - 12), m.index);
        if (DIGIT_OK_BEFORE.test(before)) continue;
        if (new RegExp(`(?:${MONTHS}|Jan\\.|Feb\\.|Aug\\.|Sept\\.|Oct\\.|Nov\\.|Dec\\.) \\d{1,2},? (?:and|or|to|through|–|-) ?$`).test(t.slice(Math.max(0, m.index - 20), m.index))) continue; // "June 6 and 7"
        if (/\b[A-Z][a-z]+ of $/.test(before)) continue; // a name: "the Society of 8"
        if (new RegExp(`(?:${MONTHS}|Jan\\.|Feb\\.|Aug\\.|Sept\\.|Oct\\.|Nov\\.|Dec\\.) $`).test(before)) continue; // a date
        if (/\b(?:is|was|now|turned|turns|turning|be|being|just|nearly|almost)\s$/.test(before)) continue; // an age: "Jimmy is now 4"
        if (DIGIT_OK_AFTER.test(t.slice(m.index + m[1].length + m[2].length))) continue;
        if (/^(?:years?|months?|weeks?|days?)$/.test(m[3]) && /^\s+(?:old|-old)/.test(t.slice(m.index + m[0].length))) continue; // ages
        if (/^(?:years?|months?|weeks?|days?)-old/.test(t.slice(m.index + m[1].length + m[2].length))) continue;
        out.push(issue(this.id, m.index, m[1], SMALL[+m[1]]));
      }
      // Spelled-out numbers 10 and above (not at sentence start).
      const tens = "twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety";
      const rx = new RegExp(`\\b(ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|(?:${tens})(?:[- ](?:one|two|three|four|five|six|seven|eight|nine))?)\\b(?![- ](?:hundred|thousand|million|billion))`, "gi");
      for (const m of matches(rx, t)) {
        if (atSentenceStart(t, m.index)) continue;
        const prev = t.slice(Math.max(0, m.index - 20), m.index);
        if (/(?:hundred|thousand|million)[ -]?(?:and )?$/i.test(prev)) continue;
        const after = t.slice(m.index + m[0].length, m.index + m[0].length + 20);
        if (/^(?:-something|-somethings|s\b|ies\b|th\b)/i.test(after)) continue;
        if (/^-year-old|^ years? old/i.test(after)) continue; // handled by the ages rule
        // Idioms where AP keeps words: "ten-fold", "one in a million", "the Fab Four" etc.
        if (/^-fold/.test(after)) continue;
        const w = m[1].toLowerCase().split(/[- ]/);
        const n = (BIG_WORDS[w[0]] || 0) + (w[1] ? UNITS[w[1]] || 0 : 0);
        if (!n) continue;
        out.push(issue(this.id, m.index, m[0], String(n)));
      }
      // Four-plus digit numbers with no comma (skip years, ZIPs, phone numbers, street numbers).
      for (const m of matches(/(?<![\w.,:/#-])(\d{4,})(?![\w.,:/-]|\)| ?\d)/g, t)) {
        const v = m[1];
        const before = t.slice(Math.max(0, m.index - 30), m.index);
        const after = t.slice(m.index + v.length, m.index + v.length + 25);
        // 1000–2100 reads as a year unless it's counting something: "1000 miles", "about 1500 people".
        if (v.length === 4 && +v >= 1000 && +v <= 2100 && !COUNT_NOUN.test(after)) continue;
        if (v.length === 5 && /\b[A-Z]{2}\s*$/.test(before)) continue; // ZIP after postal code
        if (/^\s+(?:[A-Z][a-z]+\.?\s+){1,3}(?:St|Street|Ave|Avenue|Rd|Road|Blvd|Dr|Drive|Lane|Ln|Way|Pl|Place|Court|Ct|Pike|Highway|Hwy)\b/.test(after)) continue; // street number
        if (/(?:No\.|Apt\.|Suite|Room|Box|Rte\.|Route|ext\.?)\s*$/i.test(before)) continue;
        if (v.length > 6 && /^\d+$/.test(v)) continue; // probably an ID or phone number
        out.push(issue(this.id, m.index, v, Number(v).toLocaleString("en-US")));
      }
      // Sentence starting with a non-year number in digits.
      for (const m of matches(/(?:^|(?<=[.!?]["”’]?\s+)|(?<=\n\s*))(\d+)(?=\s+[a-z])/g, t)) {
        const v = +m[1];
        if (m[1].length === 4 && v >= 1000 && v <= 2100) continue;
        if (/\b(?:lbs?|oz|in|ft|No|St|Dr|Mr|Mrs|Ms|a\.m|p\.m)\.\s+$/.test(t.slice(Math.max(0, m.index - 8), m.index))) continue; // "7 lbs. 15 oz."
        out.push(issue(this.id, m.index, m[1], null, "Spell out a number that starts a sentence (or recast the sentence)."));
      }
      return out;
    },
  });

  rule({
    id: "ages",
    name: "Ages",
    group: "Mechanical",
    explain: "Ages are always digits, even under 10. Hyphenate as a compound adjective (their 1-year-old son). Set off with commas after a name (Tom, 18, is…).",
    find(t) {
      const out = [];
      const words = `(${SMALL.join("|")}|${Object.keys(BIG_WORDS).join("|")})(?:-(one|two|three|four|five|six|seven|eight|nine))?`;
      for (const m of matches(new RegExp(`\\b${words}(-years?-old|-months?-old| years? old| months? old)`, "gi"), t)) {
        if (atSentenceStart(t, m.index) && m[3].startsWith("-")) {
          // "Two-year-old Ellie..." at the start of a sentence: AP still prefers digits, but recast is the editor's call.
        }
        const lead = m[1].toLowerCase();
        const n = SMALL.includes(lead) ? SMALL.indexOf(lead) : BIG_WORDS[lead] + (m[2] ? UNITS[m[2].toLowerCase()] : 0);
        out.push(issue(this.id, m.index, m[0], n + m[3]));
      }
      // Missing hyphens: "her 3 year old son", "3-year old", "3 year-old".
      for (const m of matches(/\b(\d+)(?: (years?|months?) old|-(years?|months?) old| (years?|months?)-old)(?= [a-z])(?! (?:and|but|or|when|in|at|on|now|today|this|by|as|so|to)\b)/g, t)) {
        const unit = m[2] || m[3] || m[4];
        out.push(issue(this.id, m.index, m[0], `${m[1]}-${unit}-old`, "Hyphenate an age used as a compound adjective before a noun."));
      }
      for (const m of matches(/\b(\d+)(?:-(years?|months?) old|\s(years?|months?)-old)\b/g, t)) {
        if (out.some((o) => o.start === m.index)) continue;
        const unit = m[2] || m[3];
        out.push(issue(this.id, m.index, m[0], null, `Hyphens are inconsistent: use “${m[1]}-${unit}-old” before a noun, “${m[1]} ${unit} old” otherwise.`));
      }
      // "age of five" / "at age five"
      for (const m of matches(new RegExp(`\\b(age of|aged?|at age) (${SMALL.join("|")}|${Object.keys(BIG_WORDS).join("|")})(?:-(one|two|three|four|five|six|seven|eight|nine))?\\b`, "gi"), t)) {
        const lead = m[2].toLowerCase();
        const n = SMALL.includes(lead) ? SMALL.indexOf(lead) : BIG_WORDS[lead] + (m[3] ? UNITS[m[3].toLowerCase()] : 0);
        out.push(issue(this.id, m.index, m[0], `${m[1]} ${n}`));
      }
      return out;
    },
  });

  rule({
    id: "state-abbrev",
    name: "State abbreviations",
    group: "Mechanical",
    explain: "After a city, use AP state abbreviations (N.J.), not postal codes (NJ). Never abbreviate Alaska, Hawaii, Idaho, Iowa, Maine, Ohio, Texas or Utah. Mailing addresses with ZIP codes are left alone.",
    find(t) {
      const out = [];
      const postal = Object.keys(BY_POSTAL).join("|");
      // City, NJ  (but not "City, NJ 08512" — a mailing address)
      for (const m of matches(new RegExp(`(?<=[A-Z][\\w.'’-]*,\\s?)(${postal})\\b(?!\\s*\\d{5})(?!\\w|\\.\\w)`, "g"), t)) {
        const s = BY_POSTAL[m[1]];
        const f = stateFix(t, m.index, m.index + m[1].length, s.ap || s.name);
        out.push(issue(this.id, m.index, f.text, f.fix, s.ap ? null : `${s.name} is never abbreviated.`));
      }
      // City, New Jersey → City, N.J.
      const names = STATES.filter(([, , ap]) => ap).map(([, n]) => n.replace(/ /g, "\\s")).join("|");
      for (const m of matches(new RegExp(`(?<=\\b[A-Z][a-z]+(?:\\s[A-Z][a-z]+){0,2},\\s)(${names})\\b(?!\\s+(?:City|State|University|College|Avenue|Ave|Street|Turnpike))`, "g"), t)) {
        const name = m[1].replace(/\s/g, " ");
        const f = stateFix(t, m.index, m.index + m[0].length, BY_NAME[name].ap);
        out.push(issue(this.id, m.index, f.text, f.fix, "When a state follows a city, use the AP abbreviation."));
      }
      // Wrong abbreviations of never-abbreviated states.
      for (const m of matches(/(?<=,\s?)(Alas\.|Haw\.|Ida\.|Ia\.|Me\.|Tex\.|Ut\.|Oh\.)(?=\W|$)/g, t)) {
        const full = { "Alas.": "Alaska", "Haw.": "Hawaii", "Ida.": "Idaho", "Ia.": "Iowa", "Me.": "Maine", "Tex.": "Texas", "Ut.": "Utah", "Oh.": "Ohio" }[m[1]];
        const f = stateFix(t, m.index, m.index + m[1].length, full);
        out.push(issue(this.id, m.index, f.text, f.fix, `${full} is never abbreviated.`));
      }
      // Missing comma after the state when the sentence continues: "Newark, N.J. in 2020" → "Newark, N.J., in 2020"
      const ap = STATES.filter(([, , a]) => a).map(([, , a]) => a.replace(/\./g, "\\.")).join("|");
      const never = "Alaska|Hawaii|Idaho|Iowa|Maine|Ohio|Texas|Utah";
      for (const m of matches(new RegExp(`(?<=[A-Z][a-z]+,\\s)(${ap}|${never})(?= (?!and\\b|or\\b)[a-z])`, "g"), t)) {
        out.push(issue(this.id, m.index, m[1], m[1] + ",", "Put a comma after the state when the sentence continues."));
      }
      return out;
    },
  });

  rule({
    id: "city-shortcut",
    name: "City shortcuts",
    group: "Mechanical",
    explain: "NYC and LA may be abbreviated.",
    optional: true,
    find(t) {
      const out = [];
      for (const m of matches(/\bNew York City\b/g, t)) out.push(issue(this.id, m.index, m[0], "NYC"));
      for (const m of matches(/\bN\.Y\.C\.|\bL\.A\.(?=[\s,;:!?)]|$)/g, t)) out.push(issue(this.id, m.index, m[0], m[0].replace(/\./g, "")));
      return out;
    },
  });

  rule({
    id: "degrees",
    name: "Degrees",
    group: "Mechanical",
    explain: "Abbreviated degrees take capitals and periods (B.A., B.S., Ph.D.). Spelled-out degrees and honors are lowercase (bachelor’s, master’s, doctorate, cum laude, magna cum laude).",
    find(t) {
      const out = [];
      const ABBR = { BA: "B.A.", BS: "B.S.", PhD: "Ph.D.", PHD: "Ph.D.", "Ph.D": "Ph.D.", JD: "J.D.", MFA: "M.F.A.", EdD: "Ed.D.", BFA: "B.F.A.", LLM: "LL.M.", DDS: "D.D.S.", DMD: "D.M.D.", DVM: "D.V.M.", BSN: "B.S.N.", MSW: "M.S.W.", MPH: "M.P.H." };
      for (const m of matches(/\b(BA|BS|PhD|PHD|Ph\.D(?!\.)|JD|MFA|EdD|BFA|LLM|DDS|DMD|DVM|BSN|MSW|MPH)\b(?!\.)/g, t)) {
        // "BA" as an airline or "BS" in a sentence of capitals is rare in Class Notes; editor decides.
        out.push(issue(this.id, m.index, m[1], ABBR[m[1]]));
      }
      // MA / MS / MD only in clear degree context (they are also state codes).
      for (const m of matches(/(?<=\b(?:an?|his|her|my|their|earned|received|completed|holds|with)\s)(MA|MS|MD|MBA|M\.B\.A\.)\b(?!\.)/g, t)) {
        if (m[1] === "MBA" || m[1] === "M.B.A.") continue;
        out.push(issue(this.id, m.index, m[1], { MA: "M.A.", MS: "M.S.", MD: "M.D." }[m[1]]));
      }
      for (const m of matches(/(?<=\b(?:an?|his|her|my|their)\s)(MA|MS)(?= (?:in|from|degree)\b)/g, t)) {
        if (out.some((o) => o.start === m.index)) continue;
        out.push(issue(this.id, m.index, m[1], { MA: "M.A.", MS: "M.S." }[m[1]]));
      }
      // Capitalized spelled-out degrees mid-sentence; missing apostrophes.
      for (const m of matches(/\b(Bachelor|Master)(['’]s|s)?(?= (?:degree|of|in)\b)/g, t)) {
        if (atSentenceStart(t, m.index)) continue;
        if (/^ of (?:Arts|Science|Fine|Business|Laws|Education|Public|Social|Music)/.test(t.slice(m.index + m[0].length)) && !m[2]) {
          out.push(issue(this.id, m.index, m[0], m[1].toLowerCase(), "Lowercase spelled-out degrees: bachelor of arts, master of science."));
          continue;
        }
        out.push(issue(this.id, m.index, m[0], m[1].toLowerCase() + "’s"));
      }
      for (const m of matches(/\b(bachelor|master)s?(?= degree\b)/g, t)) {
        out.push(issue(this.id, m.index, m[0], m[1] + "’s"));
      }
      for (const m of matches(/\b(?:Summa|Magna)? ?Cum Laude\b|\b(?:summa|magna) Cum Laude\b|\bSumma cum laude\b|\bMagna cum laude\b/g, t)) {
        if (atSentenceStart(t, m.index) && /^(?:Summa|Magna) cum laude$/.test(m[0])) continue;
        out.push(issue(this.id, m.index, m[0].trim(), m[0].trim().toLowerCase()));
      }
      for (const m of matches(/(?<!^|[.!?]\s)\bDoctorate\b/g, t)) out.push(issue(this.id, m.index, m[0], "doctorate"));
      return out;
    },
  });

  rule({
    id: "reunion",
    name: "Reunion",
    group: "Mechanical",
    explain: "Lowercase “reunion” generally. Capitalize Alumni Weekend and a specific numbered Reunion (our 50th Reunion).",
    find(t) {
      const out = [];
      for (const m of matches(/\b(\d{1,2}(?:st|nd|rd|th)|(?:fifth|tenth|fifteenth|twentieth|twenty-fifth|thirtieth|thirty-fifth|fortieth|forty-fifth|fiftieth|fifty-fifth|sixtieth|sixty-fifth|seventieth|seventy-fifth|eightieth)) reunion\b/gi, t)) {
        if (/ Reunion$/.test(m[0])) continue;
        out.push(issue(this.id, m.index, m[0], m[0].replace(/reunion$/, "Reunion")));
      }
      // "Reunion Weekend" is not a numbered Reunion, so both words come down: "reunion weekend".
      for (const m of matches(/\b([Rr]eunion) ([Ww]eekend)\b/g, t)) {
        const before = t.slice(Math.max(0, m.index - 30), m.index);
        if (/(?:\d{1,2}(?:st|nd|rd|th)|(?:fifth|tenth|fifteenth|twentieth|thirtieth|fortieth|fiftieth|sixtieth|seventieth|seventy-fifth|eightieth|sixty-fifth|fifty-fifth|forty-fifth|thirty-fifth|twenty-fifth))\s+(?:[A-Z][\w’'-]*\s+)?$/i.test(before)) continue;
        const fix = (atSentenceStart(t, m.index) ? "Reunion" : "reunion") + " weekend";
        if (fix === m[0]) continue;
        out.push(issue(this.id, m.index, m[0], fix, "Lowercase both words unless it’s a specific numbered Reunion. Peddie’s event is Alumni Weekend, if that’s what is meant."));
      }
      for (const m of matches(/\bReunion\b/g, t)) {
        if (/^ [Ww]eekend\b/.test(t.slice(m.index + 7))) continue; // handled above
        const before = t.slice(Math.max(0, m.index - 30), m.index);
        if (/(?:\d{1,2}(?:st|nd|rd|th)|(?:fifth|tenth|fifteenth|twentieth|thirtieth|fortieth|fiftieth|sixtieth|seventieth|seventy-fifth|eightieth|sixty-fifth|fifty-fifth|forty-fifth|thirty-fifth|twenty-fifth))\s+(?:[A-Z][\w’'-]*\s+)?$/i.test(before)) continue;
        if (atSentenceStart(t, m.index)) continue;
        if (/^ (?:19|20)\d{2}\b/.test(t.slice(m.index + 7))) continue; // the event name: "Reunion 2023"
        // Proper names like "Reunion Committee" or "Reunion Weekend" are the editor's call; flag softly.
        const after = t.slice(m.index + 7, m.index + 20);
        const note = /^ (?:Weekend|Committee|Giving|Gift)/.test(after) ? "Capitalize only for a specific numbered Reunion; check whether this is part of a proper name." : null;
        out.push(issue(this.id, m.index, m[0], "reunion", note));
      }
      for (const m of matches(/\b[Aa]lumni [Ww]eekend\b/g, t)) {
        if (m[0] === "Alumni Weekend") continue;
        out.push(issue(this.id, m.index, m[0], "Alumni Weekend"));
      }
      return out;
    },
  });

  rule({
    id: "oxford-comma",
    name: "No serial (Oxford) comma",
    group: "Style",
    explain: "Omit the comma before the conjunction in a simple series (red, white and blue). Keep it only when leaving it out would make the meaning unclear.",
    find(t) {
      const out = [];
      // A list: "X, Y, and Z" within one sentence, where X and Y are short (≤ 4 words).
      for (const m of matches(/(?:^|[\s(“"])(?:[\w’'-]+ ){0,3}[\w’'-]+, (?:[\w’'-]+ ){0,3}[\w’'-]+(,) (and|or) /g, t)) {
        const ci = m.index + m[0].lastIndexOf(", " + m[2]);
        // Skip "City, N.J., and..." and "May 15, 1998, and..." where the comma closes an appositive.
        const pre = t.slice(Math.max(0, ci - 12), ci);
        if (/(?:\b[A-Z]\.[A-Z]?\.?|\d{4}|Jr\.|Sr\.|Inc\.)$/.test(pre)) continue;
        if (STATES.some(([, , ap]) => ap && pre.endsWith(ap))) continue;
        const after = t.slice(ci + 2 + m[2].length + 1);
        const items = m[0].trim().replace(/^[(“"]/, "").split(/, /);
        const middle = items[items.length - 2] || "";
        // "…, and we have a year": a new clause, not the last item of a list.
        if (/^(?:I|we|he|she|they|it|you|my|his|her|our|their|its|then|now|if|so|there|this|that|also|still|when|while|yet|all|as|because|since|I’m|I'm|we’re|we're)\b/.test(after)) continue;
        // "Stay well, my friends, and…" / "Great picture, guys, and…": direct address.
        if (/^(?:my friends?|friends|guys|folks|all|everyone|everybody|classmates|y’all|y'all)$/i.test(middle)) continue;
        // "his son, Josh, and…" / "Valencia, Spain, and…": an appositive closed by its comma.
        if (/(?:son|daughter|wife|husband|partner|brother|sister|mother|father|friend|grandson|granddaughter|roommate|classmate)$/i.test(items[items.length - 3] || "")) continue;
        if (/^(?:[A-Z][a-z]+ ?){1,2}$/.test(middle) && PLACES.test(middle)) continue;
        // "…studying engineering, and her twin is…": the "and" part has its own verb.
        if (/^\S+(?: \S+){0,3} (?:is|are|was|were|has|have|had|will|can|did|does)\b/.test(after)) continue;
        if (/^(?:have|has|had|is|are|was|were|will|would|can|could|looks?|lives?|works?|enjoys?|continues?|plans?|hopes?|loves?|spends?|spent|went|got|made|took|sends?|says?|said)\b/.test(after)) continue;
        if (/^\d+$/.test(middle)) continue; // "Jack, 14, and twins…": an age, not a list item
        out.push(issue(this.id, ci, ",", "", "Looks like a serial comma. Drop it unless the list is unclear without it."));
      }
      return out;
    },
  });

  rule({
    id: "publication-titles",
    name: "Publication titles",
    group: "Style",
    explain: "Books, songs, movies, TV shows and albums go in quotation marks (not italics). Newspapers and magazines take neither quotes nor italics.",
    find(t) {
      const out = [];
      for (const p of QUOTED_PERIODICALS) {
        const esc = p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        for (const m of matches(new RegExp(`[“"‘']${esc}[,.]?[”"’']`, "g"), t)) {
          out.push(issue(this.id, m.index, m[0], m[0].replace(/^[“"‘']|[”"’']$/g, ""), "Newspapers and magazines take no quotation marks."));
        }
      }
      for (const m of matches(/\b(?:book|novel|memoir|album|song|film|movie|documentary|podcast|play|series|show|poem|article|essay|collection) (?:titled |called |entitled )?(?=[A-Z][a-z]+(?: [A-Z][a-z]+| (?:of|the|and|a|in|on|for|to)){1,6}[\s,.;:!?])(?![“"])/g, t)) {
        const rest = t.slice(m.index + m[0].length);
        const title = rest.match(/^[A-Z][\w’'-]*(?: (?:[A-Z][\w’'-]*|of|the|and|a|an|in|on|for|to|with|at)){0,8}(?=[\s,.;:!?]|$)/);
        if (!title || title[0].split(" ").length < 2) continue;
        out.push(issue(this.id, m.index + m[0].length, title[0], `“${title[0]}”`, "Titles of books, songs, movies, shows and albums go in quotation marks. Check where the title ends."));
      }
      return out;
    },
  });

  rule({
    id: "quotes",
    name: "Double vs. single quotes",
    group: "Style",
    explain: "Use double quotes for quoted material and single quotes only for a quote within a quote.",
    find(t) {
      const out = [];
      // Walk each paragraph tracking whether we're inside a double quote.
      let pos = 0;
      const paras = t.split(/(\n\s*)/);
      for (let pi = 0; pi < paras.length; pi++) {
        const p = paras[pi];
        if (/^\n\s*$/.test(p)) { pos += p.length; continue; }
        let depth = 0;
        let lastOpen = -1;
        for (let i = 0; i < p.length; i++) {
          const c = p[i];
          if (c === "“") { depth = 1; lastOpen = i; } // a second “ before any ” starts a fresh quote
          else if (c === "”") depth = Math.max(0, depth - 1);
          else if (c === '"') {
            // Straight quote: decide by context.
            // Straight quotes have no direction: one closes an open quote (even right after a dash, as in “I was going to—”), otherwise it opens one.
            const opens = (i === 0 || /[\s(\[—–]/.test(p[i - 1])) && /[\w‘'….]/.test(p[i + 1] || "");
            if (!opens) depth = Math.max(0, depth - 1);
            else if (depth > 0) {
              out.push(issue(this.id, pos + i, c, null, "A quote within a quote takes single quotes: “He told me, ‘Come home.’”"));
              depth = 2;
            } else { depth = 1; lastOpen = i; }
          } else if ((c === "‘" || (c === "'" && (i === 0 || /[\s(\[—–]/.test(p[i - 1])))) && depth === 0) {
            if (/\d/.test(p[i + 1] || "")) continue; // class year — another rule
            const close = p.slice(i + 1).search(/[’'](?=[\s.,;:!?)]|$)/);
            if (close < 0 || close > 200) continue;
            const span = p.slice(i, i + close + 2);
            out.push(issue(this.id, pos + i, span, "“" + span.slice(1, -1) + "”", "Single quotes are only for a quote within a quote."));
            i += close + 1;
          }
        }
        // Unclosed quote at paragraph end: fine only if the next paragraph continues the quote.
        if (depth > 0) {
          const next = (paras[pi + 2] || "").trimStart();
          if (!/^[“"]/.test(next)) {
            out.push(issue(this.id, pos + lastOpen, p[lastOpen], null, "This quotation is never closed. If it continues into the next paragraph, start that paragraph with an opening quote mark."));
          }
        }
        pos += p.length;
      }
      return out;
    },
  });

  rule({
    id: "family-commas",
    name: "Family and friends",
    group: "Style",
    explain: "Set the name off with commas when there is only one such person (his wife, Nancy,). Leave the commas out when there are several (Bob’s daughter Sarah).",
    find(t) {
      const out = [];
      for (const m of matches(/\b(?:his|her|my|their|our|[A-Z][a-z]+[’']s) (wife|husband|spouse|partner|fiancée?|mother|father|mom|dad|eldest (?:son|daughter|child)|youngest (?:son|daughter|child)|oldest (?:son|daughter|child)|only (?:son|daughter|child|brother|sister)|twin)( )([A-Z][a-z]+(?: [A-Z]\.)?(?: [A-Z][a-z]+)?)/g, t)) {
        const nameStart = m.index + m[0].length - m[3].length;
        const after = t.slice(m.index + m[0].length, m.index + m[0].length + 2);
        const fix = /^[,.;:!?)]/.test(after) ? `, ${m[3]}` : `, ${m[3]},`;
        out.push(issue(this.id, nameStart - 1, " " + m[3], fix, `Only one ${m[1]}, so the name takes commas.`));
      }
      return out;
    },
  });

  rule({
    id: "job-titles",
    name: "Job titles",
    group: "Style",
    explain: "Lowercase a title unless the full formal title comes directly before the name (President Jane Smith; Jane Smith, president of the company).",
    find(t) {
      const out = [];
      const titles = "President|Vice President|Executive Vice President|Senior Vice President|Chief Executive Officer|Chief Operating Officer|Chief Financial Officer|Chief Technology Officer|Director|Executive Director|Managing Director|Managing Partner|Senior Partner|Partner|Chairman|Chairwoman|Chair|Chairperson|Founder|Co-Founder|Co-founder|Dean|Provost|Head of School|Headmaster|Principal|Superintendent|Manager|General Manager|Senior Manager|Associate|Senior Associate|Professor|Associate Professor|Assistant Professor|Treasurer|Secretary|Owner|Head|Coach|Head Coach|Pastor|Rector|Rabbi|Mayor|Senator|Governor|Judge|Editor|Editor-in-Chief|Publisher|Producer|Curator|Consultant|Analyst|Engineer|Attorney|Counsel|General Counsel";
      for (const m of matches(new RegExp(`(?<=,\\s(?:the |a |an |now |former |longtime |the new )?)(${titles})(?= (?:of|at|for|in|and)\\b|[,.;])`, "g"), t)) {
        out.push(issue(this.id, m.index, m[1], m[1].toLowerCase()));
      }
      for (const m of matches(new RegExp(`\\b(?:as|is|was|became|named|appointed|elected|serves as|served as|promoted to|now) (?:the |a |an )?(?:new )?(${titles})(?= (?:of|at|for)\\b)`, "g"), t)) {
        const s = m.index + m[0].length - m[1].length;
        // "named President John Smith" would be followed by a name, which the lookahead already excludes.
        out.push(issue(this.id, s, m[1], m[1].toLowerCase()));
      }
      return out;
    },
  });

  rule({
    id: "majors",
    name: "Academic majors",
    group: "Style",
    explain: "Lowercase majors (history major) unless the major contains a proper noun (English major).",
    find(t) {
      const out = [];
      for (const mj of MAJORS) {
        for (const m of matches(new RegExp(`\\b${mj}(?= (?:major|minor|degree|concentration)\\b)`, "g"), t)) {
          if (atSentenceStart(t, m.index)) continue;
          out.push(issue(this.id, m.index, m[0], m[0].toLowerCase()));
        }
        for (const m of matches(new RegExp(`(?<=\\b(?:major(?:ed|ing)? in|minor(?:ed|ing)? in|degree in|studying|studied|concentrat(?:ed|ing) in|(?:B\\.?A|B\\.?S|M\\.?A|M\\.?S|Ph\\.?D|Ed\\.?D|M\\.?F\\.?A)\\.? in|(?:bachelor|master)[’']s in|doctorate in) )${mj}\\b`, "g"), t)) {
          if (/^ (?:of|and) [A-Z]/.test(t.slice(m.index + mj.length))) continue; // e.g. "History of Art" program names
          out.push(issue(this.id, m.index, m[0], m[0].toLowerCase()));
        }
      }
      for (const p of PROPER_MAJORS) {
        for (const m of matches(new RegExp(`\\b${p}(?= (?:major|minor|degree)\\b)|(?<=\\b(?:major(?:ed|ing)? in|degree in|minor in) )${p}\\b`, "g"), t)) {
          out.push(issue(this.id, m.index, m[0], m[0].replace(/\b\w/g, (c) => c.toUpperCase())));
        }
      }
      return out;
    },
  });

  rule({
    id: "directions-regions",
    name: "Directions vs. regions",
    group: "Style",
    explain: "Lowercase compass directions (they traveled west); capitalize regions (the West Coast, the Midwest).",
    find(t) {
      const out = [];
      for (const m of matches(/\b(?:the )?(west coast|east coast|gulf coast|midwest|pacific northwest|new england|upper west side|upper east side|deep south|southern california|northern california|mid-atlantic)\b/gi, t)) {
        const proper = m[1].replace(/\b\w/g, (c) => c.toUpperCase()).replace("Mid-Atlantic", "Mid-Atlantic");
        if (m[1] === proper) continue;
        out.push(issue(this.id, m.index + m[0].length - m[1].length, m[1], proper));
      }
      for (const m of matches(/\b(?:moved|moving|move|traveled|travelled|traveling|headed|heading|head|drove|driving|flew|flying|relocated|went) (North|South|East|West|Northeast|Northwest|Southeast|Southwest)\b(?! (?:Carolina|Dakota|Africa|Korea|America|Jersey|Orange|Brunswick|Hampton|Side|Coast|Village|End))/g, t)) {
        out.push(issue(this.id, m.index + m[0].length - m[1].length, m[1], m[1].toLowerCase()));
      }
      return out;
    },
  });

  rule({
    id: "future-tense",
    name: "Time sensitivity",
    group: "Review",
    explain: "Class Notes are due about two months before the issue publishes, so upcoming events may be past by then. Check the tense against the publication date.",
    find(t) {
      const out = [];
      const rx = /\b(?:will (?:be |)(?:attend|attending|travel|traveling|visit|visiting|celebrate|celebrating|retire|retiring|graduate|graduating|move|moving|marry|start|begin|host|hosting|join|joining|run|compete|perform|open|launch|welcome|head|go|spend|return)|(?:is|are|am|'m|’m|'re|’re) (?:planning|looking forward|hoping|heading|headed|going) to|(?:plans|plan|planned) to|is expected to|are expecting|is expecting|upcoming|later this (?:year|month|spring|summer|fall|winter)|next (?:month|week|spring|summer|fall|winter)|this coming|in the coming (?:weeks|months))\b/gi;
      for (const m of matches(rx, t)) {
        out.push(issue(this.id, m.index, m[0], null, "Future event: confirm it hasn’t already happened by publication, and adjust the tense if needed."));
      }
      return out;
    },
  });

  rule({
    id: "typos",
    name: "Punctuation and typos",
    group: "Mechanical",
    explain: "Common slips: repeated words, space before punctuation, doubled punctuation, “e-mail” (AP: email).",
    find(t) {
      const out = [];
      for (const m of matches(/\b(\w+) \1\b(?![.@]\w)/gi, t)) {
        if (/^(?:that|had|is|do|bye|ha|no|very|so|far|go|knock|well|now|again|on|and|more|by|over|round|wait|tsk|chop|ho|la|night|ta)$/i.test(m[1]) && m[1].toLowerCase() !== "the") {
          if (!/^(?:the|a|an|to|of|in|is)$/i.test(m[1])) continue;
        }
        if (/^\d+$/.test(m[1])) continue;
        out.push(issue(this.id, m.index, m[0], m[1], "Repeated word."));
      }
      for (const m of matches(/(?<=\w) +([,.;:!?])(?!\d|\.\.| \.)/g, t)) {
        // "end of story . . ." is a spaced ellipsis, not a stray space.
        if (m[1] === "." && /^ \./.test(t.slice(m.index + m[0].length))) continue;
        out.push(issue(this.id, m.index, m[0], m[1], "Space before punctuation."));
      }
      for (const m of matches(/(?<!\.)([,;:])\1+|(?<![.…])\.\.(?![.…])|,\.(?!\.)|\.,(?! )/g, t)) {
        if (/^\.,$/.test(m[0]) && /\b[A-Z]\.$|\b(?:Jr|Sr|Inc|Co|St|Dr|Mr|Mrs|Ms|Ltd|etc|a\.m|p\.m|Ph\.D|U\.S)$/.test(t.slice(Math.max(0, m.index - 5), m.index + 1))) continue;
        if (/^\.,$/.test(m[0]) && /[.…]$/.test(t.slice(0, m.index))) continue; // "Well...,"
        if (m[0] === "..") {
          // Two periods: a typo for one period, or a short ellipsis. Only the editor can tell.
          if (/^\.[A-Za-z]{2,}\b/.test(t.slice(m.index + 1)) || /[A-Z]\.$/.test(t.slice(Math.max(0, m.index - 2), m.index + 1))) {
            out.push(issue(this.id, m.index, m[0], ".", "Doubled period after an abbreviation."));
          } else {
            out.push(issue(this.id, m.index, m[0], null, "Two periods: use one period, or a full ellipsis (...) if a pause was meant."));
          }
          continue;
        }
        const fix = m[0].startsWith(",") ? "," : m[0][0];
        out.push(issue(this.id, m.index, m[0], fix, "Doubled punctuation."));
      }
      for (const m of matches(/\b[Ee]-mail/g, t)) out.push(issue(this.id, m.index, m[0], m[0][0] === "E" ? "Email" : "email"));
      // Stray period in the middle of a sentence: "his wife, Carol. are doing well"
      for (const m of matches(/(?<=\b(?!(?:Mr|Mrs|Ms|Dr|St|Jr|Sr|Rev|Gen|Col|Capt|Lt|Sgt|Prof|Ave|Blvd|Mt|Ft)\.)[A-Z][a-z]{2,})\. (?=(?:are|is|was|were|and|have|has|who|which|to|of|in|on)\b)/g, t)) {
        out.push(issue(this.id, m.index, ".", ",", "A period mid-sentence (the next word is lowercase). Probably meant a comma."));
      }
      return out;
    },
  });

  // Words that can start a capitalized run before a name but are not part of it.
  const NOT_NAME = new Set(("The A An And But Or So In On At To From With By For Of As Also Then When While After Before " +
    "Since During Recently Meanwhile Yesterday Today Last This That These Those Our My His Her Their Its Your We I He She They " +
    "Dear Congratulations Congrats Thanks Thank Classmate Classmates Alumni Alumnus Alumna Peddie Hi Hello Greetings Both " +
    "Please Here There Sadly Happily Finally Former Fellow Friend Friends Brother Sister Son Daughter Wife Husband Mr Mrs Ms Dr " +
    "Coach Professor President Dean Rev Captain Judge Senator Gov Mayor Photo Pictured Left Right Above Below Back Front Row " +
    "Athletic Director Head Executive Chairman Chair Founder Chief Assistant Associate Senior Junior Vice Principal Headmaster").split(" "));

  const NAME_TOKEN = String.raw`(?:[A-Z][a-zA-Z’'\-]*\.?|\([A-Z][a-zA-Z’'\-]*\)|[“"][A-Z][a-zA-Z’'\-]*[”"]|(?:de|van|von|der|da|del|di|la|le|du|St\.)(?= [A-Z]))`;

  // Photo captions and name lists (In Memoriam) follow their own layout, so the bold rule skips them.
  // A caption is a short paragraph with a class year that doesn't end like a sentence, or opens like
  // a caption ("Pictured", "Back row"). A list is a paragraph that is mostly names with class years.
  function captionOrList(body, at) {
    const ls = body.lastIndexOf("\n", at) + 1;
    let le = body.indexOf("\n", at); if (le < 0) le = body.length;
    const line = body.slice(ls, le).trim();
    const words = line.split(/\s+/).length;
    const years = (line.match(/[’'‘]\d{2}\b/g) || []).length;
    if (/^(?:Pictured|Back row|Front row|Top row|Middle row|From left|L to R|Left to right|Above|Below|In Memoriam)\b/i.test(line)) return true;
    if (words < 40 && years && !/[.!?”"]$/.test(line)) return true;
    if (years >= 4 && years * 4 >= words) return true;
    return false;
  }

  rule({
    id: "bold-names",
    name: "Bold alumni on first mention",
    group: "Style",
    explain: "Bold each alum’s name the first time it appears in a class year section. For a member of the class being reported on, bold the name and leave off the class year.",
    find(t, opts) {
      const out = [];
      const bold = (opts && opts.bold) || [];
      const isBold = (a, b) => { for (let i = a; i < b; i++) if (/\S/.test(t[i]) && !bold[i]) return false; return b > a; };
      for (const sec of sections(t)) {
        const body = t.slice(sec.start, sec.end);
        const yy = (sec.label.match(/^(?:[’'‘]?(\d{2})|(?:19|20)(\d{2}))$/) || []).slice(1).find(Boolean);
        const names = new Map(); // name → first index (relative to section) where it appears with a class year
        // A name followed by a class year: "Amy Hollander ’87", "Donald (Charlie) Weinberg ’55".
        for (const m of matches(new RegExp(String.raw`((?:${NAME_TOKEN} ){1,5})(?:Jr\.,? |Sr\.,? |I{2,3},? |IV,? )?(?<!P)[’'‘](\d{2})(?![\ds\w])`, "g"), body)) {
          let toks = m[1].trim().split(" ");
          // A word of three or more letters ending in a period ends a sentence, so the name starts after it.
          const cut = toks.map((w) => /^[A-Za-z’'-]{3,}\.$/.test(w) && !/^(?:Jr|Sr|St)\.$/.test(w)).lastIndexOf(true);
          if (cut >= 0) toks = toks.slice(cut + 1);
          while (toks.length && NOT_NAME.has(toks[0].replace(/[.’']/g, ""))) toks.shift();
          if (toks.length < 2) continue;
          const name = toks.join(" ");
          const caption = captionOrList(body, m.index);
          if (!names.has(name)) names.set(name, { caption });
          // Member of the class being reported on: no class year.
          if (yy && m[2] === yy && !caption) {
            const ys = m.index + m[0].length - 3;
            out.push(issue(this.id, sec.start + ys - 1, body.slice(ys - 1, ys + 3), "", `${name} is in the Class of ’${yy}, the class this section reports on, so leave off the class year.`));
          }
        }
        // Names already bolded somewhere in the section count too.
        let i = 0;
        while (i < body.length) {
          if (!bold[sec.start + i] || !/[A-Z]/.test(body[i])) { i++; continue; }
          let j = i;
          while (j < body.length && (bold[sec.start + j] || body[j] === " ") && body[j] !== "\n") j++;
          const run = body.slice(i, j).trim().replace(/[,:;.]$/, "");
          const toks = run.split(" ");
          if (toks.length >= 2 && toks.length <= 5 && toks.every((w) => new RegExp(`^${NAME_TOKEN}$`).test(w)) && !names.has(run)) names.set(run, { caption: false });
          i = j + 1;
        }
        for (const [name, info] of names) {
          if (info.caption) continue;
          const esc = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          const first = new RegExp(`(?<![\\w’'])${esc}(?![\\w])`).exec(body);
          if (!first) continue;
          const a = sec.start + first.index, b = a + name.length;
          if (isBold(a, b)) continue;
          if (captionOrList(body, first.index)) continue;
          const o = issue(this.id, a, name, undefined, "First mention of this alum in the section: bold the name.");
          o.format = "bold";
          out.push(o);
        }
      }
      return out;
    },
  });

  const WORD_LIMIT = 2000;

  // Split a batch into class-year sections so the word count is per submission.
  // A section header is a line holding just a class year: "57", "’57", "1957", "42–48", "2019".
  function sections(t) {
    const heads = [];
    for (const m of matches(/(?:^|\n)[ \t]*(?:[’'‘]?\d{2}|(?:19|20)\d{2})(?:\s*[–-]\s*(?:[’'‘]?\d{2}|(?:19|20)\d{2}))?[ \t]*(?=\n|$| [A-Z])/g, t)) {
      const s = m.index + (m[0].startsWith("\n") ? 1 : 0);
      heads.push({ start: s, label: m[0].trim() });
    }
    if (!heads.length) return [{ start: 0, end: t.length, label: "Submission" }];
    if (heads[0].start > 0 && t.slice(0, heads[0].start).trim()) heads.unshift({ start: 0, label: "Opening" });
    return heads.map((h, i) => ({ ...h, end: i + 1 < heads.length ? heads[i + 1].start : t.length }));
  }

  function wordCount(s) {
    return (s.match(/[A-Za-z0-9’'][\w’'-]*/g) || []).length;
  }

  function check(text, opts) {
    opts = opts || {};
    const skip = new Set(opts.skip || []);
    let issues = [];
    for (const r of RULES) {
      if (skip.has(r.id)) continue;
      if (r.optional && !opts.includeOptional) continue;
      try {
        issues.push(...r.find(text, opts));
      } catch (e) {
        if (typeof console !== "undefined") console.error(`rule ${r.id} failed`, e);
      }
    }
    // Drop exact duplicates and nested overlaps from the same rule.
    issues.sort((a, b) => a.start - b.start || b.end - a.end);
    const seen = new Set();
    issues = issues.filter((x) => {
      const k = `${x.rule}:${x.start}:${x.end}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
    const secs = sections(text).map((s) => ({ ...s, words: wordCount(text.slice(s.start, s.end)) }));
    const long = secs.filter((s) => s.words > WORD_LIMIT);
    return { issues, sections: secs, longSections: long, words: wordCount(text) };
  }

  // Apply the chosen fixes (non-overlapping, applied right to left).
  function applyFixes(text, chosen) {
    const list = chosen.filter((x) => x.fix !== undefined).sort((a, b) => b.start - a.start);
    let out = text;
    let floor = Infinity;
    for (const x of list) {
      if (x.end > floor) continue; // overlaps a fix already applied
      out = out.slice(0, x.start) + x.fix + out.slice(x.end);
      floor = x.start;
    }
    return out;
  }

  // Rich version: carries a per-character bold mask through the fixes and applies bold fixes.
  // New characters take the bold of the text they replace.
  function applyFixesRich(text, bold, chosen) {
    let mask = Array.from({ length: text.length }, (_, i) => (bold && bold[i] ? 1 : 0));
    for (const x of chosen) if (x.format === "bold") for (let i = x.start; i < x.end; i++) mask[i] = 1;
    const list = chosen.filter((x) => x.fix !== undefined).sort((a, b) => b.start - a.start);
    let out = text;
    let floor = Infinity;
    for (const x of list) {
      if (x.end > floor) continue;
      const b = mask[x.start] ?? mask[x.start - 1] ?? 0;
      out = out.slice(0, x.start) + x.fix + out.slice(x.end);
      mask = mask.slice(0, x.start).concat(Array(x.fix.length).fill(b), mask.slice(x.end));
      floor = x.start;
    }
    return { text: out, bold: mask };
  }

  const api = { RULES, check, applyFixes, applyFixesRich, sections, WORD_LIMIT };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.ClassNotesChecker = api;
})(typeof window !== "undefined" ? window : globalThis);
