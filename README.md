# Basement 45 Workout App

The app is ready to run as a local, server-free web page. Double-click `index.html`, or open it from your browser's **File → Open** command. No installation or internet connection is required for the app itself; the exercise demonstration links open YouTube search results when internet access is available.

At the top of the app:

- **Save file** (`Ctrl+S` / `Cmd+S`) connects a JSON file using Chrome or Edge's File System Access API. After the first file choice, changes autosave directly back to that file. Browser-local autosave remains active when no file is connected.
- **Open JSON** restores an existing workout file and connects it for subsequent autosaves. Browsers without direct-file support can still open JSON with the standard file chooser.
- **New week** archives the current seven calendar days, starts with the next pending cycle, keeps cycle-locked exercises and saved loads/reps, generates fresh unlocked selections, and clears all round, optional-activator, and workout-timer state.

Each circuit starts with a non-blocking **Optional total-body activator** checkbox for use when time remains, followed by a sticky row of checkboxes for rounds 1–3 and two to four exercises: **Focused** has 2, **Standard** has 3, and **Challenge** has 4. The optional activator does not affect circuit completion or the timer. Use `−` to remove the last optional exercise or `+` to automatically add the highest-ranked compatible exercise. The day sidebar stays visible while the workout scrolls.

The sidebar includes a per-day workout timer. It remains disabled until the warm-up is complete, starts automatically when the final warm-up checkbox is checked, can be paused and resumed, and can be adjusted in five-minute steps while paused. Each of the nine round deadlines scales evenly with the selected duration, and an unchecked round turns red when its deadline passes. The timer stops after round nine, so warm-up and finisher time are excluded. Reset starts that day's selected time budget over.

Each circuit also has a collapsed optional total-body activator. Expanding it reveals one independently selectable exercise with its own completion checkbox, equipment, load, notes, and controls. It is not included in the circuit's exercise count, score, rounds, favorites, or completion state.

Workout settings define a continuous rotation of 1–16 named cycles instead of binding targets to weekdays. Each cycle has one of seven generation targets and can optionally be limited to selected body parts: Arms & upper, Legs, Shoulder & Rotator cuff, Push, Pull, Total Body, or Total Body - No Equipment. Cycles can be added, removed, named, and reordered. The seven weekday slots consume the rotation in order; marking any weekday as rest defers its pending cycle and shifts every later assignment forward. Removing the rest day shifts the sequence back. The rotation continues across week boundaries.

Every occurrence receives newly generated unlocked exercises. Locking an exercise stores that position on its cycle, immediately updates later unstarted occurrences of that cycle, and carries it into future weeks. Target, body-part, rest-day, removal, and reorder changes ask for confirmation before clearing affected progress. The no-equipment target restricts both circuit exercises and optional activators to movements requiring no weights, benches, bands, cable attachments, or machines.

Use the star in a circuit heading to name and save its exact exercise combination as a favorite. The adjacent favorites button substitutes a saved favorite into the same cycle and circuit position when none of its exercises conflict with the rest of the current week.

The replacement picker automatically shows every unused exercise that works at least one of the day's target muscles. The eligibility panel lists those muscles, while fuzzy search plus body-part and equipment filters can narrow the results. Equipment aliases are grouped, so **FT**, **FT2**, **Functional trainer**, and cable-based setups all match the same FT filter. Each result lists its worked muscles and required equipment. **Add exercise** opens the library form and returns to the same swap after saving. Random replacement works through unseen eligible exercises before widening its search beyond the target-muscle pool. This automatic eligibility filter is separate from the score shown on workout cards.

Eligibility remains the default, but **Show all library exercises** removes the day-muscle restriction. Search, body-part, and equipment filters still apply when selected.

Every exercise now has a checkbox selection of all body parts in its detail form. Reps/time, load, and whether the load is total or used by each hand or side are also edited in the detail form and remain available on workout cards; the library rows stay compact.

