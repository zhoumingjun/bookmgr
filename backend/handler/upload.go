package handler

import (
	"encoding/json"
	"io"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"github.com/zhoumingjun/bookmgr/backend/service"
)

const maxUploadSize = 100 << 20 // 100MB

// UploadHandler handles file uploads for books.
type UploadHandler struct {
	bookService *service.BookService
	jwtService  *service.JWTService
}

// NewUploadHandler creates a new UploadHandler.
func NewUploadHandler(bookService *service.BookService, jwtService *service.JWTService) *UploadHandler {
	return &UploadHandler{bookService: bookService, jwtService: jwtService}
}

// Download handles GET /api/v1/books/{id}/download — streams the PDF file.
func (h *UploadHandler) Download(w http.ResponseWriter, r *http.Request) {
	authHeader := r.Header.Get("Authorization")
	if len(authHeader) < 8 || authHeader[:7] != "Bearer " {
		http.Error(w, `{"code":16,"message":"missing authorization"}`, http.StatusUnauthorized)
		return
	}
	if _, err := h.jwtService.ValidateToken(authHeader[7:]); err != nil {
		http.Error(w, `{"code":16,"message":"invalid token"}`, http.StatusUnauthorized)
		return
	}

	bookID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		http.Error(w, `{"code":3,"message":"invalid book id"}`, http.StatusBadRequest)
		return
	}

	rc, err := h.bookService.OpenFile(r.Context(), bookID)
	if err != nil {
		http.Error(w, `{"code":5,"message":"book file not found"}`, http.StatusNotFound)
		return
	}
	defer rc.Close()

	w.Header().Set("Content-Type", "application/pdf")
	w.Header().Set("Content-Disposition", "attachment")
	io.Copy(w, rc)
}

// Upload handles POST /api/v1/books/{id}/upload with multipart/form-data.
func (h *UploadHandler) Upload(w http.ResponseWriter, r *http.Request) {
	// Validate JWT from Authorization header
	authHeader := r.Header.Get("Authorization")
	if len(authHeader) < 8 || authHeader[:7] != "Bearer " {
		http.Error(w, `{"code":16,"message":"missing authorization"}`, http.StatusUnauthorized)
		return
	}
	claims, err := h.jwtService.ValidateToken(authHeader[7:])
	if err != nil || claims.Role != "admin" {
		http.Error(w, `{"code":7,"message":"admin role required"}`, http.StatusForbidden)
		return
	}

	bookID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		http.Error(w, `{"code":3,"message":"invalid book id"}`, http.StatusBadRequest)
		return
	}

	r.Body = http.MaxBytesReader(w, r.Body, maxUploadSize)
	if err := r.ParseMultipartForm(maxUploadSize); err != nil {
		http.Error(w, `{"code":3,"message":"file too large (max 100MB)"}`, http.StatusBadRequest)
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		http.Error(w, `{"code":3,"message":"missing file field"}`, http.StatusBadRequest)
		return
	}
	defer file.Close()

	if ct := header.Header.Get("Content-Type"); ct != "" && ct != "application/pdf" && ct != "application/octet-stream" {
		http.Error(w, `{"code":3,"message":"only PDF files accepted"}`, http.StatusBadRequest)
		return
	}

	b, err := h.bookService.SaveFile(r.Context(), bookID, file)
	if err != nil {
		http.Error(w, `{"code":13,"message":"upload failed"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{
		"id":        b.ID.String(),
		"file_path": b.FilePath,
	})
}
