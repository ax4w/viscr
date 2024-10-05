package main

import (
	"flag"
	"io/fs"
	"log"
	"net/http"
	"net/url"
	"strings"
	"viscr/internal"
	"viscr/ui"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/filesystem"
)

var (
	targetUrl = flag.String("u", "www.ax4w.me", "url to start scraping from")
	depth     = flag.Int("d", 5, "scraping depth")
)

func init() {
	flag.Parse()
	if !strings.HasPrefix("http", *targetUrl) {
		*targetUrl = "https://" + *targetUrl
	}
	if _, err := url.ParseRequestURI(*targetUrl); err != nil {
		log.Fatal(err.Error())
	}
	if *depth <= 0 {
		log.Fatal("depth must be >= 1")
	}
}

func main() {
	app := fiber.New()

	index, err := fs.Sub(ui.Index, "dist")
	if err != nil {
		panic(err.Error())
	}

	app.Use("/", filesystem.New(filesystem.Config{
		Root:   http.FS(index),
		Index:  "index.html",
		Browse: false,
	}))

	app.Get("/hello", func(c *fiber.Ctx) error {
		return c.SendString("Hello, World!")
	})

	app.Get("/peek", internal.Peek)

	app.Post("/scrape", internal.Scrape)

	internal.Init(*targetUrl, *depth)
	log.Fatal(app.Listen(":3000"))
}
