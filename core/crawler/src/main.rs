mod dedupe;
mod extract;
mod fetch;

use std::collections::HashSet;

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt().init();
    tracing::info!("সন্ধান ক্রলার পাইপলাইন সক্রিয়করণ...");

    let seed_urls = vec![
        "https://bn.wikipedia.org/wiki/প্রধান_পাতা",
        "https://bn.wikisource.org",
        "https://bangla.bdnews24.com",
    ];

    let mut visited = HashSet::new();
    let mut fingerprints = HashSet::new();

    for url in seed_urls {
        if visited.contains(url) {
            continue;
        }
        tracing::info!("ক্রল করা হচ্ছে: {url}");
        visited.insert(url.to_string());

        match fetch::fetch_page(url).await {
            Ok(html) => {
                let doc = extract::extract_document(&html);
                let simhash = dedupe::compute_simhash(&doc.text);

                if fingerprints.contains(&simhash) {
                    tracing::warn!("ডুপ্লিকেট কনটেন্ট শনাক্ত হয়েছে (SimHash: {simhash:x}), বাদ দেওয়া হলো");
                    continue;
                }
                fingerprints.insert(simhash);

                tracing::info!(
                    "ডকুমেন্ট প্রক্রিয়াকৃত: '{}' (টেক্সট দৈর্ঘ্য: {} অক্ষর, লিংক সংখ্যা: {}, SimHash: {:x})",
                    doc.title,
                    doc.text.len(),
                    doc.links.len(),
                    simhash
                );
            }
            Err(e) => {
                tracing::warn!("ফেচ ত্রুটি ({url}): {e}");
            }
        }
    }

    tracing::info!("ক্রলিং সম্পন্ন: মোট {} টি ইউআরএল প্রক্রিয়াকৃত", visited.len());
}
