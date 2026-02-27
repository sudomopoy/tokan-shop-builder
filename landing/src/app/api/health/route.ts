/**
 * Health check endpoint - بدون وابستگی به store خاصی.
 * برای load balancer و monitoring.
 */
export async function GET() {
  return Response.json(
    { status: "ok", service: "tokan-landing" },
    { status: 200 }
  );
}
