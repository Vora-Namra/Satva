import { ZoomResponse } from "../telemedicine.interface.js";

export async function getZoomAccessToken() {
  const accountId = process.env.ZOOM_ACCOUNT_ID!;
  const clientId = process.env.ZOOM_CLIENT_ID!;
  const clientSecret = process.env.ZOOM_CLIENT_SECRET!;

  const credentials = Buffer.from(
    `${clientId}:${clientSecret}`
  ).toString("base64");

  const response = await fetch(
    `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${accountId}`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Unable to generate Zoom access token");
  }

  const data : any = await response.json();

  return data.access_token;
}

// this is for creating zoom
export async function createZoomMeeting() : Promise<ZoomResponse> {
  const accessToken = await getZoomAccessToken();

  const response = await fetch(
    "https://api.zoom.us/v2/users/me/meetings",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        topic: "Doctor Consultation",
        type: 1,
        settings: {
          host_video: true,
          participant_video: true,
          waiting_room: false
        }
      })
    }
  );

  if (!response.ok) {
    throw new Error("Unable to create Zoom meeting");
  }

  let ZoomResponse  =  (await response.json()) as ZoomResponse;
  return ZoomResponse;
}