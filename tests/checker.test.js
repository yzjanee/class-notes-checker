// Run with: node --test tests/
// Each case pairs a sentence with the flags it should (or should not) raise.

const test = require("node:test");
const assert = require("node:assert/strict");
const { check, applyFixes } = require("../checker.js");

function flags(text, rule) {
  return check(text, { includeOptional: true }).issues.filter((i) => !rule || i.rule === rule);
}

function fixed(text, rule) {
  return applyFixes(text, flags(text, rule));
}

// [rule, wrong, right] — "wrong" must be flagged and fixed to "right"; "right" must not be flagged.
const PAIRS = [
  ["double-space", "Use a single space.  Use a single space.", "Use a single space. Use a single space."],
  ["class-year-apostrophe", "Jim Smith ‘98 wrote in.", "Jim Smith ’98 wrote in."],
  ["class-year-apostrophe", "Jim Smith '98 wrote in.", "Jim Smith ’98 wrote in."],
  ["date-ordinal", "They married on May 15th in Maine.", "They married on May 15 in Maine."],
  ["date-ordinal", "We met on the 3rd of June.", "We met on June 3."],
  ["date-comma", "They married May 15 1998.", "They married May 15, 1998."],
  ["date-comma", "On May 15, 1998 they married.", "On May 15, 1998, they married."],
  ["numbers", "He has 3 classmates nearby.", "He has three classmates nearby."],
  ["numbers", "She has twelve grandchildren.", "She has 12 grandchildren."],
  ["numbers", "They drove 1000 miles.", "They drove 1,000 miles."],
  ["ages", "their two-year-old son", "their 2-year-old son"],
  ["ages", "their 2 year old son", "their 2-year-old son"],
  ["ages", "She retired at the age of five.", "She retired at the age of 5."],
  ["state-abbrev", "He lives in Newark, NJ with his family.", "He lives in Newark, N.J., with his family."],
  ["state-abbrev", "He lives in Austin, TX.", "He lives in Austin, Texas."],
  ["state-abbrev", "He lives in Austin, Tex.", "He lives in Austin, Texas."],
  ["state-abbrev", "She moved to Princeton, New Jersey.", "She moved to Princeton, N.J."],
  ["state-abbrev", "She moved to Hightstown, N.J. in 2020.", "She moved to Hightstown, N.J., in 2020."],
  ["degrees", "She earned her PhD at Yale.", "She earned her Ph.D. at Yale."],
  ["degrees", "He earned a BA in history.", "He earned a B.A. in history."],
  ["degrees", "She earned her Master's degree.", "She earned her master’s degree."],
  ["degrees", "He graduated Magna Cum Laude.", "He graduated magna cum laude."],
  ["reunion", "See you at our Reunion this spring.", "See you at our reunion this spring."],
  ["reunion", "Our 50th reunion is this spring.", "Our 50th Reunion is this spring."],
  ["reunion", "Come back for alumni weekend.", "Come back for Alumni Weekend."],
  ["oxford-comma", "We saw red, white, and blue flags.", "We saw red, white and blue flags."],
  ["publication-titles", "He wrote for “The New York Times.”", "He wrote for The New York Times."],
  ["quotes", "He sends ‘Aloha’ to all.", "He sends “Aloha” to all."],
  ["family-commas", "He and his wife Nancy have been busy.", "He and his wife, Nancy, have been busy."],
  ["job-titles", "Jane Smith, President of the company, spoke.", "Jane Smith, president of the company, spoke."],
  ["majors", "She was a History major.", "She was a history major."],
  ["majors", "She was an english major.", "She was an English major."],
  ["directions-regions", "They moved to the west coast.", "They moved to the West Coast."],
  ["directions-regions", "They traveled West last year.", "They traveled west last year."],
  ["typos", "We went to the the lake.", "We went to the lake."],
  ["typos", "Please e-mail me.", "Please email me."],
  ["typos", "his wife, Carol. are doing well", "his wife, Carol, are doing well"],
];

for (const [rule, wrong, right] of PAIRS) {
  test(`${rule}: flags and fixes “${wrong}”`, () => {
    assert.ok(flags(wrong, rule).length > 0, "expected a flag");
    assert.equal(fixed(wrong, rule), right);
  });
  test(`${rule}: leaves “${right}” alone`, () => {
    assert.deepEqual(flags(right, rule).map((i) => i.text), []);
  });
}

// Correct text from the style guide that must never be flagged.
const CLEAN = [
  "May 15, 1998; On May 15, 1998, they married.",
  "three classmates, 12 grandchildren, 1,000 miles. Twenty classmates attended.",
  "their 1-year-old son; their son Tom, 18, is a junior.",
  "Bob’s daughter Sarah came along. Bob’s eldest daughter, Sara, did not.",
  "President Jane Smith spoke. Our 50th Reunion is this spring.",
  "She earned a B.A., a B.S. and a Ph.D., all with honors, cum laude.",
  "She said, “He told me, ‘Come home.’”",
  "Former Director of Alumni Relations Brian Davidson called.",
  "In 2024, we visited San Francisco, Dallas, Toronto and Paris.",
  "Write to 41 Whitesands Way, Little Silver, NJ 07739.",
  "He scored 3 goals and won 2–1. It was 5 p.m. on Route 9.",
  "Peddie beat Hill School 40–20 in the 2025 season.",
  "He gets out to walk each morning.",
];

for (const s of CLEAN) {
  test(`clean: “${s}”`, () => {
    const got = flags(s).filter((i) => i.rule !== "future-tense");
    assert.deepEqual(got.map((i) => `${i.rule}: ${i.text}`), []);
  });
}

test("future tense is flagged for review, with no automatic fix", () => {
  const f = flags("He will attend the reunion in June.", "future-tense");
  assert.equal(f.length, 1);
  assert.equal(f[0].fix, undefined);
});

test("multi-paragraph quote: open quote continued by next paragraph is fine", () => {
  const ok = "“I loved Peddie.\n\n“It changed my life.”";
  assert.deepEqual(flags(ok, "quotes"), []);
  const bad = "“I loved Peddie.\n\nIt changed my life.";
  assert.equal(flags(bad, "quotes").length, 1);
});

test("word count flags sections over 2,000 words", () => {
  const long = "57\nWalter Lotte\n" + "word ".repeat(2100) + "\n\n58\nShort note here.";
  const r = check(long);
  assert.equal(r.longSections.length, 1);
  assert.equal(r.longSections[0].label, "57");
});

test("date missing both commas gets both", () => {
  assert.equal(fixed("On June 1 2026 we met.", "date-comma"), "On June 1, 2026, we met.");
});

test("major after a degree is lowercased", () => {
  assert.equal(fixed("He earned his Ph.D. in History at Rutgers.", "majors"), "He earned his Ph.D. in history at Rutgers.");
});
