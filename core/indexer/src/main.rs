use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Document {
    pub id: u64,
    pub title: String,
    pub body: String,
    pub url: String,
    pub lang: String,
}

#[derive(Default, Serialize, Deserialize)]
pub struct InvertedIndex {
    pub total_docs: usize,
    pub avg_doc_len: f32,
    // term -> Vec<(doc_id, term_frequency)>
    pub postings: HashMap<String, Vec<(u64, u32)>>,
}

impl InvertedIndex {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn index_document(&mut self, doc: &Document) {
        self.total_docs += 1;
        let tokens: Vec<String> = doc
            .title
            .split_whitespace()
            .chain(doc.body.split_whitespace())
            .map(|t| t.to_lowercase())
            .collect();

        let mut tf_map = HashMap::new();
        for t in tokens {
            *tf_map.entry(t).or_insert(0u32) += 1;
        }

        for (term, freq) in tf_map {
            self.postings
                .entry(term)
                .or_default()
                .push((doc.id, freq));
        }
    }

    pub fn search(&self, query: &str) -> Vec<(u64, f32)> {
        let q_terms: Vec<String> = query
            .split_whitespace()
            .map(|t| t.to_lowercase())
            .collect();

        let mut scores: HashMap<u64, f32> = HashMap::new();
        let k1 = 1.2;
        let b = 0.75;

        for term in q_terms {
            if let Some(postings) = self.postings.get(&term) {
                let df = postings.len() as f32;
                let idf = ((self.total_docs as f32 - df + 0.5) / (df + 0.5) + 1.0).ln();

                for (doc_id, tf) in postings {
                    let tf_val = *tf as f32;
                    let num = tf_val * (k1 + 1.0);
                    let den = tf_val + k1 * (1.0 - b + b);
                    let bm25 = idf * (num / den);
                    *scores.entry(*doc_id).or_insert(0.0) += bm25;
                }
            }
        }

        let mut results: Vec<(u64, f32)> = scores.into_iter().collect();
        results.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap_or(std::cmp::Ordering::Equal));
        results
    }
}

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt().init();
    tracing::info!("সন্ধান ইনডেক্সার সক্রিয় — ইনভার্টেড ইনডেক্স ও BM25 বিল্ডার");

    let mut index = InvertedIndex::new();

    let docs = vec![
        Document {
            id: 1,
            title: "রবীন্দ্রনাথ ঠাকুর সাহিত্য".to_string(),
            body: "রবীন্দ্রনাথ ঠাকুর ছিলেন বিখ্যাত নোবেল বিজয়ী কবি ও সাহিত্যিক। গীতাঞ্জলি কাব্যগ্রন্থের জন্য তিনি নোবেল পান।".to_string(),
            url: "https://bn.wikipedia.org/wiki/রবীন্দ্রনাথ_ঠাকুর".to_string(),
            lang: "bn".to_string(),
        },
        Document {
            id: 2,
            title: "পদ্মা সেতু প্রকল্প ও বাংলাদেশের অর্থনীতি".to_string(),
            body: "পদ্মা সেতু বাংলাদেশের একটি ঐতিহাসিক অবকাঠামোগত মাইলফলক। এটি অর্থনীতিতে ব্যাপক অবদান রাখছে।".to_string(),
            url: "https://bn.wikipedia.org/wiki/পদ্মা_সেতু".to_string(),
            lang: "bn".to_string(),
        },
        Document {
            id: 3,
            title: "কম্পিউটার বিজ্ঞান ও অ্যালগরিদম".to_string(),
            body: "তথ্য অনুসন্ধান ও সার্চ ইঞ্জিনে ইনভার্টেড ইনডেক্স এবং BM25 স্কোরিং অ্যালগরিদম ব্যবহৃত হয়।".to_string(),
            url: "https://bn.wikipedia.org/wiki/তথ্য_অনুসন্ধান".to_string(),
            lang: "bn".to_string(),
        },
    ];

    for d in &docs {
        tracing::info!("ইনডেক্স করা হচ্ছে ডকুমেন্ট #{}: '{}'", d.id, d.title);
        index.index_document(d);
    }

    tracing::info!(
        "ইনডেক্সিং সম্পন্ন: {} টি ডকুমেন্ট, {} টি ইউনিক টার্ম",
        index.total_docs,
        index.postings.len()
    );

    let test_query = "রবীন্দ্রনাথ নোবেল";
    let hits = index.search(test_query);
    tracing::info!("টেস্ট অনুসন্ধান ('{test_query}'): {:?}", hits);
}
