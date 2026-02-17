import { hash, compare, genSalt } from "bcrypt";
import { IHashProvider } from "./IHashProvider";

export class BCryptHashProvider implements IHashProvider {
  /**
   * Gera o hash da senha usando um salt de 10 rounds (padrão seguro)
   */
  public async generateHash(payload: string): Promise<string> {
    const salt = await genSalt(10);
    return hash(payload, salt);
  }

  /**
   * Compara uma senha em texto puro com um hash do banco
   */
  public async compareHash(payload: string, hashed: string): Promise<boolean> {
    return compare(payload, hashed);
  }
}
