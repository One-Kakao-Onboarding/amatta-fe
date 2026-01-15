import { NextResponse } from "next/server"

const API_BASE_URL = "https://amatta-api.goalmate.site"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get("userId") || "1"
  const type = searchParams.get("type") || "uncompletion"
  const userInput = searchParams.get("userInput")

  try {
    let apiUrl: string

    if (userInput) {
      // Recommend API
      apiUrl = `${API_BASE_URL}/api/todos/recommend?userId=${userId}&userInput=${encodeURIComponent(userInput)}`
    } else {
      // List API (uncompletion or completion)
      apiUrl = `${API_BASE_URL}/api/todos/${type}/${userId}`
    }

    const response = await fetch(apiUrl, {
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Proxy API error:", error)
    return NextResponse.json({ error: "Failed to fetch todos" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")

  if (!id) {
    return NextResponse.json({ error: "Todo ID is required" }, { status: 400 })
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/todos/check/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Proxy API error:", error)
    return NextResponse.json({ error: "Failed to complete todo" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action } = body

    if (action === "add") {
      // Add todo API
      const { task, discription, link, userId } = body
      const response = await fetch(`${API_BASE_URL}/api/todos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ task, discription, link, userId }),
      })

      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`)
      }

      const data = await response.json()
      return NextResponse.json(data)
    } else {
      // Exclude API (default)
      const { userId, category, link } = body
      const response = await fetch(`${API_BASE_URL}/api/todos/exclude`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, category, link }),
      })

      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`)
      }

      const data = await response.json()
      return NextResponse.json(data)
    }
  } catch (error) {
    console.error("[v0] Proxy API error:", error)
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 })
  }
}
