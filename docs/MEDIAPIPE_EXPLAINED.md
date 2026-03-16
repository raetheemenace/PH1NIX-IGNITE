# MediaPipe Hand Landmarks Explained

## What MediaPipe Does

MediaPipe is Google's pre-trained AI that detects hands and finds 21 specific points on each hand.

## The 21 Hand Landmarks

```
        8   12  16  20
        |   |   |   |
    4   7   11  15  19
    |   |   |   |   |
    3   6   10  14  18
    |   |   |   |   |
    2   5   9   13  17
    |   |   |   |   |
    1   |   |   |   |
    |   |   |   |   |
    0───────────────────  (Wrist)

0  = Wrist
1  = Thumb base
2  = Thumb middle
3  = Thumb knuckle
4  = Thumb tip
5  = Index finger base
6  = Index finger middle
7  = Index finger knuckle
8  = Index finger tip
9  = Middle finger base
10 = Middle finger middle
11 = Middle finger knuckle
12 = Middle finger tip
13 = Ring finger base
14 = Ring finger middle
15 = Ring finger knuckle
16 = Ring finger tip
17 = Pinky base
18 = Pinky middle
19 = Pinky knuckle
20 = Pinky tip
```

## Example: KAMUSTA Sign

Let's say KAMUSTA is a wave near your face:

```
Frame 1 (hand starting position):
Landmark 0 (wrist): x=0.45, y=0.60, z=0.05
Landmark 4 (thumb): x=0.50, y=0.55, z=0.08
Landmark 8 (index): x=0.55, y=0.50, z=0.10
... (18 more landmarks)

Frame 2 (hand moved right):
Landmark 0 (wrist): x=0.55, y=0.60, z=0.05
Landmark 4 (thumb): x=0.60, y=0.55, z=0.08
Landmark 8 (index): x=0.65, y=0.50, z=0.10
... (18 more landmarks)
```

The model learns: "When landmarks move in THIS pattern, it's KAMUSTA"

## Why 63 Numbers?

21 landmarks × 3 coordinates (x, y, z) = 63 numbers per frame

These 63 numbers describe the EXACT position and shape of your hand.

## Different Signs = Different Patterns

**KAMUSTA** (wave):
- Fingers extended
- Hand moves side to side
- Near face level

**SALAMAT** (thank you):
- Hand near chin
- Fingers together
- Moves forward

**TULONG** (help):
- One hand on top of other
- Specific finger positions

Each sign creates a unique pattern in those 63 numbers. The AI learns to recognize these patterns.
