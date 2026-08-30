use crate::normalize::canonical_key;
use std::collections::HashMap;

pub struct SpellChecker {
    dict: HashMap<String, u64>,
    originals: HashMap<String, String>,
}

impl SpellChecker {
    pub fn from_words(words: impl Iterator<Item = (String, u64)>) -> Self {
        let mut dict = HashMap::new();
        let mut originals = HashMap::new();
        for (w, f) in words {
            let k = canonical_key(&w);
            match dict.get_mut(&k) {
                Some(cur) => {
                    if f > *cur {
                        *cur = f;
                        originals.insert(k, w);
                    }
                }
                None => {
                    dict.insert(k.clone(), f);
                    originals.insert(k, w);
                }
            }
        }
        Self { dict, originals }
    }

    pub fn suggest(&self, word: &str) -> Option<String> {
        let key = canonical_key(word);
        if let Some(orig) = self.originals.get(&key) {
            return Some(orig.clone());
        }
        let mut best: Option<(usize, u64, String)> = None;
        for (k, orig) in &self.originals {
            let Some(d) = bounded_levenshtein(&key, k, 2) else {
                continue;
            };
            let freq = self.dict.get(k).copied().unwrap_or(0);
            let better = match &best {
                None => true,
                Some((bd, bf, _)) => d < *bd || (d == *bd && freq > *bf),
            };
            if better {
                best = Some((d, freq, orig.clone()));
            }
        }
        best.map(|(_, _, o)| o)
    }
}

fn bounded_levenshtein(a: &str, b: &str, max: usize) -> Option<usize> {
    let (a, b): (Vec<char>, Vec<char>) = (a.chars().collect(), b.chars().collect());
    if a.len().abs_diff(b.len()) > max {
        return None;
    }
    let mut prev: Vec<usize> = (0..=b.len()).collect();
    for i in 1..=a.len() {
        let mut cur = vec![i];
        let mut row_min = i;
        for j in 1..=b.len() {
            let cost = usize::from(a[i - 1] != b[j - 1]);
            cur.push((prev[j] + 1).min(cur[j - 1] + 1).min(prev[j - 1] + cost));
            row_min = row_min.min(cur[j]);
        }
        if row_min > max {
            return None;
        }
        prev = cur;
    }
    (prev[b.len()] <= max).then_some(prev[b.len()])
}
