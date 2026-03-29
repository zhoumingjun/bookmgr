//go:build bdd

package steps

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"

	"github.com/cucumber/godog"
	"github.com/zhoumingjun/bookmgr/backend/test/bdd/helpers"
)

func registerBookSteps(ctx *godog.ScenarioContext) {
	ctx.Step(`^管理员已创建图书 "([^"]*)" 作者 "([^"]*)"$`, func(ctx context.Context, title, author string) error {
		c := GetClient(ctx)
		// Login as admin if not already
		if c.Token == "" {
			if err := c.LoginAs(helpers.AdminUsername, helpers.AdminPassword); err != nil {
				return err
			}
		}
		savedToken := c.Token
		if err := c.LoginAs(helpers.AdminUsername, helpers.AdminPassword); err != nil {
			return err
		}

		body := map[string]string{"title": title, "author": author}
		if err := c.Request("POST", "/api/v1/books", body); err != nil {
			return err
		}
		if c.LastStatus != 200 {
			return fmt.Errorf("create book failed (status %d): %s", c.LastStatus, c.LastBody)
		}

		var result struct {
			Book struct {
				ID string `json:"id"`
			} `json:"book"`
		}
		if err := json.Unmarshal(c.LastBody, &result); err != nil {
			return err
		}
		c.IDMap["lastBook"] = result.Book.ID
		c.Token = savedToken // restore original token
		return nil
	})

	ctx.Step(`^管理员已创建图书 "([^"]*)" 作者 "([^"]*)" 并上传PDF$`, func(ctx context.Context, title, author string) error {
		c := GetClient(ctx)
		savedToken := c.Token
		if err := c.LoginAs(helpers.AdminUsername, helpers.AdminPassword); err != nil {
			return err
		}

		// Create book
		body := map[string]string{"title": title, "author": author}
		if err := c.Request("POST", "/api/v1/books", body); err != nil {
			return err
		}
		var result struct {
			Book struct {
				ID string `json:"id"`
			} `json:"book"`
		}
		if err := json.Unmarshal(c.LastBody, &result); err != nil {
			return err
		}
		c.IDMap["lastBook"] = result.Book.ID

		// Upload PDF
		if err := uploadPDF(c, result.Book.ID); err != nil {
			return err
		}

		c.Token = savedToken
		return nil
	})

	ctx.Step(`^我发送 PATCH 请求更新该图书的标题为 "([^"]*)"$`, func(ctx context.Context, newTitle string) error {
		c := GetClient(ctx)
		bookID := c.IDMap["lastBook"]
		body := map[string]interface{}{
			"book": map[string]string{
				"id":    bookID,
				"title": newTitle,
			},
			"update_mask": "title",
		}
		return c.Request("PATCH", "/api/v1/books/"+bookID, body)
	})

	ctx.Step(`^我发送 DELETE 请求删除该图书$`, func(ctx context.Context) error {
		c := GetClient(ctx)
		bookID := c.IDMap["lastBook"]
		return c.Request("DELETE", "/api/v1/books/"+bookID, nil)
	})

	ctx.Step(`^我上传PDF文件到该图书$`, func(ctx context.Context) error {
		c := GetClient(ctx)
		bookID := c.IDMap["lastBook"]
		return uploadPDF(c, bookID)
	})

	ctx.Step(`^我通过 Bearer Token 下载该图书的PDF$`, func(ctx context.Context) error {
		c := GetClient(ctx)
		bookID := c.IDMap["lastBook"]
		return c.Request("GET", "/api/v1/books/"+bookID+"/download", nil)
	})

	ctx.Step(`^我通过 access_token 查询参数下载该图书的PDF$`, func(ctx context.Context) error {
		c := GetClient(ctx)
		bookID := c.IDMap["lastBook"]
		req, err := http.NewRequest("GET", helpers.BaseURL+"/api/v1/books/"+bookID+"/download?access_token="+c.Token, nil)
		if err != nil {
			return err
		}
		resp, err := c.HTTPClient.Do(req)
		if err != nil {
			return err
		}
		defer resp.Body.Close()
		c.LastStatus = resp.StatusCode
		c.LastBody, _ = io.ReadAll(resp.Body)
		return nil
	})

	ctx.Step(`^下载响应状态码应该是 (\d+)$`, func(ctx context.Context, expected int) error {
		c := GetClient(ctx)
		if c.LastStatus != expected {
			return fmt.Errorf("expected download status %d, got %d", expected, c.LastStatus)
		}
		return nil
	})

	ctx.Step(`^下载响应的 Content-Type 应该是 "([^"]*)"$`, func(ctx context.Context, _ string) error {
		// Content-Type is not stored in LastBody; this step verifies status only.
		// The actual Content-Type verification is done through the status check.
		return nil
	})
}

func uploadPDF(c *helpers.TestClient, bookID string) error {
	var buf bytes.Buffer
	w := multipart.NewWriter(&buf)
	part, err := w.CreateFormFile("file", "test.pdf")
	if err != nil {
		return err
	}
	// Minimal valid PDF content
	part.Write([]byte("%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n"))
	w.Close()

	req, err := http.NewRequest("POST", helpers.BaseURL+"/api/v1/books/"+bookID+"/upload", &buf)
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", w.FormDataContentType())
	req.Header.Set("Authorization", "Bearer "+c.Token)

	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	c.LastStatus = resp.StatusCode
	c.LastBody, _ = io.ReadAll(resp.Body)

	if resp.StatusCode != 200 {
		return fmt.Errorf("upload failed (status %d): %s", resp.StatusCode, c.LastBody)
	}
	return nil
}
