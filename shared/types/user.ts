/** User account types */

export interface IUser {
  _id: string;
  username: string;
  email: string;
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
}

/** Public user info (no password hash) */
export interface IUserPublic {
  _id: string;
  username: string;
  email: string;
  createdAt: string;
}

/** Auth request payloads */
export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
}

/** Auth response */
export interface AuthResponse {
  token: string;
  user: IUserPublic;
}

/** JWT decoded payload */
export interface JwtPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}
