const SUFFIXES: &[&str] = &["গুলোতে", "দেরকে", "গুলো", "গুলি", "দের", "রা", "কে", "তে", "ই"];

pub fn stem(word: &str) -> String {
    for s in SUFFIXES {
        if word.ends_with(s) && word.chars().count() > s.chars().count() + 2 {
            return word[..word.len() - s.len()].to_string();
        }
    }
    word.to_string()
}
