#[tokio::main]
async fn main() {
    tracing_subscriber::fmt().init();
    tracing::info!("সন্ধান ইনডেক্সার প্রস্তুত — OpenSearch ম্যাপিং ও বাল্ক লোডার");
}
