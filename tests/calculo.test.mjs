/**
 * Pruebas del motor de calculo (js/calculo.js), que es puro y no toca el DOM.
 *
 * El caso «rectangular de ocho barras» viene del repositorio historico
 * calculadora-varillas-pwa (archivado); el resto se anadio al unificar los
 * repos para cubrir las tres formas de columna, los dos metodos de calculo y
 * las validaciones y advertencias de la NTP E.060 que la interfaz muestra.
 *
 * Ejecutar: npm test
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  calcularColumna,
  VARILLAS,
  ESTRIBOS,
  TIPOS,
  CUANTIA_MIN,
  CUANTIA_MAX,
  RECUBRIMIENTO_MIN,
  DIMENSION_MIN_SISMICA,
  FC_MIN_SISMICO,
  buscarVarilla,
  porcentaje,
} from '../js/calculo.js';

/** Columna rectangular de referencia: 30 x 50 cm, f'c 210, cuantia 1 %, varilla 5/8". */
const BASE = Object.freeze({
  tipo: 'rectangular',
  b: 30,
  h: 50,
  fc: 210,
  fy: 4200,
  metodo: 'cuantia',
  cuantia: 1,
  varilla: '5/8',
  recubrimiento: 4,
});

const campos = (resultado) => resultado.errores.map((e) => e.campo);

/* ------------------------------------------------------------------ *
 * Caso historico
 * ------------------------------------------------------------------ */

test('conserva el caso rectangular de ocho barras', () => {
  const resultado = calcularColumna(BASE);

  assert.equal(resultado.ok, true);
  assert.equal(resultado.barras.n, 8);
  assert.equal(resultado.acero.asRequerido, 15);
  assert.equal(resultado.acero.asColocado, 16);
  assert.equal(resultado.acero.gobierna, 'cuantia');
  assert.equal(resultado.estribo.id, '3/8');
  assert.deepEqual(resultado.advertencias, []);
});

/* ------------------------------------------------------------------ *
 * Tipos de columna
 * ------------------------------------------------------------------ */

test('las columnas circulares (estribos y espiral) usan el diametro D y se calculan', () => {
  for (const tipo of ['circular', 'espiral']) {
    const resultado = calcularColumna({ ...BASE, tipo, D: 40 });
    assert.equal(resultado.ok, true, `${tipo} debe ser valido`);
    assert.equal(resultado.barras.n, 7, `${tipo}: 7 barras de 5/8" para D = 40 cm al 1 %`);
    // As requerido = 1 % del area bruta (pi * 40^2 / 4 = 1256.6 cm^2)
    assert.ok(Math.abs(resultado.acero.asRequerido - 12.566) < 0.01);
    assert.equal(resultado.seccion.circular, true);
  }
});

test('una columna circular sin diametro falla con error en el campo D', () => {
  const resultado = calcularColumna({ ...BASE, tipo: 'circular' });
  assert.equal(resultado.ok, false);
  assert.deepEqual(campos(resultado), ['D']);
});

test('un tipo de columna desconocido se rechaza', () => {
  const resultado = calcularColumna({ ...BASE, tipo: 'hexagonal' });
  assert.equal(resultado.ok, false);
  assert.deepEqual(campos(resultado), ['tipo']);
});

test('el catalogo expone los tres tipos y las varillas y estribos esperados', () => {
  assert.deepEqual(Object.keys(TIPOS), ['rectangular', 'circular', 'espiral']);
  assert.deepEqual(VARILLAS.map((v) => v.id), ['3/8', '1/2', '5/8', '3/4', '1', '1-3/8']);
  assert.deepEqual(ESTRIBOS.map((e) => e.id), ['3/8', '1/2']);
  assert.equal(buscarVarilla('5/8').id, '5/8');
  assert.equal(buscarVarilla('7/8'), undefined);
});

/* ------------------------------------------------------------------ *
 * Metodos de calculo
 * ------------------------------------------------------------------ */

test('el metodo por carga tambien resuelve la columna de referencia', () => {
  const resultado = calcularColumna({ ...BASE, metodo: 'carga', pu: 100 });
  assert.equal(resultado.ok, true);
  assert.ok(resultado.barras.n >= 4);
  assert.ok(['cuantia', 'carga', 'minima'].includes(resultado.acero.gobierna));
  assert.equal(typeof resultado.capacidad.cumple, 'boolean');
});

