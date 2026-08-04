# Basement 45 Workout App

The app is ready to run as a local, server-free web page. Double-click `index.html`, or open it from your browser's **File → Open** command. No installation or internet connection is required for the app itself; the exercise demonstration links open YouTube search results when internet access is available.

At the top of the app:

- **Save file** (`Ctrl+S` / `Cmd+S`) connects a JSON file using Chrome or Edge's File System Access API. After the first file choice, changes autosave directly back to that file. Browser-local autosave remains active when no file is connected.
- **Open JSON** restores an existing workout file and connects it for subsequent autosaves. Browsers without direct-file support can still open JSON with the standard file chooser.
- **New week** archives the current selections, keeps locked exercises and saved loads/reps, generates a varied validated plan, and clears all round and random-activator checkmarks.

Each circuit scales from two to four in-round exercises: **Focused** has 2, **Standard** has 3, and **Challenge** has 4. Use the `−` and `+` controls in a circuit heading to remove or add a compatible exercise. Each circuit has separate checkboxes for rounds 1–3 and one for its random activator.

The replacement picker's **Setup score** estimates how much equipment or position change is needed between adjacent exercises: `0` is no setup change, `1` is a grip/body-position change, and `2` is one quick equipment adjustment. The app only offers scores from 0–2.

Eligibility remains the default, but **Show all library exercises** in the replacement picker allows an explicit manual override. In that mode, any unused, visible library exercise can be selected even when it is outside the slot's target or has a higher setup score; the circuit labels that transition as manual.

The Exercise Library supports user-added exercises. Built-in and user-added exercises can be hidden from recommendations or deleted; hidden exercises can be restored with **Show hidden**. Fixed shoulder/PT placeholders cannot be hidden or deleted.

Every exercise can be edited, annotated with a workout note, measured in repetitions or seconds, randomly replaced with an eligible option, reordered within a circuit, or removed when the circuit has more than two movements. The Settings page controls which weekdays appear and lets you edit each day's target and description.

The exercise library is generated from `basement_gym_exercise_library.xlsx`. If the workbook changes, run `powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\export-exercise-data.ps1` to refresh `exercise-data.js`.

## Exercise Recommendation Application Requirements

## Purpose

Build an application that recommends simple, practical exercise selections for a five-day strength-training split in a basement gym.

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
  - Single handles
  - Rope and other common cable attachments, when available
- REP Pepin adjustable dumbbells, up to 125 lb each
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
- Large commercial exercise machines

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

## Weekly Split

Use the following default five-day split:

1. Monday: Arms and upper body
2. Tuesday: Legs
3. Wednesday: Shoulders and rotator cuff
4. Thursday: Push
5. Friday: Pull

Do not automatically replace this split with push/pull/legs, upper/lower, or another standardized split. The current split is intentional.

## Standard Workout Structure

Each workout should normally contain three supersets.

Each superset contains:

1. Superset Exercise 1
2. Complement Exercise 2
3. Bridge Exercise performed between rounds

Repeat each group for three rounds.

Example:

```text
Superset Exercise 1: Incline neutral-grip dumbbell press
Complement Exercise 2: One-arm dumbbell row
Bridge Exercise: Dumbbell shrugs
```

### Bridge Exercises

A bridge exercise is an ancillary movement performed between rounds. It replaces part of the passive rest period without becoming the primary focus of the superset.

Typical bridge exercises include:

- Wall sits
- Calf raises
- Physical-therapy exercises
- Shrugs
- Forearm exercises
- Rotator-cuff exercises
- Core-stability exercises

The application should still permit a brief actual rest after the bridge exercise when needed for good technique.

## Repetition and Set Defaults

- Default prescription: 3 rounds of 10 repetitions
- Unilateral exercises: usually 10 repetitions per side
- More demanding total-body exercises: usually 5 to 8 controlled repetitions per side or 6 to 8 total repetitions
- Rotator-cuff exercises: usually 10 to 15 light, controlled repetitions
- Isometric bridge exercises: approximately 20 to 45 seconds
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

Monday bridge exercises may include shrugs, anti-rotation core work, carries, or other simple ancillary movements.

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
- Wall sits are a preferred bridge exercise.

Avoid relying on leg extensions or machine leg curls because those attachments are unavailable. Physio-ball or sliding hamstring curls are acceptable substitutes.

### Wednesday: Shoulders and Rotator Cuff

- Include rotator-cuff and scapular-stability work.
- The user has one personal shoulder exercise whose name is unknown.
- Preserve that movement using the placeholder `Shoulder Exercise Placeholder` until renamed.
- Standing rear-delt cable crossovers are specifically preferred.
- Overhead dumbbell presses must be seated.
- Favor neutral grips and controlled ranges of motion.
- Avoid excessive pressing volume because the previous dumbbell routine caused shoulder pain.
- Forearm work may be used as a bridge exercise.

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

- All chest and shoulder presses should use dumbbells rather than the FT2.
- Do not recommend FT2 cable chest presses.
- Standing cable chest fly variations are allowed and preferred cable-based chest movements.
- Overhead triceps extensions must be seated.
- Calf raises are a preferred bridge exercise.
- Favor neutral-grip dumbbell pressing when appropriate.
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

The following bridge exercises are fixed and must not be replaced:

- PT Exercise 1
- PT Exercise 2
- PT Exercise 3

The application must treat these as locked user-defined exercises even though their exact names are not yet stored.

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
day: Monday
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
    bridge_exercise_id: dumbbell-shrug
    rounds: 3
```

## Validation Rules

Before returning a workout, validate all of the following:

1. The recommendation uses only available equipment.
2. No standing overhead press is present.
3. No Smith-machine or leg-extension/curl-machine exercise is present.
4. No exact exercise is repeated elsewhere in the weekly plan.
5. Each day contains three supersets unless the user overrides the format.
6. Each superset contains two main exercises and one bridge exercise.
7. The estimated workout duration is approximately 45 minutes.
8. Superset transition costs are acceptable.
9. Monday contains three push and three pull movements.
10. Monday contains compound, total-body, and isolation categories for both push and pull.
11. Tuesday does not display a separate warm-up block.
12. Wednesday contains shoulder-health work and the shoulder placeholder.
13. Thursday contains no FT2 pressing exercise.
14. Thursday may contain standing cable flyes.
15. Friday preserves PT Exercises 1, 2, and 3.
16. All overhead pressing and overhead triceps extensions are seated.
17. Shoulder-sensitive and back-sensitive exercises have appropriate cautions or alternatives.

## Simplicity Requirements

The application should not overcomplicate the recommendation.

Default user-facing output should show only:

- Day and focus
- Superset number
- Exercise 1
- Complement exercise 2
- Bridge exercise
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
Random activator: Dumbbell shrugs

Superset 2 - Total Body
Push: [recommended integrated push]
Pull: Dumbbell clean
Random activator: Pallof press

Superset 3 - Isolation
Push: Dumbbell skull crusher
Pull: Incline dumbbell curl
Random activator: Farmer carry
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
