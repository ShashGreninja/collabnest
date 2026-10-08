// app/api/upload/route.ts
import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { getAuthenticatedUser } from "@/lib/auth";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

// Extension allow-list (document/learning-material types only).
// HTML, SVG, JS, etc. are intentionally excluded to prevent hosting active content.
const ALLOWED_EXTENSIONS: Record<string, string[]> = {
  ".pdf": ["application/pdf"],
  ".png": ["image/png"],
  ".jpg": ["image/jpeg"],
  ".jpeg": ["image/jpeg"],
  ".gif": ["image/gif"],
  ".webp": ["image/webp"],
  ".txt": ["text/plain"],
  ".md": ["text/markdown", "text/plain", ""],
  ".csv": ["text/csv", "application/vnd.ms-excel", ""],
  ".doc": ["application/msword"],
  ".docx": ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  ".ppt": ["application/vnd.ms-powerpoint"],
  ".pptx": ["application/vnd.openxmlformats-officedocument.presentationml.presentation"],
  ".xls": ["application/vnd.ms-excel"],
  ".xlsx": ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
  ".zip": ["application/zip", "application/x-zip-compressed"],
};

export async function POST(request: Request) {
  const authUser = await getAuthenticatedUser();
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Reject oversized bodies early when the client declares a length
    const declared = Number(request.headers.get("content-length") || 0);
    if (declared > MAX_FILE_SIZE + 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 10 MB)" }, { status: 413 });
    }

    // Parse the form data
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string") {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 }
      );
    }

    if (file.size === 0 || file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File must be between 1 byte and 10 MB" }, { status: 413 });
    }

    const ext = path.extname(file.name).toLowerCase();
    const allowedTypes = ALLOWED_EXTENSIONS[ext];
    if (!allowedTypes || !allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "File type not allowed" }, { status: 415 });
    }

    // Convert the file to a Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Server-generated file name; only the validated extension is kept
    const fileName = `${Date.now()}-${randomUUID()}${ext}`;

    // Define the upload directory and file path
    const uploadDir = path.join(process.cwd(), "public/uploads");
    const filePath = path.join(uploadDir, fileName);

    // Ensure the upload directory exists
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Save the file to the upload directory
    await writeFile(filePath, buffer);

    // Return the file URL (relative to the public directory)
    const fileUrl = `/uploads/${fileName}`;
    
    return NextResponse.json(
      { 
        url: fileUrl,
        name: file.name,
        size: file.size,
        type: file.type 
      }, 
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}