The Exercise Library supports user-added exercises plus a built-in equipment expansion for the functional-trainer attachments, bands, kettlebell, physio ball, back-extension machine, pull-up bar, and bench. **Edit equipment** maintains a master equipment list in the saved JSON; names are compared case-insensitively and common aliases such as FT, FT2, Functional trainer, cable, dumbbell(s), and band(s) are deduplicated. Exercise details select required equipment from this shared list instead of accepting separate free-form variety names. Each exercise also has an editable primary setup, a **Both sides** setting, and a 1–5 effectiveness rating. Difficulty and global setup scores are not part of the user-facing scoring model. The exercise results use their own vertical scroll area so the library header, filters, and counts remain visible while browsing.

Workout cards show required equipment, both-sides status, thumbs-up/down controls, and a pencil button for editing the exercise directly. Effectiveness, setup, and exercise score appear as three evenly spaced informational pills. Each assignment has a manual setup-ease score from 0–5; its exercise score is effectiveness plus setup, and the circuit header shows the sum of every exercise score. Setup scores are saved with the circuit and restored by named favorites. Adding, removing, replacing, or reordering an exercise clears that circuit's setup scores because its context changed.

Four small checks beside each load track completed workouts at that load. Completing all three rounds credits every exercise in the circuit once. After four credited workouts, an **Increase load** button appears for the next session; choosing a higher load resets the checks. Manually editing the load also resets them. A populated load field is highlighted so recommended or saved weights are easy to spot. Built-in and user-added exercises can be hidden directly from a workout, the swap picker, or the library; hidden exercises can be restored with **Show hidden**. Equipment-expansion movements are treated as built-in and receive a demonstration search link by default. The shoulder placeholder remains fixed; PT Exercises 1–3 are unlocked library entries.

The finisher contains only the core-complete checkbox; the previous 20-minute cardio item has been removed.

The header shows the connected JSON filename and the most specific path the browser exposes. Standard browser security normally hides a local file's absolute parent path, so a browser may display only the filename even though autosave is connected.

Every exercise can be edited, annotated with a workout note, measured in repetitions or seconds, randomly replaced with an eligible option, reordered within a circuit, or removed when the circuit has more than two movements. The Settings page manages cycle order, names, targets, body parts, and descriptions. Schema v18 intentionally starts a fresh cycle-based data file rather than migrating the former weekday-bound schema; subsequent v18 saves reload normally and portable library records can recover missing custom exercises.

The exercise library is generated from `basement_gym_exercise_library.xlsx`. If the workbook changes, run `powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\export-exercise-data.ps1` to refresh `exercise-data.js`.

## Exercise Recommendation Application Requirements

## Purpose

Build an application that recommends simple, practical exercise selections for a flexible 1–16-cycle strength-training rotation in a basement gym.

The application should prioritize:

- Exercises that match the available equipment
- Easy transitions within supersets
- Balanced movement selection
- Shoulder-friendly options
- Back-conscious lower-body training
- General fitness, longevity, and golf performance
- Workouts that can be completed in approximately 45 minutes

The application is an exercise recommendation tool, not a medical diagnostic tool. It should allow painful exercises to be replaced and should not encourage users to train through sharp, worsening, or persistent pain.

## User Profile and Goals

- Age range: 40s
- Primary goals:
  - Maintain general fitness
  - Support long-term strength and mobility
  - Improve golf performance
  - Reduce body fat, with a personal skinfold-caliper goal of 17 mm
- Preferred workout duration: approximately 45 minutes
- Preferred training style: simple supersets with minimal equipment changes
- Loading preference: the user will determine working weights, but the application may recommend conservative starting loads or effort targets

## Available Equipment

The recommendation engine may select exercises using the following equipment:

- Inspire FT2 functional trainer
  - Adjustable dual cable pulleys
  - Lat-pulldown attachment
  - Pull-up bar
  - Curl bar
  - Straight bar
  - Low-row handle
  - D-handles
  - Ankle straps
  - Triceps pushdown rope
- REP Pepin adjustable dumbbells, up to 125 lb each
- Kettlebell
- Resistance bands
- Back-extension machine
- Adjustable bench
- Light squat rack
- Barbell and weight plates
- Physio ball
- Body weight
- Walls and suitable floor space

## Unavailable Equipment

Do not recommend exercises that require the following unless the user later adds the equipment:

