pub fn tokenize(text: &str) -> Vec<String> {
    let mut out = Vec::new();
    let mut cur = String::new();
    for c in text.chars() {
        if c.is_alphanumeric() {
            cur.push(c);
        } else if !cur.is_empty() {
            out.push(cur.clone());
            cur.clear();
        }
    }
    if !cur.is_empty() {
        out.push(cur);
    }
    out
}

pub const STOPWORDS: &[&str] = &[
    "এই", "সেই", "ও", "এবং", "অথবা", "থেকে", "হয়", "ছিল", "হবে", "হচ্ছে",
    "করে", "করা", "একটি", "একজন", "যা", "তা", "তার", "এর", "যে", "কিন্তু",
    "জন্য", "সাথে", "সঙ্গে", "মধ্যে", "উপর", "নিয়ে", "বা", "ই", "ওই", "এখন",
];

pub fn remove_stopwords(tokens: Vec<String>) -> Vec<String> {
    tokens.into_iter().filter(|t| !STOPWORDS.contains(&t.as_str())).collect()
}