test('un metodo desconocido se rechaza', () => {
  const resultado = calcularColumna({ ...BASE, metodo: 'area' });
  assert.equal(resultado.ok, false);
  assert.deepEqual(campos(resultado), ['metodo']);
});

/* ------------------------------------------------------------------ *
 * Validaciones (errores: impiden el calculo)
 * ------------------------------------------------------------------ */

test('la cuantia debe estar entre el minimo y el maximo de la E.060 10.9.1', () => {
  assert.equal(CUANTIA_MIN, 0.01);
  assert.equal(CUANTIA_MAX, 0.06);
  for (const cuantia of [0.5, 7]) {
    const resultado = calcularColumna({ ...BASE, cuantia });
    assert.equal(resultado.ok, false, `cuantia ${cuantia} % debe fallar`);
    assert.deepEqual(campos(resultado), ['cuantia']);
    assert.match(resultado.errores[0].mensaje, /1 % y 6 %/);
  }
});

test('una varilla que no esta en el catalogo se rechaza', () => {
  const resultado = calcularColumna({ ...BASE, varilla: '7/8' });
  assert.equal(resultado.ok, false);
  assert.deepEqual(campos(resultado), ['varilla']);
});

/* ------------------------------------------------------------------ *
 * Advertencias (no impiden el calculo, pero la interfaz las muestra)
 * ------------------------------------------------------------------ */

test('un recubrimiento menor que 4 cm calcula pero advierte (E.060 7.7.1)', () => {
  assert.equal(RECUBRIMIENTO_MIN, 4);
  const resultado = calcularColumna({ ...BASE, recubrimiento: 2 });
  assert.equal(resultado.ok, true);
  assert.equal(resultado.advertencias.length, 1);
  assert.match(resultado.advertencias[0], /recubrimiento.*7\.7\.1/i);
});

test('una dimension menor que 25 cm advierte el minimo sismorresistente (E.060 21.4.1)', () => {
  assert.equal(DIMENSION_MIN_SISMICA, 25);
  const resultado = calcularColumna({ ...BASE, b: 20, h: 20 });
  assert.equal(resultado.ok, true);
  assert.equal(resultado.advertencias.length, 1);
  assert.match(resultado.advertencias[0], /25 cm.*21\.4\.1/);
});

test("un f'c menor que 210 kg/cm2 advierte el minimo sismorresistente (E.060 21.3.1)", () => {
  assert.equal(FC_MIN_SISMICO, 210);
  const resultado = calcularColumna({ ...BASE, fc: 175 });
  assert.equal(resultado.ok, true);
  assert.equal(resultado.advertencias.length, 1);
  assert.match(resultado.advertencias[0], /210 kg\/cm².*21\.3\.1/);
});

test('una columna grande con cuantia alta se calcula y acumula varias advertencias', () => {
  const resultado = calcularColumna({ ...BASE, b: 60, h: 60, cuantia: 4, varilla: '1' });
  assert.equal(resultado.ok, true);
  assert.equal(resultado.barras.n, 30);
  assert.equal(resultado.acero.asRequerido, 144);
  assert.ok(resultado.advertencias.length >= 1);
});

/* ------------------------------------------------------------------ *
 * Forma del resultado (lo que consumen la interfaz y el widget)
 * ------------------------------------------------------------------ */

test('un resultado valido trae la forma completa que pintan la interfaz y el widget', () => {
  const resultado = calcularColumna(BASE);
  for (const clave of ['tipo', 'seccion', 'materiales', 'varilla', 'estribo', 'acero', 'barras', 'geometria', 'capacidad', 'alternativas']) {
    assert.ok(clave in resultado, `falta la clave "${clave}"`);
  }
  assert.ok(Array.isArray(resultado.alternativas) && resultado.alternativas.length > 0);
  assert.ok(resultado.acero.asColocado >= resultado.acero.asRequerido, 'el acero colocado cubre el requerido');
});

test('porcentaje formatea la cuantia con dos decimales', () => {
  assert.equal(porcentaje(0.01), '1.00');
  assert.equal(porcentaje(0.0106666), '1.07');
});
