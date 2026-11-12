export type TipoError = 'VALIDACION' | 'ID_MALFORMADO' | 'NO_ENCONTRADO' | 'CONFLICTO' | 'INTERNO';

export class HttpError extends Error {
  constructor(
    public status: 400 | 404 | 409,
    message: string,
    public tipo: TipoError,
  ) {
    super(message);
  }
}
