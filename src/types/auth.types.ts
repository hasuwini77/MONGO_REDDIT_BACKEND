export interface UserResponse {
  id: string;
  username: string;
}

export interface LoginResponse {
  token: string;
  user: UserResponse;
}
