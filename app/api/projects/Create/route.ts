import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const authUser = await getAuthenticatedUser();
  if (!authUser) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  try {
    // Attempt to parse JSON
    let jsonBody;
    try {
      jsonBody = await req.json();
    } catch (e) {
      return NextResponse.json(
        { message: "Invalid JSON format" },
        { status: 400 }
      );
    }

    const {
      title,
    description,
    tags,
    difficulty,
    deadlineToApply,
    deadlineToComplete,
    applicantCapacity,
    selectionCapacity,
    subheading,subtasks,
    } = jsonBody;
    // Never trust a client-supplied authorId — always use the session user.
    const authorId = authUser.id;

    console.log(jsonBody);
    // Validate required fields (remove 'author' from validation)
    if (
      !title ||
      !description ||
      !tags ||
      !difficulty ||
      !deadlineToApply ||
      !deadlineToComplete ||
      !applicantCapacity ||
      !authorId || !selectionCapacity // Only validate authorId
    ) {
      return NextResponse.json(
        { message: "All fields are required" },
        { status: 400 } // Changed from 401 to 400
      );
    }

    // Validate dates
    const applyDate = new Date(deadlineToApply);
    const completeDate = new Date(deadlineToComplete);
    if (isNaN(applyDate.getTime())) {
      return NextResponse.json(
        { message: "Invalid deadlineToApply date" },
        { status: 400 } // Changed from 402 to 400
      );
    }
    if (isNaN(completeDate.getTime())) {
      return NextResponse.json(
        { message: "Invalid deadlineToComplete date" },
        { status: 400 } // Changed from 402 to 400
      );
    }

    // Create the project
    const newProject = await prisma.project.create({
      data: {
        title,
        subheading,
        description,
        requirementTags: tags,
        difficultyTag: difficulty,
        deadlineToApply: applyDate,
        deadlineToComplete: completeDate,
        applicantCapacity,
        selectionCapacity,
        
        
        author: {
          connect: {
            id: authorId // Connect via authorId
          }
        }
      },
    });

    return NextResponse.json(
      { message: "Project created successfully", project: newProject },
      { status: 201 }
    );
   } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}