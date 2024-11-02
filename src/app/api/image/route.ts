import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    const { url } = await req.json();
    if (!url) return NextResponse.json({ error: 'Image URL is required' }, { status: 400 });

    try {
        const response = await fetch(url);
        if (!response.ok) return NextResponse.json({ error: 'Error fetching image' }, { status: 500 });

        const imageBuffer = await response.arrayBuffer();
        return new NextResponse(Buffer.from(imageBuffer), {
            headers: {
                'Content-Type': response.headers.get('content-type') || 'image/jpeg',
            },
        });
    } catch (error) {
        return NextResponse.json({ error: 'Error fetching image' }, { status: 500 });
    }
}
