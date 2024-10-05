package internal

import (
	"encoding/json"
	"math"
	"sync"

	"github.com/gocolly/colly"
	"github.com/gofiber/fiber/v2"
)

type packet struct {
	From, To string
}

var (
	pipe      chan packet
	targetUrl string
	depth     int
)

func Init(u string, d int) {
	pipe = make(chan packet, math.MaxInt16)
	targetUrl = u
	depth = d
}

func Peek(c *fiber.Ctx) error {
	var tmp []packet
loop:
	for i := 0; i < len(pipe); i++ {
		select {
		case v := <-pipe:
			tmp = append(tmp, v)
		default:
			break loop
		}
	}
	if len(tmp) == 0 {
		c.SendString(`{ "done": true }`)
		return nil
	}
	if b, err := json.Marshal(tmp); err != nil {
		println(err.Error())
	} else {
		c.SendString(string(b))
	}
	return nil
}

func Scrape(_ *fiber.Ctx) error {
	var mu sync.Mutex
	m := make(map[string]bool)

	println("start scraping from", targetUrl)
	c := colly.NewCollector(
		colly.MaxDepth(depth),
	)
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
			pipe <- packet{
				From: current,
				To:   link,
			}
			e.Request.Visit(link)
		}
	})
	c.OnRequest(func(r *colly.Request) {
		println("visiting", r.URL.String())
	})
	c.Visit(targetUrl)
	c.Wait()
	return nil
}
