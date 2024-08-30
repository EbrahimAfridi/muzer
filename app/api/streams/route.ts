import { prismaClient } from "@/app/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { YOUTUBE_REGEX } from "@/app/constants";  

const CreateStreamSchema = z.object({
  creatorId: z.string(),
  url: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const data = CreateStreamSchema.parse(await req.json()); // convert req to json than check schema.
    const isYouTube = YOUTUBE_REGEX.test(data.url); // check if url is a youtube url.

    // Error handeling if url is not of youtube.
    if (!isYouTube) {
      return NextResponse.json(
        { message: "Wrong URL format." },
        { status: 411 }
      );
    }

    const extractedId = data.url.split("?v=")[1]; // extracting video id from the youtube url.

    await prismaClient.stream.create({
      data: {
        userId: data.creatorId,
        url: data.url,
        extractedId,
        type: "YouTube",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Error while adding a stream." },
      { status: 411 }
    );
  }
}
