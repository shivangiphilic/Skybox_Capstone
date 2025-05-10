import json
import os
import textstat
import spacy
import matplotlib.pyplot as plt
import numpy as np
from collections import defaultdict
from language_tool_python import LanguageTool
import re
import importlib.util

# Check and install required packages
def install_if_missing(package):
    try:
        importlib.import_module(package)
        print(f"{package} is already installed.")
    except ImportError:
        import subprocess
        print(f"Installing {package}...")
        subprocess.check_call(["pip", "install", package])
        print(f"{package} has been installed.")

# Install dependencies
packages = ["vaderSentiment", "transformers", "lexical_diversity"]
for package in packages:
    install_if_missing(package)

# Now import the packages
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
import torch
from transformers import GPT2LMHeadModel, GPT2Tokenizer
from lexicalrichness import LexicalRichness

# Load English NLP model
print("Loading spaCy model...")
nlp = spacy.load("en_core_web_sm")

# Initialize LanguageTool API
print("Initializing LanguageTool...")
lt = LanguageTool("en-US")

# Initialize VADER sentiment analyzer
print("Initializing sentiment analyzer...")
sentiment_analyzer = SentimentIntensityAnalyzer()

# Initialize GPT-2 for perplexity calculation
print("Loading GPT-2 model for perplexity...")
tokenizer = GPT2Tokenizer.from_pretrained("gpt2")
model = GPT2LMHeadModel.from_pretrained("gpt2")
model.eval()

# Try to import PassivePy
passive_py_available = False
try:
    from PassivePySrc import PassivePy
    passivepy = PassivePy.PassivePyAnalyzer(spacy_model="en_core_web_sm")
    passive_py_available = True
    print("PassivePy initialized successfully.")
except ImportError:
    print("PassivePy not available. Using fallback passive voice detection.")

# Define function to load JSON files
def load_json(file_path):
    with open(file_path, "r", encoding="utf-8") as f:
        return json.load(f)

# Define function to analyze formality
def analyze_formality(text):
    doc = nlp(text)
    formal_words = set(["therefore", "hence", "thus", "moreover", "consequently",
                      "nevertheless", "whereas", "furthermore", "accordingly",
                      "alternatively", "subsequently", "notwithstanding"])

    informal_words = set(["hey", "thanks", "cheers", "gonna", "wanna", "kinda",
                        "yeah", "nope", "cool", "awesome", "stuff", "things",
                        "okay", "ok", "sure", "alright"])

    contractions = sum(1 for token in doc if "'" in token.text.lower())
    first_person = sum(1 for token in doc if token.text.lower() in ["i", "me", "my", "mine"])
    third_person = sum(1 for token in doc if token.text.lower() in ["one", "it", "they", "them"])

    formal_count = sum(1 for token in doc if token.text.lower() in formal_words)
    informal_count = sum(1 for token in doc if token.text.lower() in informal_words)

    # Calculate formality score with more factors
    formality_score = (formal_count - informal_count - contractions * 0.5 + third_person * 0.3 - first_person * 0.2)

    # Normalize by text length
    word_count = len([token for token in doc if token.is_alpha])
    if word_count > 0:
        formality_score = formality_score / (word_count / 100)  # Per 100 words

    return formality_score

# Define function to analyze lexical diversity
def analyze_lexical_diversity(text):
    try:
        if len(text.split()) < 10:  # Require minimum tokens
            return {"ttr": 0, "rttr": 0, "mtld": 0, "hdd": 0, "average": 0}

        lex = LexicalRichness(text)
        metrics = {
            "ttr": lex.ttr,
            "rttr": lex.rttr,
            "mtld": lex.mtld(threshold=0.72),
            "hdd": min(1.0, lex.hdd(draws=42))  # Cap at 1.0 for normalization
        }

        # Average the metrics
        metrics["average"] = sum(v for k, v in metrics.items() if k != "average") / 4
        return metrics
    except Exception as e:
        print(f"Lexical diversity calculation error: {e}")
        return {"ttr": 0, "rttr": 0, "mtld": 0, "hdd": 0, "average": 0}

# Define function to analyze sentiment
def analyze_sentiment(text):
    sentiment_scores = sentiment_analyzer.polarity_scores(text)

    # Calculate sentiment balance (how balanced vs. extreme)
    balance = 1 - abs(sentiment_scores['compound'])

    return {
        "compound": sentiment_scores['compound'],
        "positive": sentiment_scores['pos'],
        "negative": sentiment_scores['neg'],
        "neutral": sentiment_scores['neu'],
        "balance": balance
    }

