FROM rust:1.78-alpine AS builder
WORKDIR /usr/src/sondhan
RUN apk add --no-cache musl-dev
COPY Cargo.toml ./
COPY src ./src
RUN cargo build --release

FROM alpine:3.19
RUN apk add --no-cache ca-certificates
WORKDIR /app
COPY --from=builder /usr/src/sondhan/target/release/sondhan-gateway /app/sondhan-gateway
EXPOSE 8080
CMD ["/app/sondhan-gateway"]
