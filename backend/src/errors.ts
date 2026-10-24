export type TipoError = 'VALIDACION' | 'ID_MALFORMADO' | 'NO_ENCONTRADO' | 'INTERNO';

export class HttpError extends Error {
  constructor(public status: 400 | 404, message: string, public tipo: TipoError) {
    super(message);
  }
}
