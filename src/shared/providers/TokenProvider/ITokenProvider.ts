export interface ITokenProvider {
  generateToken(payload: any): string;
}
