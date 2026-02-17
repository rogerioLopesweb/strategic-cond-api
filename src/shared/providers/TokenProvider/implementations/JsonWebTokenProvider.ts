import { sign } from "jsonwebtoken";
import { ITokenProvider } from "../ITokenProvider";

export class JsonWebTokenProvider implements ITokenProvider {
  generateToken(payload: any): string {
    return sign(payload, process.env.JWT_SECRET || "chave_mestra_secreta", {
      expiresIn: "24h",
    });
  }
}
