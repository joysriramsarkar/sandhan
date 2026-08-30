mod dedupe;
mod extract;
mod fetch;

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt().init();
    tracing::info!("সন্ধান ক্রলার প্রস্তুত");
}
