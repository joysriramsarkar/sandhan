pub fn canonical_key(word: &str) -> String {
    let mut out = String::with_capacity(word.len());
    for c in word.trim().chars() {
        match c {
            '০'..='৯' => {
                let digit = (c as u32 - '০' as u32) as u8;
                out.push((b'0' + digit) as char);
            }
            'ষ' | 'শ' => out.push('স'),
            'ণ' => out.push('ন'),
            'ী' => out.push('ি'),
            'ূ' => out.push('ু'),
            'ৎ' => out.push('ত'),
            'ঢ়' => out.push('ড়'),
            _ => out.push(c),
        }
    }
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_canonical_normalization() {
        assert_eq!(canonical_key("১৯৭১"), "1971");
        assert_eq!(canonical_key("ভাষা"), "ভাসা");
    }
}