- Smith machine
- Leg-extension attachment
- Leg-curl attachment
- Other large commercial exercise machines

## Environment Constraints

### Low Ceiling

The gym is in a basement with a low ceiling.

- All overhead pressing must be performed seated.
- Do not recommend standing overhead presses.
- Dumbbell cleans must finish at shoulder height unless adequate clearance is explicitly confirmed.
- Avoid overhead jumps or other movements requiring substantial vertical clearance.
- Standing non-overhead exercises are acceptable.

### Space and Setup

- Favor exercises that work in a compact basement gym.
- Avoid recommendations that require long walking distances, large open areas, or frequent relocation of equipment.
- Carries may be recommended only when enough safe floor space is available.

## Default Cycle Rotation

Use the following default five-cycle rotation:

1. Cycle 1: Arms and upper body
2. Cycle 2: Legs
3. Cycle 3: Shoulders and rotator cuff
4. Cycle 4: Push
5. Cycle 5: Pull

Calendar weekdays round-robin through these cycles. Users may rename, reorder, add, or remove cycles and may build alternatives such as push/pull/legs without changing the calendar-day model.

## Standard Workout Structure

Each workout should normally contain three circuits.

Each circuit contains two to four exercises selected for compatible movement roles and quick equipment transitions.

Repeat each circuit for three rounds. The separate total-body activator slot has been removed to keep the main workout within 45 minutes.

Example:

```text
Circuit Exercise 1: Incline neutral-grip dumbbell press
Circuit Exercise 2: One-arm dumbbell row
```

## Repetition and Set Defaults

- Default prescription: 3 rounds of 10 repetitions
- Unilateral exercises: usually 10 repetitions per side
- Rotator-cuff exercises: usually 10 to 15 light, controlled repetitions
- The user may override repetitions and weights at any time

Avoid displaying redundant set notation. If the workout already states that a superset is repeated for three rounds, do not also label each individual exercise as `3 x 10` unless required by the interface.

## Loading Guidance

Weights change frequently and should remain editable.

When recommending a starting load:

- Prefer a conservative estimate.
- Target approximately 2 to 3 repetitions in reserve.
- Prioritize controlled technique over load.
- Use especially conservative loading for shoulder exercises, squats, Romanian deadlifts, and deadlifts.
- Do not assume cable-stack numbers transfer directly between different machines.
- Treat the `@` notation as weight in pounds when importing existing plans. For example, `cable row @ 45` means a cable row performed with a displayed weight of 45 lb.

## Exercise Selection Rules

### General Rules

- Do not repeat the same exercise within the weekly plan.
- Favor a balance between the FT2, dumbbells, barbell, bench, physio ball, and body-weight exercises.
- Do not build the entire program around the FT2.
- Recommendations should remain simple rather than maximizing novelty.
- Prefer stable, familiar movements over highly technical exercises.
- Provide a demonstration or instructional link for exercises that may be unfamiliar.
- Allow fixed user-defined exercises to be locked so the recommendation engine cannot replace them.

### Superset Transition Rules

Transitions between the two main exercises in a superset must be easy.

Prefer pairings that:

- Use the same dumbbell weight
- Use the same bench position
- Use adjacent FT2 pulley positions
- Use the same cable attachment
- Pair one dumbbell exercise with one nearby body-weight exercise
- Avoid moving the bench repeatedly
- Avoid loading and unloading the barbell between exercises
- Avoid major pulley-height changes between paired cable exercises
- Avoid switching the FT2 between several attachments during one superset

The application should assign a transition-cost score to each pairing.

Suggested scoring:

```text
0 = No setup change
1 = Small change, such as body position or grip
2 = One quick adjustment, such as dumbbell weight or pulley height
3 = Attachment or bench-position change
4 = Significant equipment movement or barbell plate change
5 = Impractical pairing for a timed superset
```

Prefer supersets with a transition cost of 0 to 2. Avoid scores of 4 or 5 unless the user explicitly requests the pairing.

## Day-Specific Requirements

### Monday: Arms and Upper Body

Monday should contain exactly:

- Three push-type movements
- Three pull-type movements

