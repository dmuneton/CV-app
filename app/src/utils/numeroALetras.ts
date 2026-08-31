/**
 * Convierte un número entero a su representación en letras en español
 * adaptado para pesos colombianos (Pesos M/CTE).
 */
export function numeroALetras(cantidad: number): string {
  const numero = Math.floor(Math.abs(cantidad));

  if (numero === 0) return 'CERO PESOS';
  if (numero === 1) return 'UN PESO';

  const unidades = [
    '',
    'UN',
    'DOS',
    'TRES',
    'CUATRO',
    'CINCO',
    'SEIS',
    'SIETE',
    'OCHO',
    'NUEVE'
  ];

  const decenas = [
    '',
    'DIEZ',
    'VEINTE',
    'TREINTA',
    'CUARENTA',
    'CINCUENTA',
    'SESENTA',
    'SETENTA',
    'OCHENTA',
    'NOVENTA'
  ];

  const especialesDiez = [
    'DIEZ',
    'ONCE',
    'DOCE',
    'TRECE',
    'CATORCE',
    'QUINCE',
    'DIECISÉIS',
    'DIECISIETE',
    'DIECIOCHO',
    'DIECINUEVE'
  ];

  const especialesVeinte = [
    'VEINTE',
    'VEINTIUNO',
    'VEINTIDÓS',
    'VEINTITRÉS',
    'VEINTICUATRO',
    'VEINTICINCO',
    'VEINTISÉIS',
    'VEINTISIETE',
    'VEINTIOCHO',
    'VEINTINUEVE'
  ];

  const centenas = [
    '',
    'CIENTO',
    'DOSCIENTOS',
    'TRESCIENTOS',
    'CUATROCIENTOS',
    'QUINIENTOS',
    'SEISCIENTOS',
    'SETECIENTOS',
    'OCHOCIENTOS',
    'NOVECIENTOS'
  ];

  function convertirCentenas(n: number): string {
    if (n === 0) return '';
    if (n === 100) return 'CIEN';

    const c = Math.floor(n / 100);
    const restoC = n % 100;

    let res = centenas[c] ? centenas[c] + ' ' : '';

    if (restoC >= 10 && restoC <= 19) {
      res += especialesDiez[restoC - 10];
    } else if (restoC >= 20 && restoC <= 29) {
      res += especialesVeinte[restoC - 20];
    } else {
      const d = Math.floor(restoC / 10);
      const u = restoC % 10;
      if (d > 0) {
        res += decenas[d];
        if (u > 0) {
          res += ' Y ' + unidades[u];
        }
      } else if (u > 0) {
        res += unidades[u];
      }
    }

    return res.trim();
  }

  function seccion(n: number, divisor: number, singular: string, plural: string): string {
    const cientos = Math.floor(n / divisor);
    const resto = n % divisor;

    let res = '';
    if (cientos > 0) {
      if (cientos === 1 && singular === 'UN MILLÓN') {
        res = singular;
      } else if (cientos === 1 && singular === 'MIL') {
        res = singular;
      } else if (cientos > 1) {
        res = convertirCentenas(cientos) + ' ' + plural;
      }
    }
    if (resto > 0) {
      res += (res ? ' ' : '') + convertirCentenas(resto);
    }
    return res.trim();
  }

  let resultado = '';

  const millones = Math.floor(numero / 1000000);
  const restoMillones = numero % 1000000;

  if (millones > 0) {
    if (millones === 1) {
      resultado = 'UN MILLÓN';
    } else {
      resultado = convertirCentenas(millones) + ' MILLONES';
    }
  }

  const miles = Math.floor(restoMillones / 1000);
  const restoMiles = restoMillones % 1000;

  if (miles > 0) {
    if (miles === 1) {
      resultado += (resultado ? ' ' : '') + 'MIL';
    } else {
      resultado += (resultado ? ' ' : '') + convertirCentenas(miles) + ' MIL';
    }
  }

  if (restoMiles > 0) {
    resultado += (resultado ? ' ' : '') + convertirCentenas(restoMiles);
  }

  return `${resultado.trim()} PESOS`;
}
