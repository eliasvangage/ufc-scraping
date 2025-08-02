import pandas as pd
import matplotlib.pyplot as plt
import os

# Load the CSV
df = pd.read_csv("predictions_export.csv")




# Make sure output folder exists
output_dir = "logs_visual/fight_charts"
os.makedirs(output_dir, exist_ok=True)

for i, row in df.iterrows():
    # Extract fight metadata
    fight_label = f"{row['fighter1']} vs {row['fighter2']}"
    winner = row['winner']
    confidence = row['confidence']

    # Extract all SHAP-weighted features (columns starting with 'feat_')
    features = row.filter(like='feat_')
    features = features.sort_values(key=abs).tail(5)  # Top 5 impactful features

    # Color: green (positive, helped), red (negative, hurt)
    colors = ['green' if val >= 0 else 'red' for val in features]

    # Plot
    plt.figure(figsize=(10, 6))
    bars = plt.barh(features.index, features.values, color=colors)
    plt.title(f"{fight_label}\nWinner: {winner} | Confidence: {confidence:.2f}%", fontsize=12)
    plt.xlabel("SHAP-weighted feature contribution")

    # Add value labels
    for bar in bars:
        plt.text(
            bar.get_width() + 0.05 * (1 if bar.get_width() > 0 else -1),
            bar.get_y() + bar.get_height() / 2,
            f"{bar.get_width():.2f}",
            va="center",
            ha="left" if bar.get_width() > 0 else "right",
            fontsize=9
        )

    # Save to file
    safe_filename = f"fight_{i+1}_{fight_label.replace(' ', '_').replace('/', '')}.png"
    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, safe_filename))
    plt.close()

print(f"✅ Saved {len(df)} visualizations to logs_visual/charts/")

