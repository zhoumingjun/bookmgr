FROM golang:1.26-alpine AS builder
WORKDIR /app

# Copy workspace files
COPY go.work go.work.sum* ./
COPY backend/go.mod backend/go.sum ./backend/
COPY gen/go.mod gen/go.sum ./gen/

# Download all workspace dependencies at once
RUN GOPROXY=https://goproxy.cn,direct go mod download -x

COPY backend/ ./backend/
COPY gen/ ./gen/

RUN CGO_ENABLED=0 go build -o /app/server ./backend/cmd/server

FROM alpine:3.21
RUN apk --no-cache add ca-certificates
WORKDIR /app
COPY --from=builder /app/server .
RUN mkdir -p /app/uploads
EXPOSE 8080
CMD ["./server"]
