import { prismaClient } from "@/app/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { YOUTUBE_REGEX } from "@/app/constants";
//@ts-ignore
import youtubesearchapi from "youtube-search-api";

const CreateStreamSchema = z.object({
  creatorId: z.string(),
  url: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const data = CreateStreamSchema.parse(await req.json()); // convert req to json than check schema.
    const isYouTube = data.url.match(YOUTUBE_REGEX); // check if url is a youtube url.

    // Error handeling if url is not of youtube.
    if (!isYouTube) {
      return NextResponse.json(
        { message: "Wrong URL format." },
        { status: 411 }
      );
    }

    const extractedId = data.url.split("?v=")[1]; // extracting video id from the youtube url.
    const res = await youtubesearchapi.GetVideoDetails(extractedId);
    console.log(res);
    const thumbnails = res.thumbnail.thumbnails;
    thumbnails.sort((a: { width: number }, b: { width: number }) =>
      a.width < b.width ? -1 : 1
    );
    const stream = await prismaClient.stream.create({
      data: {
        userId: data.creatorId,
        url: data.url,
        extractedId,
        type: "YouTube",
        title: res.title ?? "Cannot find video.",
        smallImg:
          (thumbnails.length > 1
            ? thumbnails[thumbnails.length - 2]
            : thumbnails[thumbnails.length - 1]) ??
          "../../../public/images/cat-4218424_1280.jpg",
        bigImg:
          thumbnails[thumbnails.length - 1] ??
          "../../../public/images/cat-4218424_1280.jpg",
      },
    });

    return NextResponse.json({ message: "Added stream", id: stream.id });
  } catch (error) {
    return NextResponse.json(
      { message: "Error while adding a stream." },
      { status: 411 }
    );
  }
}

export async function GET(req: NextRequest) {
  const creatorId = req.nextUrl.searchParams.get("creatorId");
  const streams = await prismaClient.stream.findMany({
    where: {
      userId: creatorId ?? "",
    },
  });

  return NextResponse.json({
    streams,
  });
}
