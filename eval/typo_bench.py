#!/usr/bin/env python3
"""
Bengali Spellcheck & Typo Correction Benchmark for Sondhan
Evaluates accuracy on typo pairs and measures false positive rates.
"""

import json
import os
import sys

# Sample known dictionary with frequencies
DEFAULT_DICT = {
    "বাংলাদেশ": 1000,
    "ঢাকা": 800,
    "রবীন্দ্রনাথ": 500,
    "ঠাকুর": 300,
    "ভাষা": 250,
    "পদ্মা": 200,
    "সেতু": 190,
    "গীতাঞ্জলি": 180,
    "মুক্তিযুদ্ধ": 170,
    "নোবেল": 160,
    "শহর": 150,
    "আন্দোলন": 140,
}

CONFUSION_MAP = {
    "ষ": "স", "শ": "স",
    "ণ": "ন",
    "ী": "ি", "ূ": "ু",
    "ৎ": "ত",
    "ঢ়": "ড়",
}

def canonical_key(word: str) -> str:
    res = []
    for c in word.strip():
        # normalize digits
        if "০" <= c <= "৯":
            res.append(chr(ord("0") + ord(c) - ord("০")))
        else:
            res.append(CONFUSION_MAP.get(c, c))
    return "".join(res)

def bounded_levenshtein(s1: str, s2: str, max_dist: int = 2) -> int:
    if abs(len(s1) - len(s2)) > max_dist:
        return max_dist + 1
    d = [[0] * (len(s2) + 1) for _ in range(len(s1) + 1)]
    for i in range(len(s1) + 1):
        d[i][0] = i
    for j in range(len(s2) + 1):
        d[0][j] = j
    for i in range(1, len(s1) + 1):
        min_row = d[i][0]
        for j in range(1, len(s2) + 1):
            cost = 0 if s1[i - 1] == s2[j - 1] else 1
            d[i][j] = min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost)
            min_row = min(min_row, d[i][j])
        if min_row > max_dist:
            return max_dist + 1
    return d[len(s1)][len(s2)]

def suggest_word(word: str) -> str | None:
    key = canonical_key(word)
    # Check exact dictionary match
    for w in DEFAULT_DICT:
        if w == word:
            return None # already correct, no correction needed
    # Check canonical key matches
    for w, freq in DEFAULT_DICT.items():
        if canonical_key(w) == key:
            return w
    # Check Levenshtein within distance 2
    best_cand = None
    best_dist = 3
    best_freq = -1
    for w, freq in DEFAULT_DICT.items():
        dist = bounded_levenshtein(key, canonical_key(w), 2)
        if dist <= 2:
            if dist < best_dist or (dist == best_dist and freq > best_freq):
                best_dist = dist
                best_freq = freq
                best_cand = w
    return best_cand

def suggest_query(query: str) -> str | None:
    words = query.strip().split()
    corrected_words = []
    changed = False
    for w in words:
        cand = suggest_word(w)
        if cand and cand != w:
            corrected_words.append(cand)
            changed = True
        else:
            corrected_words.append(w)
    return " ".join(corrected_words) if changed else None

def main():
    typos_file = os.path.join(os.path.dirname(__file__), "typos.json")
    if len(sys.argv) > 1 and os.path.exists(sys.argv[1]):
        typos_file = sys.argv[1]
    
    with open(typos_file, "r", encoding="utf-8") as f:
        pairs = json.load(f)
    
    ok = 0
    fp = 0
    print("==================================================")
    print("      সন্ধান (Sondhan) — Typo Benchmark Suite      ")
    print("==================================================")
    
    for p in pairs:
        wrong = p["wrong"]
        expected = p["right"]
        got = suggest_query(wrong)
        is_correct = (got == expected)
        if is_correct:
            ok += 1
        elif expected is None and got is not None:
            fp += 1
        
        status = "✓" if is_correct else "✗"
        print(f"[{status}] '{wrong}' -> '{got or '(none)'}' (expected: '{expected or '(none)'}')")
    
    acc = ok / len(pairs)
    print("--------------------------------------------------")
    print(f"Accuracy: {ok}/{len(pairs)} = {acc:.1%} | False Positives: {fp}")
    print("==================================================")
    sys.exit(0 if acc >= 0.8 else 1)

if __name__ == "__main__":
    main()