# Define function to analyze passive voice
def analyze_passive_voice(text):
    if passive_py_available:
        try:
            results = passivepy.match_text(text, full_passive=True, truncated_passive=True)
            passive_count = results.get('passive_count', 0)
            sentence_count = max(1, len([s for s in nlp(text).sents]))
            return passive_count / sentence_count
        except Exception as e:
            print(f"PassivePy error: {e}")

    # Fallback: simple rule-based passive detection
    doc = nlp(text)
    passive_count = 0

    # Look for patterns like "was/were + past participle"
    for i, token in enumerate(doc):
        if token.text.lower() in ["was", "were", "is", "are", "am", "be", "being", "been"] and i < len(doc) - 1:
            # Check if followed by past participle
            if i + 1 < len(doc) and doc[i+1].tag_ == "VBN":
                passive_count += 1

    sentence_count = max(1, len([s for s in doc.sents]))
    return passive_count / sentence_count

# Define function to calculate perplexity
def calculate_perplexity(text):
    try:
        # Truncate long texts to avoid CUDA memory issues
        max_length = 512
        if len(text) > max_length * 4:  # Roughly 4 chars per token
            text = text[:max_length * 4]

        # Tokenize and calculate perplexity
        inputs = tokenizer(text, return_tensors="pt", truncation=True, max_length=max_length)
        with torch.no_grad():
            outputs = model(**inputs, labels=inputs["input_ids"])

        return torch.exp(outputs.loss).item()
    except Exception as e:
        print(f"Perplexity calculation error: {e}")
        return 100  # Default high value

# Define function to analyze clarity & readability using multiple metrics
def analyze_readability(text):
    metrics = {
        "flesch_kincaid": textstat.flesch_kincaid_grade(text),
        "gunning_fog": textstat.gunning_fog(text),
        "smog": textstat.smog_index(text),
        "coleman_liau": textstat.coleman_liau_index(text),
        "ari": textstat.automated_readability_index(text),
        "dale_chall": textstat.dale_chall_readability_score(text),
        "difficult_words": textstat.difficult_words(text) / max(1, len(text.split()))
    }

    # Calculate average readability across grade-level metrics
    grade_metrics = ["flesch_kincaid", "gunning_fog", "smog", "coleman_liau", "ari"]
    metrics["average_grade"] = sum(metrics[m] for m in grade_metrics) / len(grade_metrics)

    return metrics

# Define function to analyze grammar quality
def analyze_grammar(text):
    try:
        matches = lt.check(text)
        word_count = len(text.split())

        # Normalize by text length (errors per 100 words)
        error_density = len(matches) / (word_count / 100) if word_count > 0 else 0

        return {
            "error_count": len(matches),
            "error_density": error_density,
            "error_types": {match.ruleId: match.message for match in matches[:5]}  # Sample of error types
        }
    except Exception as e:
        print(f"Grammar check error: {e}")
        return {"error_count": 0, "error_density": 0, "error_types": {}}

# Define function to analyze conciseness
def analyze_conciseness(text):
    word_count = len(text.split())
    doc = nlp(text)

    # Calculate average sentence length
    sentences = list(doc.sents)
    if not sentences:
        return {"word_count": word_count, "avg_sentence_length": 0, "conciseness_score": 0}

    avg_sentence_length = word_count / len(sentences)

    # Calculate "filler word" ratio
    filler_words = ["basically", "actually", "literally", "really", "very",
                   "quite", "simply", "just", "so", "that", "totally",
                   "definitely", "certainly", "probably", "honestly"]

    filler_count = sum(1 for token in doc if token.text.lower() in filler_words)
    filler_ratio = filler_count / word_count if word_count > 0 else 0

    # Conciseness score (lower is better)
    # Penalize long sentences and high filler word usage
    conciseness_score = 1 - (avg_sentence_length / 40 * 0.5 + filler_ratio * 0.5)
    conciseness_score = max(0, min(1, conciseness_score))  # Bound between 0 and 1

    return {
        "word_count": word_count,
        "avg_sentence_length": avg_sentence_length,
        "filler_ratio": filler_ratio,
        "conciseness_score": conciseness_score
    }

