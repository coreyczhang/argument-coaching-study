# Feedback Display Policy

This document defines the current rule for when AI feedback should be shown to the player.

## Current Policy

Show corrective feedback only when at least one of these is true:

1. `reasoning.errors_found = true`
2. `clarify.clarification_needed = true`
3. `structure.relationship = "IRRELEVANT"`

Additional suppression rule:

- short but interpretable claims should pass without clarification feedback even if they are not highly detailed

Otherwise:

- do not interrupt play
- return `display_feedback = false`
- return `display_reason = "no_feedback_needed"`

## Why This Policy Exists

- reduce friction for acceptable tiles
- keep AI coaching targeted rather than constant
- separate detection logic from UI display decisions
- make display behavior measurable in logs
- prioritize false-positive avoidance in the first shipped version

## Current Display Reasons

- `reasoning_issue`
- `clarification_needed`
- `irrelevant_to_parent`
- `no_feedback_needed`

## Versioning

- current threshold version: `2026-04-17`

If the display policy changes, update:

- `THRESHOLD_VERSION` in `agents.py`
- this document
- logging/export expectations if new display states are introduced
