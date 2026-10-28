# Class Notes Checker

A style guide and an automated checker for alumni Class Notes submissions to the *Peddie Chronicle*.

1. **[Style guide](STYLE_GUIDE.md):** the master proofreading document. It covers spelling, punctuation, state abbreviations and AP-style formatting (dates, numbers, titles, class-year apostrophes), with a wrong → right example for each rule.
2. **[Checker](index.html):** paste in a batch of Class Notes to see every likely error highlighted, with the rule it breaks and a suggested fix. Accept or ignore each one, then copy out the corrected text. The editor makes the final call.

## Using the checker

Open `index.html` in a browser. No install, account or internet is needed, and the text you paste never leaves the page.

1. Paste the Class Notes. Keep each class year on its own line (for example `57`) so the 2,000-word limit is checked per class.
2. Click **Check**. Highlights are color-coded:
   - Yellow: mechanical rules.
   - Blue: style rules.
   - Purple: needs an editor's judgment, such as future-tense events.
3. Click a highlight, or press `j` / `k` to step through them. Press `a` to accept a fix and `i` to ignore it. **Accept all like this** applies one rule everywhere it appears.
4. Click **Copy corrected text**, or **Edit text** to keep working with your accepted fixes applied.

Click a rule in the sidebar to hide its flags. The **Still check by hand** list covers what plain text can't show, such as bolding names on first mention.

## What it found in past issues

As a test, the checker was run on two published issues: Spring 2025 (about 22,000 words) and Summer 2026 (about 22,000 words). Both had already been edited, so every flag below is an error that **survived a hand edit** or a false alarm. The counts tell us which rules are hardest to apply by hand.

| Rule | Spring 2025 | Summer 2026 |
| --- | ---: | ---: |
| Future-tense events to recheck | 36 | 27 |
| Family and friends commas (*his wife Nancy*) | 2 | 25 |
| Quotes (unclosed, or single quotes used as primary quotes) | 8 | 15 |
| Numbered Reunion not capitalized (*our 50th reunion*) | 1 | 12 |
| State written out or as a postal code after a city | 1 | 10 |
| Straight or opening quote before a class year (*'87*) | 7 | 10 |
| Sections over 2,000 words | 2 | 1 |
| Everything else (ages, numbers, degrees, date ordinals, typos, serial commas) | 9 | 10 |

Class-year apostrophes appeared mostly in photo captions. The family-commas count in Summer 2026 suggests that rule isn't applied consistently.

## Development

The rules live in `checker.js`, which works in the browser and in Node. Tests in `tests/checker.test.js` pair each style-guide example with what should and shouldn't be flagged:

```bash
node --test tests/checker.test.js
```

Past issues and raw submissions contain alumni contact details, so `.gitignore` keeps PDFs out of the repo.
