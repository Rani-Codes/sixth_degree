# Creating a multi-stage build for a tiny and secure docker image

# Stage 1: Backend builder image (using alpine since it's linux and lightweight)
FROM golang:1.24-alpine AS backend_builder

WORKDIR /out

# pre-copy/cache go.mod for pre-downloading dependencies and only redownloading them in subsequent builds if they change
COPY go.mod go.sum ./
RUN go mod download

# Copy the rest of the application source code
COPY . .

# CGO_ENABLED=0 disables cgo, creating a statically-linked binary (needed for scratch base image)
# -ldflags="-s -w" reduces the size of the final binary by stripping debug information.
RUN CGO_ENABLED=0 go build -ldflags="-s -w" -o /out/server ./cmd/search/main.go



# Stage 2: Frontend builder image
FROM node:20-alpine AS frontend_builder

WORKDIR /frontend

COPY frontend/package.json frontend/package-lock.json ./

# use npm ci (not npm install) for reproducible, fast builds in clean containers;
# installs exactly from package-lock, fails if out of sync, keeps logs quiet
# preferred over npm install for docker builds
RUN npm ci --no-audit --no-fund

# Copy the rest of the frontend source code
COPY frontend/ ./

RUN npm run build

# Stage 3: Final image
FROM scratch

WORKDIR /app

COPY --from=backend_builder /out/server /app/server
COPY --from=frontend_builder /frontend/dist /app/dist

COPY graph.json /app

EXPOSE 8080

CMD ["/app/server"]
