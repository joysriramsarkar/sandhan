use scraper::{Html, Selector};

pub struct ExtractedDoc {
    pub title: String,
    pub text: String,
    pub links: Vec<String>,
}

pub fn extract_document(html_content: &str) -> ExtractedDoc {
    let document = Html::parse_document(html_content);
    let title_sel = Selector::parse("title").unwrap();
    let title = document
        .select(&title_sel)
        .next()
        .map(|el| el.text().collect::<Vec<_>>().join(" "))
        .unwrap_or_default();

    let p_sel = Selector::parse("p").unwrap();
    let text = document
        .select(&p_sel)
        .map(|el| el.text().collect::<Vec<_>>().join(" "))
        .collect::<Vec<_>>()
        .join("\n");

    let a_sel = Selector::parse("a[href]").unwrap();
    let links = document
        .select(&a_sel)
        .filter_map(|el| el.value().attr("href").map(|s| s.to_string()))
        .collect();

    ExtractedDoc { title, text, links }
}
