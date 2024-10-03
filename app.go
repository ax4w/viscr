package main

import (
	"context"
	"fmt"
	"log"
	"os/exec"
	"runtime"
	"sync"

	"github.com/gocolly/colly/v2"
)

type App struct {
	ctx context.Context
}

func NewApp() *App {
	return &App{}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

func (a *App) Open(url string) {
	var err error

	switch runtime.GOOS {
	case "linux":
		err = exec.Command("xdg-open", url).Start()
	case "windows":
		err = exec.Command("rundll32", "url.dll,FileProtocolHandler", url).Start()
	case "darwin":
		err = exec.Command("open", url).Start()
	default:
		err = fmt.Errorf("unsupported platform")
	}
	if err != nil {
		log.Fatal(err)
	}

}

func (a *App) Scrape() map[string]map[string]int {
	var (
		wg sync.WaitGroup
	)

	url := "https://de.wikipedia.org/wiki/Manfred_Bayer_(Physiker)"
	graph := NewGraph()
	c := colly.NewCollector(
		colly.MaxDepth(1),
	)
	c.OnHTML("a[href]", func(e *colly.HTMLElement) {
		graph.Lock()
		current := e.Request.URL.String()
		println("current is", current)
		link := e.Attr("href")
		link = e.Request.AbsoluteURL(link)
		println("href is", link)
		if graph.Exists(link) {
			graph.Unlock()
		} else {
			graph.Connect(current, link)
			graph.Unlock()
			e.Request.Visit(link)
		}
	})
	c.OnScraped(func(r *colly.Response) {
		wg.Done()
	})
	c.OnRequest(func(r *colly.Request) {
		wg.Add(1)
		println("visiting " + r.URL.String())
	})
	graph.Lock()
	graph.Add(url)
	graph.Unlock()
	c.Visit(url)
	wg.Wait()
	graph.PrintGraph()
	return graph.Nodes
}

// Greet returns a greeting for the given name
func (a *App) Greet(name string) string {
	return fmt.Sprintf("Hello %s, It's show time!", name)
}
