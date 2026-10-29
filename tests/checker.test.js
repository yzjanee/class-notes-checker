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

// Feedback from the Chronicle editor, Oct. 29, 2026.
test("ellipses are not doubled punctuation", () => {
  for (const s of ["I was there ... but left.", "I was there... but left.", "So . . . I apologize.", "end of story . . .", "Well...,", "word,... then", "It ended…. Then", "wait.... Then"]) {
    assert.deepEqual(flags(s, "typos").map((i) => i.text), [], s);
  }
  const two = flags("wait.. then", "typos");
  assert.equal(two.length, 1);
  assert.equal(two[0].fix, undefined, "two periods could be a short ellipsis, so no automatic fix");
});

test("spaces around a dash are not treated as sentence spacing", () => {
  assert.deepEqual(flags("It was 70 — in my case, 80.", "double-space"), []);
  assert.deepEqual(flags("He retired—finally.", "extra-space"), []);
  const f = flags("He retired —  finally.");
  assert.deepEqual(f.map((i) => i.rule), ["extra-space"]);
  assert.equal(fixed("He retired —  finally.", "extra-space"), "He retired — finally.");
});

test("non-breaking spaces count as spaces", () => {
  assert.equal(fixed("First.\u00a0 Second.", "double-space"), "First. Second.");
});

test("straight quote right after a dash closes the quote", () => {
  assert.deepEqual(flags('He said, "I was going to—" and stopped.', "quotes"), []);
});

test("Reunion Weekend lowercases both words", () => {
  assert.equal(fixed("See you at Reunion Weekend in June.", "reunion"), "See you at reunion weekend in June.");
  assert.equal(fixed("See you at reunion Weekend in June.", "reunion"), "See you at reunion weekend in June.");
  assert.deepEqual(flags("Our 50th Reunion Weekend is in June.", "reunion"), []);
  assert.deepEqual(flags("See you at reunion weekend.", "reunion"), []);
});

test("straight double quotes nested in a straight-quoted passage are flagged", () => {
  const f = flags('He wrote: "I wouldn\'t call it a "cream puff," but it runs."', "quotes");
  assert.equal(f.length, 1);
  assert.match(f[0].note, /single quotes/);
});

// Bold is passed as a per-character mask; boldMask marks the given substrings bold.
function boldMask(text, ...parts) {
  const m = Array(text.length).fill(0);
  for (const p of parts) { const i = text.indexOf(p); for (let k = i; k < i + p.length; k++) m[k] = 1; }
  return m;
}

test("bold-names: first mention of an alum with a class year must be bold", () => {
  const t = "57\nPat Example\n\nI had lunch with Amy Hollander ’87 and her husband. Amy Hollander ’87 says hello.";
  const f = check(t, { bold: boldMask(t) }).issues.filter((i) => i.rule === "bold-names");
  assert.equal(f.length, 1);
  assert.equal(f[0].text, "Amy Hollander");
  assert.equal(f[0].format, "bold");
  assert.equal(t.indexOf("Amy Hollander"), f[0].start, "flags the first mention, not the second");
  const ok = check(t, { bold: boldMask(t, "Amy Hollander") }).issues.filter((i) => i.rule === "bold-names");
  assert.deepEqual(ok, []);
});

test("bold-names: a name bolded later but not on first mention is flagged", () => {
  const t = "57\nPat Example\n\nChris Sample called. Later, Chris Sample sent photos.";
  const second = t.lastIndexOf("Chris Sample");
  const m = Array(t.length).fill(0); for (let k = second; k < second + 12; k++) m[k] = 1;
  const f = check(t, { bold: m }).issues.filter((i) => i.rule === "bold-names");
  assert.equal(f.length, 1);
  assert.equal(f[0].start, t.indexOf("Chris Sample"));
});

test("bold-names: drop the class year for a member of the class being reported on", () => {
  const t = "57\nPat Example\n\nWe heard from Chris Sample ’57, who is well.";
  const f = check(t, { bold: boldMask(t, "Chris Sample") }).issues.filter((i) => i.rule === "bold-names");
  assert.equal(f.length, 1);
  assert.equal(applyFixes(t, f), "57\nPat Example\n\nWe heard from Chris Sample, who is well.");
});

test("bold-names: leading words and photo captions are skipped", () => {
  const t = "87\nPat Example\n\nYesterday Amy Hollander ’85 visited.\nAmy Hollander ’85 and Karen Newman ’87 at the World Tour";
  const f = check(t, { bold: boldMask(t) }).issues.filter((i) => i.rule === "bold-names");
  assert.deepEqual(f.map((i) => i.text), ["Amy Hollander"]);
});

test("applyFixesRich keeps bold through text fixes and applies bold fixes", () => {
  const t = "Amy Hollander ‘87 lives in Newark, NJ.";
  const issues = check(t, { bold: boldMask(t) }).issues;
  const r = require("../checker.js").applyFixesRich(t, boldMask(t), issues);
  assert.equal(r.text, "Amy Hollander ’87 lives in Newark, N.J.");
  assert.equal(r.bold.length, r.text.length);
  assert.equal(r.text.slice(0, 13), "Amy Hollander");
  assert.ok(r.bold.slice(0, 13).every(Boolean));
  assert.ok(!r.bold[14]);
});
