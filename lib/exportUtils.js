// lib/exportUtils.js
import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

/**
 * Экспорт словаря в Anki CSV формат
 */
export async function exportToAnkiCSV(vocabulary, dialogTopic, targetLanguage, nativeLanguage) {
  try {
    // CSV Header (Front, Back, Example, Tags)
    let csvContent = 'Front,Back,Example,Tags\n';

    // Добавляем каждую колокацию
    vocabulary.forEach((item) => {
      const front = escapeCSV(item.collocation);
      const back = escapeCSV(item.translation);
      const example = item.example ? escapeCSV(item.example) : '';
      const tags = escapeCSV(`${targetLanguage} ${dialogTopic}`);

      csvContent += `"${front}","${back}","${example}","${tags}"\n`;
    });

    // Сохраняем файл
    const fileName = `${sanitizeFileName(dialogTopic)}_vocabulary.csv`;
    const fileUri = FileSystem.cacheDirectory + fileName;

    await FileSystem.writeAsStringAsync(fileUri, csvContent);

    // Показываем Share Sheet
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'text/csv',
        dialogTitle: 'Export to Anki',
        UTI: 'public.comma-separated-values-text',
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Error exporting to Anki CSV:', error);
    return { success: false, error };
  }
}

/**
 * Экспорт словаря в PDF
 */
export async function exportToPDF(vocabulary, dialogTopic, level) {
  try {
    // Генерируем HTML
    const html = generateVocabularyHTML(vocabulary, dialogTopic, level);

    // Конвертируем в PDF
    const { uri } = await Print.printToFileAsync({ html });

    // Переименовываем файл
    const fileName = `${sanitizeFileName(dialogTopic)}_vocabulary.pdf`;
    const newUri = FileSystem.cacheDirectory + fileName;

    await FileSystem.moveAsync({
      from: uri,
      to: newUri,
    });

    // Показываем Share Sheet
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(newUri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Export Vocabulary PDF',
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Error exporting to PDF:', error);
    return { success: false, error };
  }
}

// Вспомогательные функции
function escapeCSV(text) {
  if (!text) return '';
  return text.replace(/"/g, '""');
}

function sanitizeFileName(text) {
  return text.replace(/[^a-zA-Z0-9_\-]/g, '_').substring(0, 50);
}

function generateVocabularyHTML(vocabulary, topic, level) {
  const rows = vocabulary
    .map(
      (item, index) => `
      <tr>
        <td>${index + 1}</td>
        <td><strong>${item.collocation}</strong></td>
        <td>${item.translation}</td>
        <td style="font-style: italic; color: #666;">${item.example || '-'}</td>
      </tr>
    `,
    )
    .join('');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            padding: 40px;
            max-width: 800px;
            margin: 0 auto;
          }
          h1 {
            color: #2d3436;
            border-bottom: 3px solid #6ab04c;
            padding-bottom: 10px;
          }
          .meta {
            color: #636e72;
            margin-bottom: 30px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          th {
            background-color: #6ab04c;
            color: white;
            padding: 12px;
            text-align: left;
          }
          td {
            padding: 10px;
            border-bottom: 1px solid #dfe6e9;
          }
          tr:hover {
            background-color: #f5f6fa;
          }
        </style>
      </head>
      <body>
        <h1>${topic}</h1>
        <div class="meta">${level} | ${vocabulary.length} collocations</div>
        <table>
          <thead>
            <tr>
              <th style="width: 40px;">#</th>
              <th>Collocation</th>
              <th>Translation</th>
              <th>Example</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </body>
    </html>
  `;
}
