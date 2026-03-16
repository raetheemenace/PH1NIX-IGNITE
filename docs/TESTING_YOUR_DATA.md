# Testing Your Sign Language Videos

## Quick Test Process

### Step 1: Open the Test Notebook

1. Go to https://colab.research.google.com
2. Upload `ai-training/notebooks/quick_test.ipynb`
3. Click "Runtime" → "Run all" (or run cell by cell)

### Step 2: Upload Your Videos

When prompted, upload your "How Are You" videos (the ones you recorded)

### Step 3: Watch the Output

The notebook will show you:

```
✓ Uploaded 15 files

Processing video1.mp4...
  Processed 45 frames, extracted 45 hand samples

Processing video2.mp4...
  Processed 52 frames, extracted 52 hand samples

...

✓ Total samples extracted: 680
✓ Each sample has 63 features (21 landmarks × 3 coordinates)

✓ Good! You have 680 samples

Training samples: 544
Testing samples: 136

Training model...
✓ Model trained!
Test accuracy: 100.0%
```

### Step 4: Test with a New Video

Upload ONE more video (not from your training set) to see if it recognizes it.

## What the Results Mean

**✓ "Extracted X samples"**
- MediaPipe found hands in your videos
- Each frame with a visible hand = 1 sample

**✓ "Test accuracy: 100%"**
- With just one sign, this is normal
- It means MediaPipe successfully extracted hand positions

**⚠️ "No hands detected"**
- Videos too dark
- Hands not visible
- Hands cut off at edges
- Try recording with better lighting/positioning

**⚠️ "Very few samples"**
- Need more videos
- Or videos are too short
- Record 10-20 videos of 2-3 seconds each

## After Testing

If the test works:
1. ✓ Your videos are good quality
2. ✓ MediaPipe can detect your hands
3. ✓ Ready to record the other 4 signs
4. ✓ Then use the full training notebook

If the test fails:
1. Check video quality (lighting, hand visibility)
2. Record new videos with better conditions
3. Test again

## Common Issues

**"No hands detected in most frames"**
- Hands too far from camera → Move closer
- Bad lighting → Record near window or with lights on
- Hands moving too fast → Slow down the sign

**"Only extracted 10 samples from 15 videos"**
- Videos too short → Make them 2-3 seconds each
- Hands not visible most of the time → Keep hands in frame

**"Model accuracy is low"**
- This shouldn't happen with one sign
- If it does, videos might be too different from each other
- Try to be more consistent with the sign
