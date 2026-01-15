import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const url = searchParams.get("url")

  if (!url) {
    return NextResponse.json({ error: "URL parameter is required" }, { status: 400 })
  }

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; bot/1.0)",
      },
    })

    if (!response.ok) {
      throw new Error("Failed to fetch URL")
    }

    const html = await response.text()

    // Extract og:image from HTML
    const ogImageMatch =
      html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["'][^>]*>/i) ||
      html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["'][^>]*>/i)

    const ogImage = ogImageMatch ? ogImageMatch[1] : undefined

    let favicon: string | undefined

    // Try to find favicon from link tags
    const faviconMatch =
      html.match(/<link[^>]*rel=["'](?:icon|shortcut icon|apple-touch-icon)["'][^>]*href=["']([^"']+)["'][^>]*>/i) ||
      html.match(/<link[^>]*href=["']([^"']+)["'][^>]*rel=["'](?:icon|shortcut icon|apple-touch-icon)["'][^>]*>/i)

    if (faviconMatch) {
      const faviconPath = faviconMatch[1]
      // Handle relative URLs
      if (faviconPath.startsWith("http")) {
        favicon = faviconPath
      } else if (faviconPath.startsWith("//")) {
        favicon = `https:${faviconPath}`
      } else {
        const urlObj = new URL(url)
        favicon = `${urlObj.protocol}//${urlObj.host}${faviconPath.startsWith("/") ? faviconPath : "/" + faviconPath}`
      }
    } else {
      // Fallback to default favicon location
      const urlObj = new URL(url)
      favicon = `${urlObj.protocol}//${urlObj.host}/favicon.ico`
    }

    return NextResponse.json({ ogImage, favicon })
  } catch (error) {
    console.error("[v0] Error fetching og:image:", error)
    return NextResponse.json({ ogImage: undefined, favicon: undefined }, { status: 200 })
  }
}
