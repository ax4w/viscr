package main

import (
	"embed"
	"flag"
	"net/url"
	"strings"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
)

//go:embed all:frontend/dist
var assets embed.FS

var (
	urlf  = flag.String("u", "www.ax4w.me", "the url to start scraping from")
	depth = flag.Int("d", 2, "the depth of the traversal")
)

func init() {
	flag.Parse()
	if *depth <= 0 {
		panic("depth must be >= 1")
	}
	if !strings.HasPrefix("https://", *urlf) {
		*urlf = "https://" + *urlf
	}
	_, err := url.ParseRequestURI(*urlf)
	if err != nil {
		panic(err)
	}

}

func main() {
	// Create an instance of the app structure
	app := NewApp()
	// Create application with options
	err := wails.Run(&options.App{
		Title:  "viscr",
		Width:  1024,
		Height: 768,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		BackgroundColour: &options.RGBA{R: 27, G: 38, B: 54, A: 1},
		OnStartup:        app.startup,
		Bind: []interface{}{
			app,
		},
	})

	if err != nil {
		println("Error:", err.Error())
	}
}
