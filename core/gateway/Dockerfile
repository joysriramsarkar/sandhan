FROM rust:1.78-alpine AS builder
WORKDIR /usr/src/sandhan
RUN apk add --no-cache musl-dev
COPY Cargo.toml ./
COPY src ./src
RUN cargo build --release

FROM alpine:3.19
RUN apk add --no-cache ca-certificates
WORKDIR /app
COPY --from=builder /usr/src/sandhan/target/release/sandhan-gateway /app/sandhan-gateway
EXPOSE 8080
CMD ["/app/sandhan-gateway"]
