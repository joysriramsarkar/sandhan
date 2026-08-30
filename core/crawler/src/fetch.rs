pub async fn fetch_page(url: &str) -> Result<String, Box<dyn std::error::Error>> {
    let client = reqwest::Client::builder()
        .user_agent("SondhanBot/0.1 (+https://sondhan.org/bot)")
        .timeout(std::time::Duration::from_secs(10))
        .build()?;
    let text = client.get(url).send().await?.text().await?;
    Ok(text)
}
