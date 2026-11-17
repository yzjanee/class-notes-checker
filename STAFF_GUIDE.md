# Class Notes Checker: Staff Guide

**Open it:** https://yzjanee.github.io/class-notes-checker/. It works in any browser, with no login or install. Nothing you paste leaves your computer.

## Checking a batch (about 5 minutes)

1. **Paste** the Class Notes straight from Google Docs, Word or email. Paragraphs and bold carry over. Put each class year on its own line (for example `57`) so the 2,000-word limit is checked for each class.
2. **Click Check.** Possible errors are highlighted:
   - **Yellow:** mechanical rules (dates, numbers, states, punctuation).
   - **Blue:** Chronicle style rules (bold names, commas, titles).
   - **Purple:** needs your judgment (events written in future tense).
3. **Review each highlight.** Click it to see the rule and the suggested fix, then click **Accept** or **Ignore**. You make the final call on every one. Keyboard shortcuts: `j`/`k` move between flags, `a` accepts, `i` ignores. **Accept all like this** applies one rule everywhere it appears.
4. **Click Copy corrected text** and paste it back into your document. Bold and paragraph breaks come with it.
5. **Click New batch** to start the next set.

## What it doesn't check (read for these yourself)

- Spelling of names and places.
- Bold for classmates mentioned without a class year.
- Missing states or countries in place names.
- Italic titles.
- Tone, and sensitive news such as deaths or illness.

The sidebar lists these under **Still check by hand**.

## Tips

- **Too many flags of one kind?** Click that rule in the sidebar to hide it.
- **A flag is wrong?** Click **Ignore**, and tell us about it (see below) so we can fix the rule.
- **Long section?** The checker warns when a class section runs over 2,000 words.
- **Two periods ("..")** are flagged with no automatic fix, because only you can tell whether it's a typo or a pause.

## Keeping the rules up to date

The rules live in two places: the [style guide](STYLE_GUIDE.md), which people read, and the checker's code, which applies them. **Updating the style guide alone does not change what the checker flags.**

**To request a change** to a rule, a new rule, or a fix for a wrong flag:

1. Write down the rule, plus one wrong → right example. For a wrong flag, copy the sentence it flagged.
2. Send it to **[maintainer name, email]**, or add it to the **[shared "Rule requests" doc]**.
3. The maintainer updates the style guide and the checker together, adds your example as a test, and tells you when it's live. The site updates about a minute after a change is saved.

**Who maintains it:** Jane Wei and Megan [last name] through [month, year]. Before then, we will move the project to a Peddie account or add a staff member as an owner, and we will show the next maintainer (a CS student or staff member) how to make an update. No paid accounts or services are needed.

## Planned update: AI tone checker (waiting on the Chronicle's decision)

We can add an optional AI step that reads each entry for tone and flags possibly sensitive news for you to review. If the Chronicle wants it, it would work like this:

- **Off by default.** The rule checker stays exactly as it is and keeps all text on your computer.
- **You turn it on for each batch.** It would send that batch's text to an AI service, so **the alumni office must approve it first** as a privacy matter.
- **It only suggests.** It would flag passages with a reason and never change your text.

**Status:** waiting for Ms. Harrington's decision. Nothing has been built.
