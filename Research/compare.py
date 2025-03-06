import json
import os
import textstat
import spacy
import matplotlib.pyplot as plt
import numpy as np
from collections import defaultdict
from language_tool_python import LanguageTool

# Load English NLP model
nlp = spacy.load("en_core_web_sm")

# Initialize LanguageTool API
lt = LanguageTool("en-US")

# Define function to load JSON files
def load_json(file_path):
    with open(file_path, "r", encoding="utf-8") as f:
        return json.load(f)

# Define function to analyze formality
def analyze_formality(text):
    doc = nlp(text)
    formal_words = set(["therefore", "hence", "thus", "moreover", "consequently", "nevertheless", "whereas"])
    informal_words = set(["hey", "thanks", "cheers", "gonna", "wanna", "kinda"])
    
    formal_count = sum(1 for token in doc if token.text.lower() in formal_words)
    informal_count = sum(1 for token in doc if token.text.lower() in informal_words)
    
    return max(0, formal_count - informal_count)  # More positive means more formal

# Define function to analyze clarity & readability
def analyze_readability(text):
    return textstat.flesch_kincaid_grade(text)

# Define function to analyze grammar quality
def analyze_grammar(text):
    try:
        matches = lt.check(text)
        return len(matches)  # Number of grammar issues detected
    except Exception as e:
        print(f"Grammar check error: {e}")
        return -1  # Error handling

# Define function to analyze conciseness
def analyze_conciseness(text):
    return len(text.split())

# Function to evaluate emails from all models
def evaluate_models(json_files):
    scores = defaultdict(lambda: defaultdict(list))
    
    for model, file in json_files.items():
        print(f"\nEvaluating model: {model}...")
        data = load_json(file)
        for email_data in data:
            email_text = email_data["email"]
            scores[model]["formality"].append(analyze_formality(email_text))
            scores[model]["readability"].append(analyze_readability(email_text))
            scores[model]["grammar_errors"].append(analyze_grammar(email_text))
            scores[model]["conciseness"].append(analyze_conciseness(email_text))
        print(f"Completed evaluation for {model}\n")
    
    return scores

# Define JSON files for each AI model
json_files = {
    "OpenAI-GPT-4o-mini": "gpt.json",
    "Google-Gemini-2.0-Flash": "gemini.json",
    "Claude-3.7-Sonnet": "claude.json",
    "Meta-Llama3-70b": "llama.json"
}

# Evaluate models
results = evaluate_models(json_files)

# Aggregate scores
final_scores = {}
for model, metrics in results.items():
    final_scores[model] = {
        "avg_formality": np.mean(metrics["formality"]),
        "avg_readability": np.mean(metrics["readability"]),
        "avg_grammar_errors": np.mean(metrics["grammar_errors"]),
        "avg_word_count": np.mean(metrics["conciseness"])
    }

# Print scores in a structured format
print("\nModel Evaluation Results:")
print("=" * 50)
for model, scores in final_scores.items():
    print(f"\n{model}:")
    print(f"  - Formality Score: {scores['avg_formality']:.2f}")
    print(f"  - Readability Score: {scores['avg_readability']:.2f}")
    print(f"  - Grammar Issues: {scores['avg_grammar_errors']:.2f}")
    print(f"  - Word Count: {scores['avg_word_count']:.2f}")
print("=" * 50)

# Normalize scores for fair comparison
normalized_scores = {}
for metric in ["avg_formality", "avg_readability", "avg_grammar_errors", "avg_word_count"]:
    values = np.array([final_scores[model][metric] for model in final_scores])
    min_val, max_val = values.min(), values.max()
    normalized_scores[metric] = {
        model: (final_scores[model][metric] - min_val) / (max_val - min_val) if max_val != min_val else 1.0
        for model in final_scores
    }

# Define weights for each metric
weights = {"avg_formality": 0.3, "avg_readability": 0.3, "avg_grammar_errors": -0.3, "avg_word_count": 0.1}

# Compute weighted scores
model_scores = {}
print("\nFinal Weighted Scores:")
print("=" * 50)
for model in final_scores:
    model_scores[model] = sum(weights[metric] * normalized_scores[metric][model] for metric in weights)
    print(f"{model}: {model_scores[model]:.4f}")
print("=" * 50)

# Determine the best model
best_model = max(model_scores, key=model_scores.get)
print(f"\nBest AI Model for Formal Emails: {best_model}\n")

# Visualization
models = list(final_scores.keys())
metrics = ["avg_formality", "avg_readability", "avg_grammar_errors", "avg_word_count"]
colors = ['blue', 'green', 'red', 'purple']

plt.figure(figsize=(12, 8))
for i, metric in enumerate(metrics):
    plt.subplot(2, 2, i + 1)
    values = [final_scores[model][metric] for model in models]
    bars = plt.bar(models, values, color=colors)
    plt.title(metric.replace("avg_", "").capitalize(), fontsize=14, fontweight='bold')
    plt.xticks(rotation=30, fontsize=10)
    plt.ylabel("Score", fontsize=12)
    plt.grid(axis='y', linestyle='--', alpha=0.7)
    
    for bar in bars:
        yval = bar.get_height()
        plt.text(bar.get_x() + bar.get_width()/2, yval * 0.9, f"{yval:.2f}", ha='center', va='top', fontsize=10, color='white', fontweight='bold')

plt.tight_layout()
plt.show()

# Final model score comparison graph
plt.figure(figsize=(8, 5))
final_values = [model_scores[model] for model in models]
bars = plt.bar(models, final_values, color=colors)
plt.title("Final Model Scores", fontsize=14, fontweight='bold')
plt.xticks(rotation=30, fontsize=10)
plt.ylabel("Score", fontsize=12)
plt.grid(axis='y', linestyle='--', alpha=0.7)

for bar in bars:
    yval = bar.get_height()
    plt.text(bar.get_x() + bar.get_width()/2, yval * 0.9, f"{yval:.4f}", ha='center', va='top', fontsize=10, color='white', fontweight='bold')

plt.show()
