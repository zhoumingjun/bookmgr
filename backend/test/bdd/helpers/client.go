package helpers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
)

// BaseURL is the test environment API endpoint.
var BaseURL string

func init() {
	BaseURL = os.Getenv("BDD_BASE_URL")
	if BaseURL == "" {
		BaseURL = "http://localhost:9000"
	}
}

// TestClient holds per-scenario HTTP state.
type TestClient struct {
	HTTPClient *http.Client
	Token      string
	LastStatus int
	LastBody   []byte
	IDMap      map[string]string // name → ID mapping
}

// NewTestClient creates a fresh client for a scenario.
func NewTestClient() *TestClient {
	return &TestClient{
		HTTPClient: &http.Client{},
		IDMap:      make(map[string]string),
	}
}

// LoginAs authenticates as a user and stores the JWT.
func (c *TestClient) LoginAs(username, password string) error {
	body, _ := json.Marshal(map[string]string{
		"username": username,
		"password": password,
	})

	resp, err := c.HTTPClient.Post(
		BaseURL+"/api/v1/auth/login",
		"application/json",
		bytes.NewReader(body),
	)
	if err != nil {
		return fmt.Errorf("login request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		respBody, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("login failed (status %d): %s", resp.StatusCode, respBody)
	}

	var result struct {
		Token string `json:"token"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return fmt.Errorf("decode login response: %w", err)
	}

	c.Token = result.Token
	return nil
}

// Request sends an HTTP request and stores status and body.
func (c *TestClient) Request(method, path string, body interface{}) error {
	var reader io.Reader
	if body != nil {
		data, err := json.Marshal(body)
		if err != nil {
			return fmt.Errorf("marshal body: %w", err)
		}
		reader = bytes.NewReader(data)
	}

	req, err := http.NewRequest(method, BaseURL+path, reader)
	if err != nil {
		return fmt.Errorf("create request: %w", err)
	}

	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}
	if c.Token != "" {
		req.Header.Set("Authorization", "Bearer "+c.Token)
	}

	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return fmt.Errorf("execute request: %w", err)
	}
	defer resp.Body.Close()

	c.LastStatus = resp.StatusCode
	c.LastBody, _ = io.ReadAll(resp.Body)
	return nil
}

// ResponseJSON parses the last response body into the given target.
func (c *TestClient) ResponseJSON(target interface{}) error {
	return json.Unmarshal(c.LastBody, target)
}
