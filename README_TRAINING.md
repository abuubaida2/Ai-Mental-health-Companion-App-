Training and Evaluation
-----------------------

Text model (GoEmotions)
- Prepare dataset (optional - script downloads automatically):
  - `python ml/train_text_full.py --output_dir ml/models/text_model --model_name distilbert-base-uncased --epochs 3` 

Audio model (RAVDESS / CREMA-D)
- Preprocess raw WAVs to MFCC .npy files:
  - `python ml/audio_preprocess.py --input_dir path/to/wavs --output_dir ml/audio_features`
- Train using saved features:
  - `python ml/train_audio.py --feature_dir ml/audio_features --output_dir ml/models/audio_model --epochs 10`

Evaluation
- Text evaluation:
  - `python ml/evaluate_text.py --model_dir ml/models/text_model`

Notes
- Training on CPU can be slow. For best results use a GPU-enabled machine.
- The scripts are templates and may require dataset-specific adjustments (especially audio labels and dataset parsing for RAVDESS/CREMA-D).
