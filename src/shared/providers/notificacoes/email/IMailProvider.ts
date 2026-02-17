export interface ISendMailDTO {
  to: string;
  subject: string;
  body: string;
}

export interface IMailProvider {
  sendMail(data: ISendMailDTO): Promise<void>;
}
