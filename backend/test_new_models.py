#!/usr/bin/env python3
"""
Test script for the new improved models
"""
import sys
import os
import pickle
from pathlib import Path

# Add the app directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app.config import MODEL_PATHS
from app.services.inference import load_models, models_data, models, scalers

def test_model_loading():
    """Test if all models load correctly"""
    print("🔍 Testing Model Loading...")
    print("=" * 50)
    
    # Print configured paths
    print("Configured model paths:")
    for lang, path in MODEL_PATHS.items():
        print(f"  {lang}: {path}")
        exists = os.path.exists(path)
        print(f"    Exists: {'✅' if exists else '❌'}")
        if exists:
            try:
                file_size = os.path.getsize(path) / (1024 * 1024)  # MB
                print(f"    Size: {file_size:.2f} MB")
            except Exception as e:
                print(f"    Size: Error - {e}")
    
    print("\n" + "=" * 50)
    
    # Load models
    print("Loading models...")
    load_models()
    
    print(f"\nLoaded models: {list(models.keys())}")
    print(f"Available model data: {list(models_data.keys())}")
    print(f"Available scalers: {list(scalers.keys())}")
    
    # Test each loaded model
    for lang in models.keys():
        print(f"\n📊 Testing {lang} model:")
        print("-" * 30)
        
        model_data = models_data.get(lang, {})
        model = models.get(lang)
        scaler = scalers.get(lang)
        
        print(f"  Model type: {type(model).__name__}")
        print(f"  Has scaler: {'✅' if scaler else '❌'}")
        
        if 'signs' in model_data:
            signs = model_data['signs']
            print(f"  Number of signs: {len(signs)}")
            print(f"  Signs: {signs[:10]}{'...' if len(signs) > 10 else ''}")
        
        if hasattr(model, 'n_features_in_'):
            print(f"  Expected features: {model.n_features_in_}")
        
        if hasattr(model, 'classes_'):
            print(f"  Number of classes: {len(model.classes_)}")
    
    return len(models) > 0

def test_model_inference():
    """Test model inference with dummy data"""
    print("\n🧪 Testing Model Inference...")
    print("=" * 50)
    
    if not models:
        print("❌ No models loaded, skipping inference test")
        return False
    
    # Create dummy landmark data (21 landmarks * 3 coordinates = 63 features)
    import numpy as np
    dummy_landmarks = np.random.rand(63).tolist()
    
    for lang in models.keys():
        print(f"\n🔬 Testing {lang} inference:")
        print("-" * 30)
        
        try:
            model = models[lang]
            scaler = scalers.get(lang)
            
            if scaler:
                # For models with scalers, we need to engineer features
                print("  Using feature engineering pipeline...")
                # This would normally be done in predict_sign function
                # For testing, we'll create dummy engineered features
                dummy_features = np.random.rand(106).reshape(1, -1)  # Expected feature count
                X_scaled = scaler.transform(dummy_features)
            else:
                # For old models, use raw landmarks
                print("  Using raw landmarks...")
                X_scaled = np.array(dummy_landmarks).reshape(1, -1)
            
            # Test prediction
            prediction = model.predict(X_scaled)[0]
            probabilities = model.predict_proba(X_scaled)[0]
            confidence = np.max(probabilities)
            
            print(f"  ✅ Prediction: {prediction}")
            print(f"  ✅ Confidence: {confidence:.3f}")
            print(f"  ✅ Input shape: {X_scaled.shape}")
            
        except Exception as e:
            print(f"  ❌ Error: {e}")
            return False
    
    return True

def test_model_comparison():
    """Compare old vs new models"""
    print("\n📈 Model Comparison...")
    print("=" * 50)
    
    # Check for old models in different locations
    old_model_paths = {
        'ASL': '../ai-training/trained_models/asl_model.pkl',
        'FSL': '../ai-training/trained_models/fsl_model.pkl'
    }
    
    for lang in ['ASL', 'FSL']:
        print(f"\n{lang} Models:")
        print("-" * 20)
        
        # Check old model
        old_path = old_model_paths[lang]
        if os.path.exists(old_path):
            try:
                with open(old_path, 'rb') as f:
                    old_data = pickle.load(f)
                old_signs = old_data.get('signs', [])
                print(f"  Old model: {len(old_signs)} signs")
            except:
                print(f"  Old model: Error loading")
        else:
            print(f"  Old model: Not found")
        
        # Check new model
        if lang in models_data:
            new_signs = models_data[lang].get('signs', [])
            print(f"  New model: {len(new_signs)} signs")
            
            # Compare if both exist
            if os.path.exists(old_path) and lang in models_data:
                try:
                    with open(old_path, 'rb') as f:
                        old_data = pickle.load(f)
                    old_signs = set(old_data.get('signs', []))
                    new_signs_set = set(new_signs)
                    
                    added = new_signs_set - old_signs
                    removed = old_signs - new_signs_set
                    
                    print(f"  📊 Added signs: {len(added)}")
                    if added:
                        print(f"     {list(added)[:5]}{'...' if len(added) > 5 else ''}")
                    
                    print(f"  📊 Removed signs: {len(removed)}")
                    if removed:
                        print(f"     {list(removed)[:5]}{'...' if len(removed) > 5 else ''}")
                        
                except Exception as e:
                    print(f"  ❌ Comparison error: {e}")
        else:
            print(f"  New model: Not loaded")

def main():
    """Run all tests"""
    print("🚀 Testing New Improved Models")
    print("=" * 60)
    
    success = True
    
    # Test 1: Model Loading
    if not test_model_loading():
        print("\n❌ Model loading failed!")
        success = False
    else:
        print("\n✅ Model loading successful!")
    
    # Test 2: Model Inference
    if not test_model_inference():
        print("\n❌ Model inference failed!")
        success = False
    else:
        print("\n✅ Model inference successful!")
    
    # Test 3: Model Comparison
    test_model_comparison()
    
    print("\n" + "=" * 60)
    if success:
        print("🎉 All tests passed! New models are ready to use.")
    else:
        print("⚠️  Some tests failed. Please check the model files.")
    
    return success

if __name__ == "__main__":
    main()