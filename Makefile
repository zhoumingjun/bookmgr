.PHONY: standalone clean frontend-build release

# Output
BIN_DIR := bin
BINARY  := $(BIN_DIR)/bookmgr

# Paths
FRONTEND_DIR := frontend
EMBED_DIST   := backend/embed/frontend_dist

# Cross-compile targets: os/arch
PLATFORMS := \
	linux/amd64 \
	linux/arm64 \
	darwin/amd64 \
	darwin/arm64 \
	windows/amd64 \
	windows/arm64

# Build standalone binary for current platform
standalone: frontend-build
	@echo "==> Building standalone binary..."
	@mkdir -p $(BIN_DIR)
	cd backend && go build -ldflags="-s -w" -o ../$(BINARY) ./cmd/standalone
	@echo "==> Built: $(BINARY)"

# Build for all platforms
release: frontend-build
	@echo "==> Building release binaries..."
	@mkdir -p $(BIN_DIR)
	@$(foreach platform,$(PLATFORMS), \
		$(eval OS   := $(word 1,$(subst /, ,$(platform)))) \
		$(eval ARCH := $(word 2,$(subst /, ,$(platform)))) \
		$(eval EXT  := $(if $(filter windows,$(OS)),.exe,)) \
		$(eval OUT  := $(BIN_DIR)/bookmgr-$(OS)-$(ARCH)$(EXT)) \
		echo "  -> $(OUT)" && \
		cd backend && CGO_ENABLED=0 GOOS=$(OS) GOARCH=$(ARCH) \
			go build -ldflags="-s -w" -o ../$(OUT) ./cmd/standalone && cd .. && \
	) true
	@echo "==> Release complete:"
	@ls -lh $(BIN_DIR)/bookmgr-*

# Build frontend and copy to embed directory
frontend-build:
	@echo "==> Building frontend..."
	cd $(FRONTEND_DIR) && npm ci && npm run build
	@echo "==> Copying frontend dist to embed directory..."
	@rm -rf $(EMBED_DIST)
	@cp -r $(FRONTEND_DIR)/dist $(EMBED_DIST)

# Clean build artifacts
clean:
	@echo "==> Cleaning..."
	@rm -rf $(BIN_DIR)
	@rm -rf $(EMBED_DIST)
	@mkdir -p $(EMBED_DIST)
	@touch $(EMBED_DIST)/.gitkeep
	@echo "==> Clean complete"