# Define function to analyze text coherence
def analyze_coherence(text):
    sentences = list(nlp(text).sents)
    if len(sentences) < 3:
        return 1.0  # Not enough sentences for meaningful coherence

    # Get sentence embeddings
    embeddings = [sent.vector for sent in sentences]

    # Calculate average cosine similarity between adjacent sentences
    similarities = []
    for i in range(len(embeddings)-1):
        # Calculate cosine similarity
        norm_prod = np.linalg.norm(embeddings[i]) * np.linalg.norm(embeddings[i+1])
        if norm_prod == 0:  # Handle zero vectors
            similarity = 0
        else:
            similarity = np.dot(embeddings[i], embeddings[i+1]) / norm_prod
        similarities.append(similarity)

    # Also calculate global coherence (first and last sentences)
    if len(embeddings) > 2:
        norm_prod = np.linalg.norm(embeddings[0]) * np.linalg.norm(embeddings[-1])
        if norm_prod > 0:
            global_similarity = np.dot(embeddings[0], embeddings[-1]) / norm_prod
        else:
            global_similarity = 0
    else:
        global_similarity = 1.0

    # Combined coherence score (local and global)
    local_coherence = np.mean(similarities) if similarities else 1.0
    coherence_score = 0.7 * local_coherence + 0.3 * global_similarity

    return coherence_score

# Define function to detect email-specific features
def analyze_email_features(text):
    # Check for greeting
    greeting_patterns = [
        r'^(dear|hello|hi|good morning|good afternoon|good evening|hey)(\s|\s.*?\s)',
        r'^to whom it may concern',
        r'^greetings'
    ]
    has_greeting = any(re.search(pattern, text.lower()) for pattern in greeting_patterns)

    # Check for sign-off
    signoff_patterns = [
        r'(sincerely|regards|best regards|thanks|thank you|yours truly|cheers|best wishes|respectfully)(\s|\s.*?)(,|\n|$)',
        r'(looking forward|warmly|cordially)'
    ]
    has_signoff = any(re.search(pattern, text.lower()) for pattern in signoff_patterns)

    # Check for call to action
    cta_patterns = [
        r'(please|kindly)(\s|\s.*?)(let me know|contact|get back|reply|respond|send|provide)',
        r'(would you|could you)(\s|\s.*?)(please|kindly)',
        r'(looking forward to|await|expecting)(\s|\s.*?)(response|reply|hearing|feedback)'
    ]
    has_cta = any(re.search(pattern, text.lower()) for pattern in cta_patterns)

    # Check for subject line
    subject_patterns = [
        r'^subject:',
        r'^re:',
        r'^fwd:'
    ]
    has_subject = any(re.search(pattern, text.lower()) for pattern in subject_patterns)

    # Check for paragraphing
    paragraphs = [p for p in text.split('\n\n') if p.strip()]
    good_paragraphing = len(paragraphs) > 1

    return {
        "has_greeting": int(has_greeting),
        "has_signoff": int(has_signoff),
        "has_cta": int(has_cta),
        "has_subject": int(has_subject),
        "good_paragraphing": int(good_paragraphing),
        "structure_score": sum([int(has_greeting), int(has_signoff), int(has_cta),
                               int(has_subject), int(good_paragraphing)]) / 5
    }

# Function to evaluate emails from all models
def evaluate_models(json_files):
    scores = defaultdict(lambda: defaultdict(list))

    for model, file in json_files.items():
        print(f"\nEvaluating model: {model}...")
        data = load_json(file)
        for idx, email_data in enumerate(data):
            if idx % 10 == 0:
                print(f"Processing email {idx+1}/{len(data)}...")

            email_text = email_data["email"]

            # Original metrics
            scores[model]["formality"].append(analyze_formality(email_text))

            readability = analyze_readability(email_text)
            scores[model]["flesch_kincaid"].append(readability["flesch_kincaid"])
            scores[model]["gunning_fog"].append(readability["gunning_fog"])
            scores[model]["average_grade"].append(readability["average_grade"])

            grammar = analyze_grammar(email_text)
            scores[model]["grammar_error_density"].append(grammar["error_density"])

            conciseness = analyze_conciseness(email_text)
            scores[model]["word_count"].append(conciseness["word_count"])
            scores[model]["conciseness_score"].append(conciseness["conciseness_score"])

            # New metrics
            lex_diversity = analyze_lexical_diversity(email_text)
            scores[model]["lexical_diversity"].append(lex_diversity["average"])

            sentiment = analyze_sentiment(email_text)
            scores[model]["sentiment_compound"].append(sentiment["compound"])
            scores[model]["sentiment_balance"].append(sentiment["balance"])

            scores[model]["passive_ratio"].append(analyze_passive_voice(email_text))
            scores[model]["perplexity"].append(calculate_perplexity(email_text))
            scores[model]["coherence"].append(analyze_coherence(email_text))

            email_features = analyze_email_features(email_text)
            scores[model]["email_structure"].append(email_features["structure_score"])

        print(f"Completed evaluation for {model}")

    return scores

