package main

import (
	"context"
	"fmt"
	"log"
	"os/exec"
	"runtime"
	"sync"
	"time"

	"github.com/gocolly/colly/v2"
	wr "github.com/wailsapp/wails/v2/pkg/runtime"
)

type (
	App struct {
		ctx  context.Context
		pipe chan Pipe
	}
	Pipe struct {
		From, To string
	}
)

func NewApp() *App {
	return &App{}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	a.pipe = make(chan Pipe, 50)
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

func (a *App) Pipe() {
	ticker := time.NewTicker(2 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-a.ctx.Done():
			return
		case <-ticker.C:
			println("tick,", len(a.pipe))
			var tmp []Pipe

			// Non-blocking read from the channel
			for i := 0; i < len(a.pipe); i++ {
				select {
				case v := <-a.pipe:
					println(v.From)
					tmp = append(tmp, v)
				default:
					break
				}
			}
			if len(tmp) > 0 {
				println("built list")
				wr.EventsEmit(a.ctx, "update", tmp)
				println("send event")
			}
		}
	}
}
func (a *App) Scrape() {
	var mu sync.Mutex
	m := make(map[string]bool)

	println("start scraping from", *urlf)
	c := colly.NewCollector(
		colly.MaxDepth(*depth),
		colly.Async(true),
	)
	//c.Limit(&colly.LimitRule{DomainGlob: "*", Parallelism: 2})
	c.OnHTML("a[href]", func(e *colly.HTMLElement) {
		println("awaiting lock")
		mu.Lock()
		current := e.Request.URL.String()
		link := e.Request.AbsoluteURL(e.Attr("href"))
		if len(link) == 0 {
			println("no link found")
			mu.Unlock()
			return
		}
		if _, ok := m[link]; ok {
			println(link, "was visited ")
			mu.Unlock()
		} else {
			m[link] = true
			mu.Unlock()
			println("send", current, "and", link)
			a.pipe <- Pipe{
				From: current,
				To:   link,
			}
			e.Request.Visit(link)
		}
	})
	c.OnRequest(func(r *colly.Request) {
		println("visiting", r.URL.String())
	})
	c.Visit(*urlf)
	c.Wait()
	wr.EventsEmit(a.ctx, "done")
}

// Greet returns a greeting for the given name
func (a *App) Greet(name string) string {
	return fmt.Sprintf("Hello %s, It's show time!", name)
}
