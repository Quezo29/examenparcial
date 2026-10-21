import { Criatura, TIPOS } from '../modelos/Criatura.model';
import { Avistamiento } from '../modelos/Avistamiento.model';
import { ApiError } from '../apiError';
import { cuerpo, idValido } from '../validacion';
const campos = ['nombre','tipo','habilidades','nivelPeligro','estado'];
export async function listar(tipo?: string) {
  if (tipo && !(TIPOS as readonly string[]).includes(tipo)) throw new ApiError(400, 'Tipo de filtro inválido');
  return Criatura.find(tipo ? { tipo } : {}).sort({ nombre: 1, _id: 1 }).lean();
}
export async function obtener(id: string) {
  const doc = await Criatura.findById(idValido(id));
  if (!doc) throw new ApiError(404, 'Criatura no encontrada');
  return doc;
}
export async function crear(body: unknown) {
  return Criatura.create(cuerpo(body, campos, ['nombre','tipo','nivelPeligro']));
}
export async function actualizar(id: string, body: unknown) {
  const cambios = cuerpo(body, campos);
  if ('tipo' in cambios && !(TIPOS as readonly string[]).includes(cambios.tipo as string)) {
    throw new ApiError(400, 'Tipo inválido: solo se admiten mitica, elemental, mecanica y espectral');
  }
  const doc = await Criatura.findByIdAndUpdate(idValido(id), { $set: cambios }, { new: true, runValidators: true });
  if (!doc) throw new ApiError(404, 'Criatura no encontrada');
  return doc;
}
export async function eliminar(id: string) {
  await obtener(id);
  if (await Avistamiento.exists({ criatura: id })) throw new ApiError(409, 'Elimina primero los avistamientos asociados');
  await Criatura.findByIdAndDelete(id);
}