# Define JSON files for each AI model
json_files = {
    "OpenAI-GPT-4o-mini": "gpt.json",
    "Google-Gemini-2.0-Flash": "gemini.json",
    "Claude-3.7-Sonnet": "claude.json",
    "Meta-Llama3-70b": "llama.json"
}

# Evaluate models
print("Starting model evaluation...")
results = evaluate_models(json_files)

# Aggregate scores
final_scores = {}
for model, metrics in results.items():
    final_scores[model] = {
        # Original metrics
        "avg_formality": np.mean(metrics["formality"]),
        "avg_flesch_kincaid": np.mean(metrics["flesch_kincaid"]),
        "avg_gunning_fog": np.mean(metrics["gunning_fog"]),
        "avg_readability": np.mean(metrics["average_grade"]),
        "avg_grammar_errors": np.mean(metrics["grammar_error_density"]),
        "avg_word_count": np.mean(metrics["word_count"]),
        "avg_conciseness": np.mean(metrics["conciseness_score"]),

        # New metrics
        "avg_lexical_diversity": np.mean(metrics["lexical_diversity"]),
        "avg_sentiment": np.mean(metrics["sentiment_compound"]),
        "avg_sentiment_balance": np.mean(metrics["sentiment_balance"]),
        "avg_passive_ratio": np.mean(metrics["passive_ratio"]),
        "avg_perplexity": np.mean(metrics["perplexity"]),
        "avg_coherence": np.mean(metrics["coherence"]),
        "avg_email_structure": np.mean(metrics["email_structure"])
    }

# Print scores in a structured format
print("\nModel Evaluation Results:")
print("=" * 80)
for model, scores in final_scores.items():
    print(f"\n{model}:")
    print(f"  - Formality Score: {scores['avg_formality']:.2f}")
    print(f"  - Readability Grade: {scores['avg_readability']:.2f}")
    print(f"  - Grammar Errors (per 100 words): {scores['avg_grammar_errors']:.2f}")
    print(f"  - Word Count: {scores['avg_word_count']:.2f}")
    print(f"  - Conciseness Score: {scores['avg_conciseness']:.2f}")
    print(f"  - Lexical Diversity: {scores['avg_lexical_diversity']:.2f}")
    print(f"  - Sentiment Balance: {scores['avg_sentiment_balance']:.2f}")
    print(f"  - Passive Voice Ratio: {scores['avg_passive_ratio']:.2f}")
    print(f"  - Perplexity: {scores['avg_perplexity']:.2f}")
    print(f"  - Coherence Score: {scores['avg_coherence']:.2f}")
    print(f"  - Email Structure Score: {scores['avg_email_structure']:.2f}")
print("=" * 80)

# Normalize scores for fair comparison
normalized_scores = {}
metrics_to_normalize = [
    "avg_formality", "avg_readability", "avg_grammar_errors", "avg_conciseness",
    "avg_lexical_diversity", "avg_sentiment_balance", "avg_passive_ratio",
    "avg_perplexity", "avg_coherence", "avg_email_structure"
]

for metric in metrics_to_normalize:
    values = np.array([final_scores[model][metric] for model in final_scores])

    # Handle the special case where min_val equals max_val
    min_val, max_val = values.min(), values.max()
    if max_val == min_val:
        normalized_scores[metric] = {model: 0.5 for model in final_scores}
    else:
        # For metrics where lower is better, invert the normalization
        if metric in ["avg_grammar_errors", "avg_passive_ratio", "avg_perplexity"]:
            normalized_scores[metric] = {
                model: 1 - ((final_scores[model][metric] - min_val) / (max_val - min_val))
                for model in final_scores
            }
        else:
            normalized_scores[metric] = {
                model: (final_scores[model][metric] - min_val) / (max_val - min_val)
                for model in final_scores
            }

