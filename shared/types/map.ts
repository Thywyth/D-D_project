/** Interactive Map types */

export interface IMapMarker {
  _id: string;
  roomId: string;
  xPercent: number; // 0–100, percentage of image width
  yPercent: number; // 0–100, percentage of image height
  name: string;
  description: string;
  color: string;    // Hex color for marker pin
  createdBy: string; // userId
  createdAt: string;
  updatedAt: string;
}

/** A single map within a room */
export interface IMap {
  id: string;
  name: string;
  imageUrl: string;
}

/** Marker creation payload */
export interface CreateMarkerPayload {
  roomId: string;
  xPercent: number;
  yPercent: number;
  name: string;
  description: string;
  color?: string;
}

/** Marker update payload */
export interface UpdateMarkerPayload {
  xPercent?: number;
  yPercent?: number;
  name?: string;
  description?: string;
  color?: string;
}
