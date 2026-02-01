import ExcelJS from 'exceljs';

interface ExcelExportOptions {
  filename: string;
  sheetName: string;
  headers: string[];
  data: (string | number)[][];
  totals?: { [key: string]: string | number };
}

/**
 * Загружает логотип Sellix из /logo.png как ArrayBuffer
 */
async function loadLogoAsBuffer(): Promise<ArrayBuffer> {
  const response = await fetch('/logo.png');
  if (!response.ok) {
    throw new Error('Failed to load logo.png');
  }
  return response.arrayBuffer();
}

/**
 * Экспортирует данные в Excel (.xlsx) с логотипом Sellix в правом верхнем углу
 * @param options - параметры экспорта
 */
export async function exportToExcel(options: ExcelExportOptions): Promise<void> {
  const { filename, sheetName, headers, data, totals } = options;

  // Создаём workbook и worksheet
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);

  // Добавляем заголовки (строка 1)
  worksheet.addRow(headers);

  // Стилизация заголовков
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E6FDB' }, // Sellix Blue
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.height = 25;

  // Устанавливаем ширину колонок
  headers.forEach((_, index) => {
    worksheet.getColumn(index + 1).width = 20;
  });

  // Добавляем данные (начиная со строки 2)
  data.forEach((row) => {
    const excelRow = worksheet.addRow(row);
    excelRow.alignment = { vertical: 'middle' };
    
    // Форматирование числовых колонок
    row.forEach((cell, colIndex) => {
      if (typeof cell === 'number' && cell > 1000) {
        // Числовой формат с разделителями тысяч
        excelRow.getCell(colIndex + 1).numFmt = '#,##0';
      }
    });
  });

  // Добавляем строку итогов, если есть
  if (totals) {
    const totalRow = worksheet.addRow(Object.values(totals));
    totalRow.font = { bold: true };
    totalRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF3F4F6' },
    };
    totalRow.border = {
      top: { style: 'medium', color: { argb: 'FF1E6FDB' } },
    };
  }

  // Добавляем границы для всех ячеек с данными
  worksheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        right: { style: 'thin', color: { argb: 'FFE5E7EB' } },
      };
    });
  });

  // Загружаем и добавляем логотип
  try {
    const logoBuffer = await loadLogoAsBuffer();
    const imageId = workbook.addImage({
      buffer: logoBuffer,
      extension: 'png',
    });

    // Определяем позицию логотипа в правом верхнем углу
    // Логотип будет в колонках после последней колонки данных
    const lastColumn = headers.length;
    const logoColumn = lastColumn + 1; // Колонка справа от данных
    
    // Добавляем изображение
    // Формат: { tl: { col, row }, br: { col, row } }
    // tl = top-left, br = bottom-right
    worksheet.addImage(imageId, {
      tl: { col: logoColumn, row: 0 } as any, // Начало: следующая колонка после данных, строка 0
      br: { col: logoColumn + 2, row: 4 } as any, // Конец: через 2 колонки и 4 строки
      editAs: 'oneCell',
    } as any);

    // Расширяем колонку логотипа для видимости
    worksheet.getColumn(logoColumn + 1).width = 15;
    worksheet.getColumn(logoColumn + 2).width = 15;
  } catch (error) {
    console.warn('Failed to add logo to Excel:', error);
    // Продолжаем без логотипа, если не удалось загрузить
  }

  // Генерируем и скачиваем файл
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