# Define weights for each metric
weights = {
    "avg_formality": 0.15,              # Importance of formal tone
    "avg_readability": 0.10,            # Appropriate reading level
    "avg_grammar_errors": 0.15,         # Grammatical correctness
    "avg_conciseness": 0.10,            # Concise communication
    "avg_lexical_diversity": 0.10,      # Vocabulary richness
    "avg_sentiment_balance": 0.05,      # Balanced tone
    "avg_passive_ratio": 0.05,          # Active vs passive voice
    "avg_perplexity": 0.10,             # Natural language flow
    "avg_coherence": 0.10,              # Logical flow
    "avg_email_structure": 0.10         # Professional structure
}

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

# Visualization - Multiple metrics comparison
models = list(final_scores.keys())
metrics = metrics_to_normalize
colors = plt.cm.tab10(np.linspace(0, 1, len(models)))

# Create a figure with multiple subplots
num_metrics = len(metrics)
rows = int(np.ceil(num_metrics / 2))  # Calculate number of rows needed
plt.figure(figsize=(15, rows * 4))

for i, metric in enumerate(metrics):
    plt.subplot(rows, 2, i + 1)
    values = [final_scores[model][metric] for model in models]
    bars = plt.bar(models, values, color=colors)

    # Format the title based on the metric name
    title = metric.replace("avg_", "").replace("_", " ").title()
    plt.title(title, fontsize=14, fontweight='bold')
    plt.xticks(rotation=30, fontsize=9)
    plt.ylabel("Score", fontsize=12)
    plt.grid(axis='y', linestyle='--', alpha=0.7)

    # Add value labels on bars
    for bar in bars:
        yval = bar.get_height()
        plt.text(bar.get_x() + bar.get_width()/2, yval * 0.9, f"{yval:.2f}",
                ha='center', va='top', fontsize=9, color='white', fontweight='bold')

plt.tight_layout()
plt.savefig("metrics_comparison.png", dpi=300)
plt.show()

# Final model score comparison graph
plt.figure(figsize=(10, 6))
final_values = [model_scores[model] for model in models]
bars = plt.bar(models, final_values, color=colors)
plt.title("Final Model Scores", fontsize=16, fontweight='bold')
plt.xticks(rotation=30, fontsize=12)
plt.ylabel("Score", fontsize=14)
plt.grid(axis='y', linestyle='--', alpha=0.7)

for bar in bars:
    yval = bar.get_height()
    plt.text(bar.get_x() + bar.get_width()/2, yval * 0.9, f"{yval:.4f}",
            ha='center', va='top', fontsize=11, color='white', fontweight='bold')

plt.tight_layout()
plt.savefig("final_scores.png", dpi=300)
plt.show()

# Create radar chart for visual comparison
plt.figure(figsize=(10, 8))
ax = plt.subplot(111, polar=True)

# Select key metrics for radar chart
radar_metrics = ["avg_formality", "avg_readability", "avg_grammar_errors",
                "avg_lexical_diversity", "avg_coherence", "avg_email_structure"]

# Number of variables
N = len(radar_metrics)

# What will be the angle of each axis in the plot
angles = [n / float(N) * 2 * np.pi for n in range(N)]
angles += angles[:1]  # Close the loop

# Draw one axis per variable + add labels
plt.xticks(angles[:-1], [m.replace("avg_", "").replace("_", " ").title() for m in radar_metrics], size=12)

# Draw ylabels
ax.set_rlabel_position(0)
plt.yticks([0.25, 0.5, 0.75], ["0.25", "0.5", "0.75"], color="grey", size=10)
plt.ylim(0, 1)

# Plot each model
for i, model in enumerate(models):
    values = [normalized_scores[metric][model] for metric in radar_metrics]
    values += values[:1]  # Close the loop

    ax.plot(angles, values, linewidth=2, linestyle='solid', label=model, color=colors[i])
    ax.fill(angles, values, color=colors[i], alpha=0.1)

# Add legend
plt.legend(loc='upper right', bbox_to_anchor=(0.1, 0.1))
plt.title("Model Comparison", size=16, y=1.1)

plt.tight_layout()
plt.savefig("radar_comparison.png", dpi=300)
plt.show()
