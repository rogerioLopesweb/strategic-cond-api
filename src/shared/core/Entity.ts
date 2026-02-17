export abstract class Entity<T> {
  protected readonly _id: string;
  public readonly props: T;

  constructor(props: T, id?: string) {
    this._id = id ?? ""; // ou sua lógica de ID
    this.props = props;
  }
}