The three push movements should represent:

1. One compound push
2. One total-body or integrated push
3. One isolated push

The three pull movements should represent:

1. One compound pull
2. One total-body or integrated pull
3. One isolated pull

Recommended pairing pattern:

```text
Superset 1: Compound push + compound pull
Superset 2: Total-body push + total-body pull
Superset 3: Isolated push + isolated pull
```

Do not allow Monday to become heavily push-dominant or pull-dominant.

### Tuesday: Legs

- Do not add a separate warm-up section to the displayed workout.
- Barbell squats are available and may be recommended.
- Favor lighter squat loading and multiple progressive squat sets to protect the back.
- The first squat round may function as a lighter ramp-up round.
- Favor controlled depth and a stable setup.
- Barbell box squats may be used when appropriate.
- Include a balance of squat, hinge, unilateral, hip, and stability patterns.
- Physio-ball exercises are available.

Avoid relying on leg extensions or machine leg curls because those attachments are unavailable. Physio-ball or sliding hamstring curls are acceptable substitutes.

### Wednesday: Shoulders and Rotator Cuff

- Include rotator-cuff and scapular-stability work.
- The user has one personal shoulder exercise whose name is unknown.
- Preserve that movement using the placeholder `Shoulder Exercise Placeholder` until renamed.
- Standing rear-delt cable crossovers are specifically preferred.
- Overhead dumbbell presses must be seated.
- Favor neutral grips and controlled ranges of motion.
- Avoid excessive pressing volume because the previous dumbbell routine caused shoulder pain.
- Shoulder-health movements remain main-round options when appropriate.

Possible shoulder-health movements include:

- Cable external rotation
- Face pulls
- Face pulls with external rotation
- Dumbbell scaption raises
- Wall slides
- Prone Y, T, or W raises
- Scapular push-ups

These movements are options, not medical treatment.

### Thursday: Push

- Chest, shoulder, and triceps exercises may use dumbbells, body weight, or the FT.
- FT cable presses, flyes, raises, and triceps movements qualify when they target a Push muscle.
- Overhead triceps extensions must be seated.
- Favor neutral-grip pressing when appropriate.
- Avoid duplicating Monday's exact pressing exercises.

### Friday: Pull

Pull-day recommendations may use:

- Pull-up bar
- Lat-pulldown attachment
- Cable rows
- Dumbbell rows
- Barbell hinges or deadlifts
- Dumbbell or cable curls
- FT2 curl bar

PT Exercises 1, 2, and 3 remain user-defined library entries. They are unlocked and may be edited, hidden, deleted, or selected manually like other library exercises.

## Pain and Safety Constraints

### Shoulder

The previous dumbbell program caused shoulder pain.

The recommendation engine should:

- Prefer neutral-grip pressing
- Include rotator-cuff and scapular-stability exercises
- Use lower starting weights for unfamiliar dumbbell movements
- Avoid aggressive ranges of motion in flyes
- Avoid redundant pressing volume
- Flag exercises that commonly require substantial shoulder mobility
- Offer substitutions when an exercise causes pain

Do not suggest training through sharp pain, painful catching, instability, unexpected weakness, or worsening symptoms.

### Back

The user wants to protect the back during squat training.

The recommendation engine should:

- Favor conservative squat and hinge loading
- Prefer controlled repetitions
- Avoid pairing two highly fatiguing spinal-loading exercises in the same superset
- Avoid pairing heavy squats directly with heavy deadlifts
- Allow box squats, goblet squats, split squats, and supported variations
- Keep high-skill barbell exercises optional

## Golf-Supportive Recommendations

Golf-supportive exercises may be included without turning the program into a golf-only routine.

Prioritize:

- Anti-rotation strength
- Controlled cable rotation
- Hip strength
- Single-leg balance
- Thoracic mobility
- Grip strength
- Trunk stability
- Asymmetrically loaded exercises

Useful options include:

- Pallof press
- Cable wood chop
- Cable lift
- Suitcase carry
- Split-stance cable row
- Airplane balance exercise
- Single-leg Romanian deadlift
- Asymmetrically loaded reverse lunge

