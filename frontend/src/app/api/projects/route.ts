// Dedicated projects proxy to avoid routing issues
const BACKEND_URL = "https://r-dagent-production.up.railway.app";

export async function GET() {
  try {
    console.log("Fetching projects from:", `${BACKEND_URL}/projects`);
    
    const response = await fetch(`${BACKEND_URL}/projects`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log("Backend response:", response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Backend error:", errorText);
      return Response.json({
        error: "Backend error",
        status: response.status,
        message: errorText
      }, { status: response.status });
    }

    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    console.error("Proxy error:", error);
    return Response.json({
      error: "Proxy error",
      message: error instanceof Error ? error.message : "Unknown error",
      backend_url: BACKEND_URL
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("Creating project:", body, "at:", `${BACKEND_URL}/projects`);
    
    const response = await fetch(`${BACKEND_URL}/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    console.log("Backend response:", response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Backend error:", errorText);
      return Response.json({
        error: "Backend error",
        status: response.status,
        message: errorText
      }, { status: response.status });
    }

    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    console.error("Proxy error:", error);
    return Response.json({
      error: "Proxy error",
      message: error instanceof Error ? error.message : "Unknown error",
      backend_url: BACKEND_URL
    }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Max-Age": "600",
    },
  });
}
