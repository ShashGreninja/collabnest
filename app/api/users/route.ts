import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser, publicUserSelect } from "@/lib/auth";

export async function GET() {
  const authUser = await getAuthenticatedUser();
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    // Only safe public fields — never password / reset tokens / cv.
    const users = await prisma.user.findMany({ select: publicUserSelect });
    return NextResponse.json(users);
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { message: "Error fetching users"},
      { status: 500 }
    );
  }
}