Avoid high-speed loaded rotation unless the user explicitly requests advanced power training and has demonstrated appropriate control.

## Recommendation Data Model

Each exercise record should support at least the following fields:

```yaml
id: string
name: string
primary_body_part: string
secondary_body_parts: string[]
movement_pattern: string
movement_role: compound | total_body | isolation | bridge
force_type: push | pull | hinge | squat | carry | rotation | anti_rotation | isometric | other
equipment: string[]
setup_location: string
bench_position: flat | incline | seated_upright | none
pulley_height: low | middle | high | variable | none
attachment: string | null
unilateral: boolean
overhead: boolean
must_be_seated: boolean
shoulder_caution: boolean
back_caution: boolean
technical_difficulty: beginner | intermediate | advanced
default_reps: string
instruction_url: string | null
user_locked: boolean
notes: string | null
```

## Recommendation Output Model

A recommended day should be representable as:

```yaml
calendar_day: Monday
cycle: Cycle 1
focus: Arms and Upper Body
supersets:
  - number: 1
    category: Compound
    exercise_1:
      role: Push
      exercise_id: incline-neutral-grip-dumbbell-press
    exercise_2:
      role: Pull
      exercise_id: one-arm-dumbbell-row
    rounds: 3
```

## Validation Rules

Before returning a workout, validate all of the following:

1. The recommendation uses only available equipment.
2. No standing overhead press is present.
3. No Smith-machine or leg-extension/curl-machine exercise is present.
4. Unlocked exercises should vary across cycle occurrences when the qualification pool permits; cycle-locked exercises may repeat intentionally.
5. Each training day contains three supersets unless the user overrides the format; rest days contain none.
6. Each circuit contains two to four exercises and three tracked rounds.
7. The nine round deadlines scale evenly within an adjustable workout timer; warm-up and finisher time are excluded.
8. Superset transition costs are acceptable.
9. Monday contains three push and three pull movements.
10. Monday contains compound, total-body, and isolation categories for both push and pull.
11. Tuesday does not display a separate warm-up block.
12. Wednesday contains shoulder-health work and the shoulder placeholder.
13. Replacement eligibility works from each day's target muscles across all selected equipment.
14. Thursday may contain qualifying FT presses, flyes, raises, and triceps movements.
15. PT Exercises 1, 2, and 3 remain unlocked library entries.
16. All overhead pressing and overhead triceps extensions are seated.
17. Shoulder-sensitive and back-sensitive exercises have appropriate cautions or alternatives.

## Simplicity Requirements

The application should not overcomplicate the recommendation.

Default user-facing output should show only:

- Day and focus
- Superset number
- Exercise 1
- Complement exercise 2
- Repetitions
- Suggested or user-entered weight
- Completion checkboxes, when tracking is enabled

Do not require notes, detailed analytics, recovery scores, or complex periodization unless the user enables those features.

## Example User-Facing Format

```text
Monday - Arms and Upper Body

Superset 1 - Compound
Push: Incline neutral-grip dumbbell press
Pull: One-arm dumbbell row

Superset 2 - Total Body
Push: [recommended integrated push]
Pull: Dumbbell clean

Superset 3 - Isolation
Push: Dumbbell skull crusher
Pull: Incline dumbbell curl
```

## Future User-Configurable Settings

The application may later expose these settings:

- Available equipment
- Ceiling height restrictions
- Preferred weekly split
- Session duration
- Number of supersets
- Preferred repetition range
- Exercises to include or exclude
- Locked PT exercises
- Pain-sensitive body parts
- Maximum transition cost
- Golf emphasis
- Body-weight-only mode
- Dumbbell-only mode
- Cable-only mode

## Important Interpretation Notes

- `Physio` refers to a physio ball, not `plyometric`.
- `RDL` means Romanian deadlift.
- `@` indicates weight in pounds.
- `3 x 10` means three sets of ten repetitions.
- Existing whiteboard notation may repeat `3x` unnecessarily. The application should normalize redundant notation.
- Some listed movements may contain two linked actions because either action alone is too easy. The application should support combination exercises without automatically splitting the combination into separate exercises.
